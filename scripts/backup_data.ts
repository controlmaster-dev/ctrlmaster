import postgres from 'postgres';
import fs from 'fs';
import 'dotenv/config';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(dbUrl, { ssl: 'require', max: 1 });

async function main() {
  console.log('📦 Starting backup from PostgreSQL...');

  const data = {
    users: await sql`SELECT * FROM "User"`,
    reports: await sql`SELECT * FROM "Report"`,
    reportViews: await sql`SELECT * FROM "ReportView"`,
    comments: await sql`SELECT * FROM "Comment"`,
    commentReactions: await sql`SELECT * FROM "CommentReaction"`,
    reactions: await sql`SELECT * FROM "Reaction"`,
    attachments: await sql`SELECT * FROM "Attachment"`,
    tasks: await sql`SELECT * FROM "Task"`,
    workSchedules: await sql`SELECT * FROM "WorkSchedule"`,
    streamMetrics: await sql`SELECT * FROM "StreamMetric"`,
    validPrograms: await sql`SELECT * FROM "ValidProgram"`,
  };

  fs.writeFileSync('backup_data.json', JSON.stringify(data, null, 2));
  console.log('✅ Backup complete! Saved to backup_data.json');
  console.log(`stats:
      Users: ${data.users.length}
      Reports: ${data.reports.length}
      Tasks: ${data.tasks.length}
    `);
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
  process.exit(1);
});
