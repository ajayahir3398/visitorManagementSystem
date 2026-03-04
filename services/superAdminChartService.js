import prisma from '../lib/prisma.js';

export const SuperAdminChartService = {
  getSocietyStatusChart: async () => {
    const data = await prisma.subscription.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    return data.map((item) => ({
      status: item.status,
      count: item._count._all,
    }));
  },

  getMonthlyRevenueChart: async (year) => {
    const targetYear = parseInt(year) || new Date().getFullYear();

    const revenue = await prisma.$queryRawUnsafe(
      `
      SELECT
        TO_CHAR(paid_at, 'Mon') AS month,
        EXTRACT(MONTH FROM paid_at)::INT AS month_num,
        SUM(amount)::FLOAT AS total
      FROM payments
      WHERE status = 'SUCCESS'
        AND EXTRACT(YEAR FROM paid_at) = $1
      GROUP BY month, month_num
      ORDER BY month_num
    `,
      targetYear
    );

    return revenue.map((item) => ({
      month: item.month,
      amount: Math.round(item.total),
    }));
  },

  getVisitorTrendChart: async (year) => {
    const targetYear = parseInt(year) || new Date().getFullYear();

    const visitors = await prisma.$queryRawUnsafe(
      `
      SELECT
        TO_CHAR(entry_time, 'Mon') AS month,
        EXTRACT(MONTH FROM entry_time)::INT AS month_num,
        COUNT(*)::INT AS count
      FROM visitor_logs
      WHERE EXTRACT(YEAR FROM entry_time) = $1
      GROUP BY month, month_num
      ORDER BY month_num
    `,
      targetYear
    );

    return visitors.map((item) => ({
      month: item.month,
      count: item.count,
    }));
  },

  getPlanDistributionChart: async () => {
    const plans = await prisma.subscription.groupBy({
      by: ['planId'],
      _count: { _all: true },
    });

    const planIds = plans.map((p) => p.planId);
    const planDetails = await prisma.subscriptionPlan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, name: true },
    });

    const planMap = {};
    planDetails.forEach((p) => {
      planMap[p.id] = p.name;
    });

    return plans.map((item) => ({
      plan: planMap[item.planId] || `Plan #${item.planId}`,
      count: item._count._all,
    }));
  },

  getConversionChart: async () => {
    const [trial, paid] = await Promise.all([
      prisma.subscription.count({ where: { status: 'TRIAL' } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    ]);

    return { trial, paid };
  },

  getTopCitiesChart: async () => {
    const cities = await prisma.society.groupBy({
      by: ['city'],
      _count: { city: true },
      orderBy: {
        _count: { city: 'desc' },
      },
      take: 10,
      where: { city: { not: null } },
    });

    return cities.map((item) => ({
      city: item.city || 'Unknown',
      count: item._count.city,
    }));
  },
};
