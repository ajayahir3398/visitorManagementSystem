import 'dotenv/config';
import prisma from '../lib/prisma.js';

async function main() {
  console.log('Seeding database...');

  // Seed roles
  const roles = [
    { name: 'SUPER_ADMIN' },
    { name: 'SOCIETY_ADMIN' },
    { name: 'SECURITY' },
    { name: 'RESIDENT' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
    console.log(`✅ Role ${role.name} created/updated`);
  }

  // Seed TRIAL subscription plan
  await prisma.subscriptionPlan.upsert({
    where: { name: 'TRIAL' },
    update: {},
    create: {
      name: 'TRIAL',
      price: 0,
      durationMonths: 0, // Trial is in days, not months
      visitorLimit: null, // Unlimited for trial
      features: {
        trial: true,
        duration_days: 60,
        unlimited_visitors: true,
      },
      isActive: true,
    },
  });
  console.log('✅ TRIAL subscription plan created/updated');

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

