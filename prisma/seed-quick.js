const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const users = [
        { name: 'Gabriel Núñez', email: 'knunez@enlace.org', password: 'GzNr0908', role: 'OPERATOR' },
        { name: 'Alex Blanco', email: 'ablanco@enlace.org', password: 'apcr25', role: 'OPERATOR' },
        { name: 'Andrés Corea', email: 'acorea@enlace.org', password: 'Diosmenenice1220', role: 'OPERATOR' },
        { name: 'Diego Bolaños', email: 'dbolanos@enlace.org', password: 'Orlando2025!', role: 'OPERATOR' },
        { name: 'Josué Jimenez', email: 'jjimenez@enlace.org', password: 'joji25', role: 'OPERATOR' },
        { name: 'Itsary Gomez', email: 'igomez@enlace.org', password: 'igom25', role: 'OPERATOR' },
        { name: 'Ronald Jimenez', email: 'rjimenez@enlace.org', password: 'ronaldctrl', role: 'BOSS' }
    ]

    console.log('Seeding with REAL credentials...')

    for (const u of users) {
        const upsertUser = await prisma.user.upsert({
            where: { email: u.email },
            update: {
                name: u.name,
                password: u.password,
                role: u.role
            },
            create: {
                name: u.name,
                email: u.email,
                password: u.password,
                role: u.role
            }
        })
        console.log(`Updated/Created: ${upsertUser.name}`)
    }
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })
