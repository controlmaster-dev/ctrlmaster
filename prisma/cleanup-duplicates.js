const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const badEmails = [
        'alex@enlace.org',
        'gabriel@enlace.org',
        'andres@enlace.org',
        'diego@enlace.org',
        'josue@enlace.org',
        'itsary@enlace.org',
        'kevin@enlace.org'
    ]

    console.log('🧹 Removing duplicate/incorrect users (CASCADE)...')

    const usersToDelete = await prisma.user.findMany({
        where: { email: { in: badEmails } }
    })

    if (usersToDelete.length === 0) {
        console.log("No bad users found.")
        return
    }

    const ids = usersToDelete.map(u => u.id)
    console.log(`Found IDs to purge: ${ids}`)

    // CASCADE DELETE ALL RELATED RELATIONS MANUALLY
    // Comments, Reactions, Tasks, Reports (in correct order to respect FKs if any)

    // 1. Reactions
    await prisma.reaction.deleteMany({ where: { authorId: { in: ids } } })
    // 2. Comments
    await prisma.comment.deleteMany({ where: { authorId: { in: ids } } })
    // 3. Tasks
    await prisma.task.deleteMany({ where: { userId: { in: ids } } })
    // 4. Reports (Note: Reports might also have comments/reactions by OTHERS, but here we are deleting reports OWNED by bad users)
    // We need to delete reactions/comments on these reports first? Schema says onDelete: Cascade for Report relations.
    await prisma.report.deleteMany({ where: { operatorId: { in: ids } } })
    // 5. WorkSchedule
    await prisma.workSchedule.deleteMany({ where: { userId: { in: ids } } })

    // FINAL: Delete Users
    const { count } = await prisma.user.deleteMany({
        where: { id: { in: ids } }
    })

    console.log(`✅ Deleted ${count} incorrect users.`)
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })
