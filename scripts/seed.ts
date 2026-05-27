import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(dbUrl, { ssl: 'require', max: 1 });

// ── Helpers ────────────────────────────────────────────────────────
const SYSTEMS = ['Enlace', 'EJTV', 'Enlace USA', 'Todos'];
const CATEGORIES = ['Transmisión', 'Audio', 'Video', 'Equipos', 'Software', 'Falla Energética', 'Otros'];
const STATUSES = ['pending', 'in-progress', 'resolved'] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

// ── Sample problems (Spanish) ──────────────────────────────────────
const PROBLEMS = [
  'Señal de video congelada en el canal principal durante la transmisión en vivo.',
  'Audio con interferencia y ruido de fondo en la emisión matutina.',
  'El switcher de video no responde al cambiar entre cámaras.',
  'Pérdida total de señal en el transmisor principal.',
  'Falla en el sistema de iluminación del estudio B.',
  'El software de streaming se cerró inesperadamente durante la emisión.',
  'Corte de energía eléctrica afectó la continuidad de la transmisión.',
  'Microfonía inalámbrica con pérdida de señal intermitente.',
  'Servidor de archivos multimedia no accesible desde las estaciones de edición.',
  'Cámara 3 presenta líneas horizontales en la imagen.',
  'El sistema de monitoreo no muestra los niveles de audio correctamente.',
  'Problema de sincronización entre audio y video en la salida al aire.',
  'No se pudo establecer conexión con el satélite para el enlace internacional.',
  'El generador de caracteres dejó de funcionar a mitad de programa.',
  'Falla en la matriz de ruteo de señales, sin paso de video a monitores.',
  'Actualización de software provocó incompatibilidad con el sistema de automatización.',
  'Sobrecalentamiento en el rack de servidores del centro de datos.',
  'Interferencia electromagnética afectando la calidad de la señal de audio.',
];

// ── Main ───────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Start seeding...');

  const usersFilePath = path.join(process.cwd(), 'src/data/users.json');
  const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'));

  console.log('🧹 Cleaning existing data...');
  // Reverse FK order — tables referencing others must be deleted first
  await sql`DELETE FROM "CommentReaction"`;
  await sql`DELETE FROM "Reaction"`;
  await sql`DELETE FROM "Attachment"`;
  await sql`DELETE FROM "Comment"`;
  await sql`DELETE FROM "ReportView"`;
  await sql`DELETE FROM "Report"`;
  await sql`DELETE FROM "Task"`;
  await sql`DELETE FROM "WorkSchedule"`;
  await sql`DELETE FROM "SpecialEventShift"`;
  await sql`DELETE FROM "RegistrationCode"`;
  await sql`DELETE FROM "SessionToken"`;
  await sql`DELETE FROM "WeeklySchedule"`;
  await sql`DELETE FROM "User"`;
  await sql`DELETE FROM "Credential"`;
  await sql`DELETE FROM "StreamMetric"`;
  await sql`DELETE FROM "ValidProgram"`;
  await sql`DELETE FROM "SpecialEvent"`;

  // ── Seed users ───────────────────────────────────────────────────
  const createdUsers: { id: string; name: string; email: string }[] = [];

  for (const user of usersData.users) {
    let dbRole = 'OPERATOR';
    if (user.role.toLowerCase().includes('administrador') || user.email === 'rjimenez@enlace.org') {
      dbRole = 'BOSS';
    }

    const [upsertUser] = await sql`
      INSERT INTO "User" ("id", "email", "name", "password", "role", "image")
      VALUES (
        gen_random_uuid(),
        ${user.email},
        ${user.name},
        ${user.password},
        ${dbRole},
        ${user.avatar || null}
      )
      ON CONFLICT ("email")
      DO UPDATE SET
        "name" = EXCLUDED."name",
        "password" = EXCLUDED."password",
        "role" = EXCLUDED."role",
        "image" = EXCLUDED."image"
      RETURNING *
    `;
    createdUsers.push({ id: upsertUser.id, name: upsertUser.name, email: upsertUser.email });
    console.log(`  Created/Updated user: ${upsertUser.name} (${upsertUser.role})`);
  }

  // ── Seed reports ─────────────────────────────────────────────────
  console.log('\n📋 Creating sample reports...');

  // Only use operators (not BOSS) for report creation
  const operators = createdUsers.filter((u) => u.email !== 'rjimenez@enlace.org');
  let reportCount = 0;

  for (const operator of operators) {
    // Each operator gets 2-3 reports
    const numReports = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numReports; i++) {
      const status = pick(STATUSES);
      const dateStarted = randomDate(30);
      const dateResolved = status === 'resolved'
        ? new Date(dateStarted.getTime() + Math.floor(Math.random() * 48) * 3600_000)
        : null;

      await sql`
        INSERT INTO "Report" (
          "id", "operatorId", "operatorName", "operatorEmail",
          "problemDescription", "category", "priority",
          "status", "dateStarted", "dateResolved",
          "emailStatus", "updatedAt"
        )
        VALUES (
          gen_random_uuid(),
          ${operator.id},
          ${operator.name},
          ${operator.email},
          ${pick(PROBLEMS)},
          ${pick(CATEGORIES)},
          ${pick(SYSTEMS)},
          ${status},
          ${dateStarted.toISOString()},
          ${dateResolved ? dateResolved.toISOString() : null},
          'none',
          NOW()
        )
      `;
      reportCount++;
    }
  }

  console.log(`  ✅ ${reportCount} reports created`);

  // ── Summary ──────────────────────────────────────────────────────
  const [{ users }] = await sql`SELECT COUNT(*)::int AS users FROM "User"`;
  const [{ reports }] = await sql`SELECT COUNT(*)::int AS reports FROM "Report"`;
  console.log(`\n✅ Seeding finished. ${users} users, ${reports} reports.`);
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
  process.exit(1);
});
