import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const seedUsers = [
    {
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash,
      role: Role.ADMIN,
    },
    {
      name: 'Sales Manager',
      email: 'sales@example.com',
      passwordHash,
      role: Role.SALES,
    },
    {
      name: 'Warehouse Operator',
      email: 'warehouse@example.com',
      passwordHash,
      role: Role.WAREHOUSE,
    },
    {
      name: 'Accounts Specialist',
      email: 'accounts@example.com',
      passwordHash,
      role: Role.ACCOUNTS,
    },
  ];

  for (const user of seedUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        passwordHash: user.passwordHash,
      },
      create: user,
    });
    console.log(`👤 User seeded: ${user.email} (${user.role})`);
  }

  console.log('✅ Base user accounts seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
