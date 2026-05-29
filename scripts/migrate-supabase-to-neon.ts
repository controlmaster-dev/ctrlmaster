


import postgres from 'postgres';
import 'dotenv/config';


const TABLES = [

  'User',
  'Credential',
  'StreamMetric',
  'ValidProgram',
  'SpecialEvent',
  'WeeklySchedule',


  'RegistrationCode',
  'SessionToken',


  'SpecialEventShift',


  'WorkSchedule',
  'Task',
  'Report',


  'ReportView',
  'Comment',
  'Reaction',
  'Attachment',


  'CommentReaction',
];


const SKIP_TABLES = ['_migrations'];

async function migrate() {
  const NEON_URL = process.env.DATABASE_URL;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_DIRECT_URL = process.env.SUPABASE_DIRECT_URL;

  if (!NEON_URL) {
    console.error('❌ DATABASE_URL (Neon) not set');
    process.exit(1);
  }
  if (!SUPABASE_URL && !SUPABASE_DIRECT_URL) {
    console.error('❌ SUPABASE_URL or SUPABASE_DIRECT_URL not set');
    process.exit(1);
  }

  console.log('🔌 Conectando a Supabase...');
  let supabaseOpts: any = { ssl: 'require', max: 3, idle_timeout: 30, connect_timeout: 10 };
  let supabase: ReturnType<typeof postgres>;
  try {
    supabase = postgres(SUPABASE_DIRECT_URL!, supabaseOpts);
    await supabase`SELECT 1`;
    console.log('   ✅ Conectado vía directa');
  } catch {
    console.log('   ⚠️  Conexión directa falló. Probando pooler (PgBouncer)...');
    supabase = postgres(SUPABASE_URL!, supabaseOpts);
    await supabase`SELECT 1`;
    console.log('   ✅ Conectado vía pooler');
  }

  console.log('🔌 Conectando a Neon...');
  const neon = postgres(NEON_URL!, {
    ssl: 'require',
    max: 3,
    idle_timeout: 30,
  });


  console.log('\n📊 Verificando Supabase...');
  const supabaseStats: Record<string, number> = {};
  for (const table of TABLES) {
    const [{ count }] = await supabase.unsafe(
      `SELECT COUNT(*)::int AS count FROM "${table}"`
    );
    supabaseStats[table] = count;
  }
  const totalSupabaseRows = Object.values(supabaseStats).reduce((a, b) => a + b, 0);
  console.log(`   Total de filas en Supabase: ${totalSupabaseRows}`);
  for (const [table, count] of Object.entries(supabaseStats)) {
    if (count > 0) {
      console.log(`   - ${table}: ${count} filas`);
    }
  }

  if (totalSupabaseRows === 0) {
    console.log('\n⚠️  Supabase está vacío. Nada que migrar.');
    await supabase.end();
    await neon.end();
    return;
  }


  console.log('\n📊 Verificando Neon...');
  const neonStats: Record<string, number> = {};
  for (const table of TABLES) {
    const [{ count }] = await neon.unsafe(
      `SELECT COUNT(*)::int AS count FROM "${table}"`
    );
    neonStats[table] = count;
  }
  const totalNeonRows = Object.values(neonStats).reduce((a, b) => a + b, 0);
  console.log(`   Total de filas en Neon: ${totalNeonRows}`);

  if (totalNeonRows > 0) {
    console.log('\n⚠️  Neon ya tiene datos. ¿Deseas LIMPIAR Neon antes de migrar?');
    console.log('   Escribe "SI" para continuar o cualquier otra cosa para cancelar.');


    const autoConfirm = process.argv.includes('--yes') || process.argv.includes('-y');
    if (autoConfirm) {
      console.log('   ✅ Confirmación automática (--yes). Limpiando Neon...');
    } else {

      const readline = (await import('readline')).default;
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const answer = await new Promise<string>((resolve) => {
        rl.question('   > ', resolve);
      });
      rl.close();
      if (answer.toLowerCase() !== 'si') {
        console.log('   ❌ Cancelado por el usuario.');
        await supabase.end();
        await neon.end();
        return;
      }
    }
  }


  console.log('\n🧹 Limpiando Neon (orden inverso de dependencias)...');

  const reversedTables = [...TABLES].reverse();
  for (const table of reversedTables) {
    if (SKIP_TABLES.includes(table)) continue;
    try {
      await neon.unsafe(`DELETE FROM "${table}"`);
      console.log(`   ✅ ${table} limpiada`);
    } catch (err: any) {
      console.error(`   ❌ Error limpiando ${table}:`, err.message);
    }
  }


  console.log('\n🚀 Migrando datos de Supabase a Neon...');
  let totalMigrated = 0;

  for (const table of TABLES) {
    if (SKIP_TABLES.includes(table)) continue;
    const rowCount = supabaseStats[table];
    if (rowCount === 0) {
      console.log(`   ⏭️  ${table}: vacía, saltando`);
      continue;
    }

    try {

      const rows = await supabase.unsafe(`SELECT * FROM "${table}"`);


      let inserted = 0;
      for (const row of rows) {
        const columns = Object.keys(row);
        const values = Object.values(row);


        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        const colNames = columns.map((c) => `"${c}"`).join(', ');

        try {
          await neon.unsafe(
            `INSERT INTO "${table}" (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          );
          inserted++;
        } catch (insertErr: any) {

          if (inserted === 0) {
            console.error(`   ⚠️  ${table}: primera fila falló: ${insertErr.message}`);

            break;
          }
        }
      }

      totalMigrated += inserted;
      console.log(`   ✅ ${table}: ${inserted}/${rowCount} filas migradas`);
    } catch (err: any) {
      console.error(`   ❌ ${table}: error leyendo de Supabase: ${err.message}`);
    }
  }


  console.log('\n📊 Verificando migración...');
  let neonTotalAfter = 0;
  for (const table of TABLES) {
    const [{ count }] = await neon.unsafe(
      `SELECT COUNT(*)::int AS count FROM "${table}"`
    );
    neonTotalAfter += count;
  }
  console.log(`   Total de filas migradas a Neon: ${neonTotalAfter}`);
  console.log(`   Total original en Supabase: ${totalSupabaseRows}`);

  if (neonTotalAfter === totalSupabaseRows) {
    console.log('\n🎉 ¡Migración completada exitosamente! Todas las filas coinciden.');
  } else {
    console.log(`\n⚠️  Diferencia: ${totalSupabaseRows - neonTotalAfter} filas no migraron.`);
    console.log('   Esto puede deberse a conflictos de clave única o datos inválidos.');
  }


  await supabase.end();
  await neon.end();
}

migrate().catch(async (err) => {
  console.error('\n❌ Error fatal:', err);
  process.exit(1);
});
