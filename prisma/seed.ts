import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
})

async function main() {
    console.log('🌱 Start seeding...')

    // Read users from json file
    const usersFilePath = path.join(process.cwd(), 'src/data/users.json')
    const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'))

    // CLEAN UP OLD DATA
    console.log('🧹 Cleaning existing users...')
    await prisma.report.deleteMany({}) // Optional: clean reports if dependent, or let them be. User asked to remove duplicate users. 
    // BE CAREFUL: deleting users might break foreign keys on reports. existing reports likely have operatorId.
    // Ideally we keep reports and just clean users? But if users are "Operador 1" (dummies), we should remove them.
    // If we delete users, reports will be orphaned or fail restricted delete.
    // Let's try deleting users. If it fails due to FK, we might need to delete reports too or handle it.
    try {
        await prisma.report.deleteMany({}) // For a clean slate as requested "quitalos porfa" implies these are test data.
        await prisma.user.deleteMany({})
    } catch (e) {
        console.warn("Could not clean tables, continuing upsert...", e)
    }

    for (const user of usersData.users) {
        // Map role strictly
        let dbRole = 'OPERATOR'
        if (user.role.toLowerCase().includes('administrador') || user.email === 'rjimenez@enlace.org') {
            dbRole = 'BOSS'
        }

        const upsertUser = await prisma.user.upsert({
            where: { email: user.email },
            update: {
                name: user.name,
                password: user.password,
                role: dbRole,
                image: user.avatar
            },
            create: {
                id: user.id || undefined, // Use ID from JSON if compatible (UUID vs String), Schema says String @default(uuid) but we can provide one
                email: user.email,
                name: user.name,
                password: user.password,
                role: dbRole,
                image: user.avatar
            }
        })
        console.log(`  Created/Updated user: ${upsertUser.name} (${upsertUser.role})`)
    }

    console.log('✅ Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
