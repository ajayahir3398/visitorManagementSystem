/**
 * Migration script to update existing subscription_plans table
 * Adds code and billingCycle to existing plans
 *
 * Run: node scripts/migrateSubscriptionPlans.js
 */
import 'dotenv/config';
import prisma from '../lib/prisma.js';

async function migratePlans() {
  try {
    console.log('🔄 Starting subscription plans migration...');

    // Get all plans and filter those that need updating
    const allPlans = await prisma.subscriptionPlan.findMany();
    const plansToUpdate = allPlans.filter((plan) => !plan.code || !plan.billingCycle);

    console.log(`Found ${plansToUpdate.length} plan(s) to update`);

    for (const plan of plansToUpdate) {
      let code = plan.code;
      let billingCycle = plan.billingCycle;

      // Determine code and billingCycle based on plan name or duration
      if (!code) {
        if (plan.name === 'TRIAL' || plan.name === 'Trial Plan' || plan.price === 0) {
          code = 'TRIAL';
          billingCycle = billingCycle || 'MONTHLY';
        } else if (plan.durationMonths === 1) {
          code = 'MONTHLY';
          billingCycle = billingCycle || 'MONTHLY';
        } else if (plan.durationMonths === 12) {
          code = 'YEARLY';
          billingCycle = billingCycle || 'YEARLY';
        } else {
          // Generate a code from name if we can't determine
          code = plan.name.toUpperCase().replace(/\s+/g, '_').substring(0, 20);
          billingCycle = billingCycle || 'MONTHLY';
        }
      }

      if (!billingCycle) {
        billingCycle = plan.durationMonths === 12 ? 'YEARLY' : 'MONTHLY';
      }

      await prisma.subscriptionPlan.update({
        where: { id: plan.id },
        data: {
          code,
          billingCycle,
        },
      });

      console.log(
        `✅ Updated plan ${plan.id} (${plan.name}): code=${code}, billingCycle=${billingCycle}`
      );
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migratePlans().catch((error) => {
  console.error(error);
  process.exit(1);
});
