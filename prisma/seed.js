import 'dotenv/config';
import prisma from '../lib/prisma.js';
import { fixSequence } from '../utils/sequenceFix.js';

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

  // First, update existing plans that might not have code/billingCycle
  const allPlans = await prisma.subscriptionPlan.findMany();
  const existingPlans = allPlans.filter(
    (plan) => !plan.code || !plan.billingCycle
  );

  for (const existingPlan of existingPlans) {
    // Update existing TRIAL plan
    if (existingPlan.name === 'TRIAL' || existingPlan.name === 'Trial Plan') {
      await prisma.subscriptionPlan.update({
        where: { id: existingPlan.id },
        data: {
          code: 'TRIAL',
          billingCycle: 'MONTHLY',
        },
      });
      console.log(`✅ Updated existing TRIAL plan with code and billingCycle`);
    }
  }

  // Seed subscription plans
  const plans = [
    {
      code: 'TRIAL',
      name: 'Trial Plan',
      price: 0,
      durationMonths: 0, // Trial is in days, not months
      billingCycle: 'MONTHLY', // Default for trial
      visitorLimit: null, // Unlimited for trial
      features: {
        trial: true,
        duration_days: 60,
        unlimited_visitors: true,
      },
      isActive: true,
    },
    {
      code: 'MONTHLY',
      name: 'Monthly Plan',
      price: 800,
      durationMonths: 1,
      billingCycle: 'MONTHLY',
      visitorLimit: null, // Unlimited for MVP
      features: {
        unlimited_visitors: true,
      },
      isActive: true,
    },
    {
      code: 'YEARLY',
      name: 'Yearly Plan',
      price: 8000,
      durationMonths: 12,
      billingCycle: 'YEARLY',
      visitorLimit: null, // Unlimited for MVP
      features: {
        unlimited_visitors: true,
      },
      isActive: true,
    },
  ];

  for (const plan of plans) {
    // Try to find by code first, then by name as fallback
    const existing = await prisma.subscriptionPlan.findFirst({
      where: {
        OR: [
          { code: plan.code },
          { name: plan.name },
        ],
      },
    });

    if (existing) {
      // Update existing plan
      await prisma.subscriptionPlan.update({
        where: { id: existing.id },
        data: plan,
      });
      console.log(`✅ Updated subscription plan ${plan.code}`);
    } else {
      // Create new plan
      await fixSequence('subscription_plans');
      await prisma.subscriptionPlan.create({
        data: plan,
      });
      console.log(`✅ Created subscription plan ${plan.code}`);
    }
  }

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

