import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
    console.log('📦 Starting backup from SQLite...')

    const data = {
        users: await prisma.user.findMany(),
        reports: await prisma.report.findMany(),
        reportViews: await prisma.reportView.findMany(),
        comments: await prisma.comment.findMany(),
        commentReactions: await prisma.commentReaction.findMany(),
        reactions: await prisma.reaction.findMany(),
        attachments: await prisma.attachment.findMany(),
        tasks: await prisma.task.findMany(),
        workSchedules: await prisma.workSchedule.findMany(),
        streamMetrics: await prisma.streamMetric.findMany(),
        validPrograms: await prisma.validProgram.findMany(),
    }

    fs.writeFileSync('backup_data.json', JSON.stringify(data, null, 2))
    console.log('✅ Backup complete! Saved to backup_data.json')
    console.log(`stats: 
      Users: ${data.users.length}
      Reports: ${data.reports.length}
      Tasks: ${data.tasks.length}
    `)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
