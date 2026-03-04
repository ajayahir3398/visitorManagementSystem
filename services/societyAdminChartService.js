import prisma from '../lib/prisma.js';

export const SocietyAdminChartService = {
  getMaintenanceCollectionChart: async (societyId) => {
    const data = await prisma.$queryRawUnsafe(
      `SELECT
         TO_CHAR(mp.paid_at, 'Mon') AS month,
         EXTRACT(MONTH FROM mp.paid_at)::INT AS month_num,
         SUM(mp.amount)::INT AS total
       FROM maintenance_payments mp
       JOIN maintenance_bills mb ON mp.bill_id = mb.id
       WHERE mb.society_id = $1
         AND mp.status = 'SUCCESS'
         AND mp.paid_at >= NOW() - INTERVAL '6 months'
       GROUP BY month, month_num
       ORDER BY month_num`,
      societyId
    );

    return data;
  },

  getVisitorTrendChart: async (societyId) => {
    const data = await prisma.$queryRawUnsafe(
      `SELECT
         TO_CHAR(entry_time, 'Dy DD Mon') AS day,
         entry_time::DATE AS date,
         COUNT(*)::INT AS count
       FROM visitor_logs
       WHERE society_id = $1
         AND entry_time >= NOW() - INTERVAL '7 days'
         AND entry_time IS NOT NULL
       GROUP BY day, date
       ORDER BY date`,
      societyId
    );

    return data;
  },

  getEmergencyTypesChart: async (societyId) => {
    const data = await prisma.emergencyRequest.groupBy({
      by: ['emergencyType'],
      where: { societyId },
      _count: { _all: true },
    });

    return data.map((item) => ({
      type: item.emergencyType,
      count: item._count._all,
    }));
  },

  getMaintenanceStatusChart: async (societyId) => {
    const data = await prisma.maintenanceBill.groupBy({
      by: ['status'],
      where: { societyId },
      _count: { _all: true },
    });

    return data.map((item) => ({
      status: item.status,
      count: item._count._all,
    }));
  },
};
