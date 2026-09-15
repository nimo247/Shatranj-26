import { PrismaClient } from '@prisma/client'
import { ADMIN_KEYWORD } from '../src/config'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Database...')

  // Create Admin Team
  const admin = await prisma.team.upsert({
    where: { teamId: 'ADMIN' },
    update: {},
    create: {
      teamId: 'ADMIN',
      teamName: 'The Imperial Citadel (Admin)',
      region: 'Central High Plateau',
      password: ADMIN_KEYWORD,
      role: 'ADMIN',
      food: 999999,
      material: 999999,
      gold: 999999
    }
  })
  
  console.log(`Created Admin account with ID: ${admin.id}`)

  const standingOrderCount = await prisma.order.count({ where: { isAdminOrder: true } })
  if (standingOrderCount === 0) {
    await prisma.order.createMany({
      data: [
        { creatorId: admin.id, resourceType: 'FOOD', orderType: 'BUY', amount: 999999, price: 1, isAdminOrder: true },
        { creatorId: admin.id, resourceType: 'FOOD', orderType: 'SELL', amount: 999999, price: 2, isAdminOrder: true },
        { creatorId: admin.id, resourceType: 'MATERIAL', orderType: 'BUY', amount: 999999, price: 1, isAdminOrder: true },
        { creatorId: admin.id, resourceType: 'MATERIAL', orderType: 'SELL', amount: 999999, price: 2, isAdminOrder: true }
      ]
    })
  }

  await prisma.gameConfig.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, state: 'NOT_STARTED' }
  })

  console.log('Admin Standing Orders seeded successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
