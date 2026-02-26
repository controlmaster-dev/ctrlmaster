import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

// Helper to convert date strings back to Date objects
function deserialize(data: any): any {
    if (Array.isArray(data)) return data.map(deserialize)
    if (data && typeof data === 'object') {
        for (const key in data) {
            if (typeof data[key] === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(data[key])) {
                data[key] = new Date(data[key])
            } else if (typeof data[key] === 'object') {
                data[key] = deserialize(data[key])
            }
        }
    }
    return data
}

async function main() {
    console.log('🚀 Starting restore to Supabase...')
    const rawData = fs.readFileSync('backup_data.json', 'utf-8')
    const data = deserialize(JSON.parse(rawData))

    console.log('🧹 Cleaning database...')
    // Delete in reverse dependency order
    await prisma.commentReaction.deleteMany()
    await prisma.reaction.deleteMany()
    await prisma.reportView.deleteMany()
    await prisma.attachment.deleteMany()
    await prisma.comment.deleteMany()
    await prisma.report.deleteMany() // Reports depend on Users
    await prisma.workSchedule.deleteMany()
    await prisma.task.deleteMany()
    await prisma.streamMetric.deleteMany()
    await prisma.validProgram.deleteMany()
    await prisma.user.deleteMany() // Users are root
    console.log('✨ Database clean.')

    // 1. Users
    console.log(`Upserting ${data.users.length} users...`)
    for (const item of data.users) {
        await prisma.user.upsert({
            where: { id: item.id },
            update: item,
            create: item
        })
    }

    // 2. Reports
    console.log(`Upserting ${data.reports.length} reports...`)
    for (const item of data.reports) {
        await prisma.report.upsert({
            where: { id: item.id },
            update: item,
            create: item
        })
    }

    // 3. ReportViews
    console.log(`Upserting ${data.reportViews.length} reportViews...`)
    for (const item of data.reportViews) {
        // Handle unique constraint manually if upsert fails on composite key for some reason, but prisma handles composite where
        await prisma.reportView.upsert({
            where: { userId_reportId: { userId: item.userId, reportId: item.reportId } },
            update: item,
            create: item
        })
    }

    // 4. Comments (careful with parentId)
    // Sort so parents come first? Or just upsert blindly and hope parents exist.
    // Ideally we sort by createdAt.
    console.log(`Upserting ${data.comments.length} comments...`)
    data.comments.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    for (const item of data.comments) {
        await prisma.comment.upsert({
            where: { id: item.id },
            update: item,
            create: item
        })
    }

    // 5. Reactions
    console.log(`Upserting ${data.reactions.length} reactions...`)
    for (const item of data.reactions) {
        await prisma.reaction.upsert({
            where: { authorId_reportId_emoji: { authorId: item.authorId, reportId: item.reportId, emoji: item.emoji } },
            update: item,
            create: item
        })
    }

    // 6. CommentReactions
    console.log(`Upserting ${data.commentReactions.length} commentReactions...`)
    for (const item of data.commentReactions) {
        await prisma.commentReaction.upsert({
            where: { authorId_commentId_emoji: { authorId: item.authorId, commentId: item.commentId, emoji: item.emoji } },
            update: item,
            create: item
        })
    }

    // 7. Attachments
    console.log(`Upserting ${data.attachments.length} attachments...`)
    for (const item of data.attachments) {
        await prisma.attachment.upsert({
            where: { id: item.id },
            update: item,
            create: item
        })
    }

    // 8. Tasks
    console.log(`Upserting ${data.tasks.length} tasks...`)
    for (const item of data.tasks) {
        await prisma.task.upsert({
            where: { id: item.id },
            update: item,
            create: item
        })
    }

    // 9. WorkSchedules
    console.log(`Upserting ${data.workSchedules.length} workSchedules...`)
    for (const item of data.workSchedules) {
        await prisma.workSchedule.upsert({
            where: { id: item.id },
            update: item,
            create: item
        })
    }

    // 10. StreamMetrics
    console.log(`Upserting ${data.streamMetrics.length} streamMetrics...`)
    for (const item of data.streamMetrics) {
        await prisma.streamMetric.upsert({
            where: { id: item.id },
            update: item,
            create: item
        })
    }

    // 11. ValidPrograms
    console.log(`Upserting ${data.validPrograms.length} validPrograms...`)
    for (const item of data.validPrograms) {
        await prisma.validProgram.upsert({
            where: { id: item.id },
            update: item,
            create: item
        })
    }

    console.log('✅ Restoration complete!')
}

main()
    .catch(e => {
        console.error(e)
        // process.exit(1) // Don't exit on first error, maybe just log?
        // But for migration strict exit is better.
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
