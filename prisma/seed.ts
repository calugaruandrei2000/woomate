import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Creează user admin
  const adminPassword = await hashPassword(
    process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeThisPassword123!'
  )

  const admin = await prisma.user.upsert({
    where: { email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@woomate.com' },
    update: {},
    create: {
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@woomate.com',
      name: process.env.DEFAULT_ADMIN_NAME || 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  })

  console.log('✅ Admin user created:', admin.email)

  // Creează un tenant demo (opțional)
  const demoTenant = await prisma.tenant.upsert({
    where: { id: 'demo-tenant' },
    update: {},
    create: {
      id: 'demo-tenant',
      name: 'Demo Store',
      domain: 'demo.woomate.local',
      isActive: true,
    },
  })

  console.log('✅ Demo tenant created:', demoTenant.name)

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
