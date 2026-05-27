import postgres from 'postgres';
import fs from 'fs';
import 'dotenv/config';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(dbUrl, { ssl: 'require', max: 1 });

function deserialize(data: any): any {
  if (Array.isArray(data)) return data.map(deserialize);
  if (data && typeof data === 'object') {
    for (const key in data) {
      if (typeof data[key] === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(data[key])) {
        data[key] = new Date(data[key]);
      } else if (typeof data[key] === 'object') {
        data[key] = deserialize(data[key]);
      }
    }
  }
  return data;
}

async function main() {
  console.log('🚀 Starting restore...');
  const rawData = fs.readFileSync('backup_data.json', 'utf-8');
  const data = deserialize(JSON.parse(rawData));

  console.log('🧹 Cleaning database...');
  await sql`DELETE FROM "CommentReaction"`;
  await sql`DELETE FROM "Reaction"`;
  await sql`DELETE FROM "ReportView"`;
  await sql`DELETE FROM "Attachment"`;
  await sql`DELETE FROM "Comment"`;
  await sql`DELETE FROM "Report"`;
  await sql`DELETE FROM "WorkSchedule"`;
  await sql`DELETE FROM "Task"`;
  await sql`DELETE FROM "StreamMetric"`;
  await sql`DELETE FROM "ValidProgram"`;
  await sql`DELETE FROM "User"`;
  console.log('✨ Database clean.');

  // Users
  console.log(`Upserting ${data.users.length} users...`);
  for (const item of data.users) {
    await sql`
      INSERT INTO "User" ${sql(item)}
      ON CONFLICT ("id") DO UPDATE SET ${sql(item)}
    `;
  }

  // Reports
  console.log(`Upserting ${data.reports.length} reports...`);
  for (const item of data.reports) {
    await sql`
      INSERT INTO "Report" ${sql(item)}
      ON CONFLICT ("id") DO UPDATE SET ${sql(item)}
    `;
  }

  // ReportViews (composite unique)
  console.log(`Upserting ${data.reportViews.length} reportViews...`);
  for (const item of data.reportViews) {
    await sql`
      INSERT INTO "ReportView" ${sql(item)}
      ON CONFLICT ("userId", "reportId") DO UPDATE SET ${sql(item)}
    `;
  }

  // Comments
  console.log(`Upserting ${data.comments.length} comments...`);
  data.comments.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  for (const item of data.comments) {
    await sql`
      INSERT INTO "Comment" ${sql(item)}
      ON CONFLICT ("id") DO UPDATE SET ${sql(item)}
    `;
  }

  // Reactions (composite unique)
  console.log(`Upserting ${data.reactions.length} reactions...`);
  for (const item of data.reactions) {
    await sql`
      INSERT INTO "Reaction" ${sql(item)}
      ON CONFLICT ("authorId", "reportId", "emoji") DO UPDATE SET ${sql(item)}
    `;
  }

  // CommentReactions (composite unique)
  console.log(`Upserting ${data.commentReactions.length} commentReactions...`);
  for (const item of data.commentReactions) {
    await sql`
      INSERT INTO "CommentReaction" ${sql(item)}
      ON CONFLICT ("authorId", "commentId", "emoji") DO UPDATE SET ${sql(item)}
    `;
  }

  // Attachments
  console.log(`Upserting ${data.attachments.length} attachments...`);
  for (const item of data.attachments) {
    await sql`
      INSERT INTO "Attachment" ${sql(item)}
      ON CONFLICT ("id") DO UPDATE SET ${sql(item)}
    `;
  }

  // Tasks
  console.log(`Upserting ${data.tasks.length} tasks...`);
  for (const item of data.tasks) {
    await sql`
      INSERT INTO "Task" ${sql(item)}
      ON CONFLICT ("id") DO UPDATE SET ${sql(item)}
    `;
  }

  // WorkSchedules
  console.log(`Upserting ${data.workSchedules.length} workSchedules...`);
  for (const item of data.workSchedules) {
    await sql`
      INSERT INTO "WorkSchedule" ${sql(item)}
      ON CONFLICT ("id") DO UPDATE SET ${sql(item)}
    `;
  }

  // StreamMetrics
  console.log(`Upserting ${data.streamMetrics.length} streamMetrics...`);
  for (const item of data.streamMetrics) {
    await sql`
      INSERT INTO "StreamMetric" ${sql(item)}
      ON CONFLICT ("id") DO UPDATE SET ${sql(item)}
    `;
  }

  // ValidPrograms
  console.log(`Upserting ${data.validPrograms.length} validPrograms...`);
  for (const item of data.validPrograms) {
    await sql`
      INSERT INTO "ValidProgram" ${sql(item)}
      ON CONFLICT ("id") DO UPDATE SET ${sql(item)}
    `;
  }

  console.log('✅ Restoration complete!');
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
  process.exit(1);
});
