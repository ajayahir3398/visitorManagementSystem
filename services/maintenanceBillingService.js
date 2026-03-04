import prisma from '../lib/prisma.js';
import { fixSequence } from '../utils/sequenceFix.js';
import { sendNotificationToUnitResidents } from '../utils/notificationHelper.js';

/**
 * Service to handle automated maintenance billing logic
 */
export const maintenanceBillingService = {
  /**
   * Get Financial Year for a given date
   * @param {Date} date
   * @returns {string} e.g. "2025-2026"
   */
  getFinancialYear: (date) => {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const fyStart = month >= 4 ? year : year - 1;
    return `${fyStart}-${fyStart + 1}`;
  },

  /**
   * Get Monthly period string for a given date
   * @param {Date} date
   * @returns {string} e.g. "2025-04"
   */
  getMonthlyPeriod: (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  },

  /**
   * Generate temporary maintenance bills for all units
   * Runs daily via cron
   */
  generateTempBills: async () => {
    console.log('--- Starting Daily Temp Bill Generation ---');
    try {
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const financialYear = maintenanceBillingService.getFinancialYear(today);
      const monthlyPeriod = maintenanceBillingService.getMonthlyPeriod(today);

      // 1. Get all societies with active maintenance plans
      const societies = await prisma.society.findMany({
        where: { status: 'ACTIVE' },
        include: {
          maintenancePlans: {
            where: { isActive: true },
          },
        },
      });

      for (const society of societies) {
        const plans = society.maintenancePlans;
        if (plans.length === 0) continue;

        const monthlyPlan = plans.find((p) => p.planType === 'MONTHLY');
        const yearlyPlan = plans.find((p) => p.planType === 'YEARLY');

        // 2. Get all units for this society
        const units = await prisma.unit.findMany({
          where: {
            societyId: society.id,
            status: 'ACTIVE',
          },
        });

        // Get a valid system user for 'createdBy'
        const systemUser = await prisma.user.findFirst({
          where: {
            OR: [
              { role: { name: 'SUPER_ADMIN' } },
              { role: { name: 'SOCIETY_ADMIN' }, societyId: society.id },
            ],
          },
        });

        // Fallback to ID 1 if no admin found (though unlikely in prod)
        const createdBy = systemUser ? systemUser.id : 1;

        for (const unit of units) {
          // 3. Check if unit has already paid for the YEAR
          const paidYearly = await prisma.maintenanceBill.findFirst({
            where: {
              unitId: unit.id,
              billCycle: 'YEARLY',
              period: financialYear,
              status: 'PAID',
            },
          });

          if (paidYearly) continue;

          // 4. Check if unit has already paid for the MONTH
          const paidMonthly = await prisma.maintenanceBill.findFirst({
            where: {
              unitId: unit.id,
              billCycle: 'MONTHLY',
              period: monthlyPeriod,
              status: 'PAID',
            },
          });

          if (paidMonthly) continue;

          // 5. Generate Temp Bills

          // MONTHLY (Always generated if not paid and not yearly paid)
          if (monthlyPlan) {
            const existingTempMonthly = await prisma.tempMaintenanceBill.findFirst({
              where: {
                unitId: unit.id,
                billCycle: 'MONTHLY',
                period: monthlyPeriod,
              },
            });

            if (!existingTempMonthly) {
              await fixSequence('temp_maintenance_bills');
              const monthlyBill = await prisma.tempMaintenanceBill.create({
                data: {
                  societyId: society.id,
                  unitId: unit.id,
                  billCycle: 'MONTHLY',
                  period: monthlyPeriod,
                  amount: monthlyPlan.amount,
                  dueDate: new Date(today.getFullYear(), today.getMonth(), 10), // Default 10th of month
                  createdBy: createdBy,
                },
              });

              // Send Notification
              try {
                sendNotificationToUnitResidents(
                  unit.id,
                  'Maintenance Bill Generated',
                  `Your monthly maintenance bill of ₹${monthlyPlan.amount} is generated for ${monthlyPeriod}.`,
                  {
                    type: 'maintenance_bill',
                    id: monthlyBill.id.toString(),
                    screen: 'maintenance_bill_detail',
                  }
                );
              } catch (e) {
                console.error(`Failed to send notification for unit ${unit.id}:`, e.message);
              }
            }
          }

          // YEARLY (Only generated in April)
          if (currentMonth === 4 && yearlyPlan) {
            const existingTempYearly = await prisma.tempMaintenanceBill.findFirst({
              where: {
                unitId: unit.id,
                billCycle: 'YEARLY',
                period: financialYear,
              },
            });

            if (!existingTempYearly) {
              await fixSequence('temp_maintenance_bills');
              const yearlyBill = await prisma.tempMaintenanceBill.create({
                data: {
                  societyId: society.id,
                  unitId: unit.id,
                  billCycle: 'YEARLY',
                  period: financialYear,
                  amount: yearlyPlan.amount,
                  dueDate: new Date(today.getFullYear(), today.getMonth(), 30), // End of April
                  createdBy: createdBy,
                },
              });

              // Send Notification
              try {
                sendNotificationToUnitResidents(
                  unit.id,
                  'yearly Maintenance Bill Generated',
                  `Your yearly maintenance bill of ₹${yearlyPlan.amount} is generated for ${financialYear}.`,
                  {
                    type: 'maintenance_bill',
                    id: yearlyBill.id.toString(),
                    screen: 'maintenance_bill_detail',
                  }
                );
              } catch (e) {
                console.error(`Failed to send notification for unit ${unit.id}:`, e.message);
              }
            }
          }
        }
      }
      console.log('--- Temp Bill Generation Completed Successfully ---');
    } catch (error) {
      console.error('Error generating temp bills:', error);
    }
  },
};
