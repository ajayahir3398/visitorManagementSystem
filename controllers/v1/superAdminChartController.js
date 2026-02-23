import prisma from '../../lib/prisma.js';

/**
 * Society Status Distribution (Pie Chart)
 * GET /api/v1/super-admin/charts/society-status
 * Access: SUPER_ADMIN only
 */
export const getSocietyStatusChart = async (req, res) => {
  try {
    const data = await prisma.subscription.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const chartData = data.map((item) => ({
      status: item.status,
      count: item._count._all,
    }));

    res.json({
      success: true,
      message: 'Society status chart data retrieved successfully',
      data: chartData,
    });
  } catch (error) {
    console.error('Get society status chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve society status chart data',
      error: error.message,
    });
  }
};

/**
 * Monthly Revenue (Line Chart)
 * GET /api/v1/super-admin/charts/revenue?year=2025
 * Access: SUPER_ADMIN only
 */
export const getMonthlyRevenueChart = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const revenue = await prisma.$queryRawUnsafe(`
      SELECT
        TO_CHAR(paid_at, 'Mon') AS month,
        EXTRACT(MONTH FROM paid_at)::INT AS month_num,
        SUM(amount)::FLOAT AS total
      FROM payments
      WHERE status = 'SUCCESS'
        AND EXTRACT(YEAR FROM paid_at) = $1
      GROUP BY month, month_num
      ORDER BY month_num
    `, year);

    const chartData = revenue.map((item) => ({
      month: item.month,
      amount: Math.round(item.total),
    }));

    res.json({
      success: true,
      message: 'Monthly revenue chart data retrieved successfully',
      data: chartData,
    });
  } catch (error) {
    console.error('Get monthly revenue chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve monthly revenue chart data',
      error: error.message,
    });
  }
};

/**
 * Visitor Trend (Bar Chart)
 * GET /api/v1/super-admin/charts/visitors?year=2025
 * Access: SUPER_ADMIN only
 */
export const getVisitorTrendChart = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const visitors = await prisma.$queryRawUnsafe(`
      SELECT
        TO_CHAR(entry_time, 'Mon') AS month,
        EXTRACT(MONTH FROM entry_time)::INT AS month_num,
        COUNT(*)::INT AS count
      FROM visitor_logs
      WHERE EXTRACT(YEAR FROM entry_time) = $1
      GROUP BY month, month_num
      ORDER BY month_num
    `, year);

    const chartData = visitors.map((item) => ({
      month: item.month,
      count: item.count,
    }));

    res.json({
      success: true,
      message: 'Visitor trend chart data retrieved successfully',
      data: chartData,
    });
  } catch (error) {
    console.error('Get visitor trend chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve visitor trend chart data',
      error: error.message,
    });
  }
};

/**
 * Plan Distribution (Donut Chart)
 * GET /api/v1/super-admin/charts/plan-distribution
 * Access: SUPER_ADMIN only
 */
export const getPlanDistributionChart = async (req, res) => {
  try {
    const plans = await prisma.subscription.groupBy({
      by: ['planId'],
      _count: { _all: true },
    });

    // Get plan names
    const planIds = plans.map((p) => p.planId);
    const planDetails = await prisma.subscriptionPlan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, name: true },
    });

    const planMap = {};
    planDetails.forEach((p) => {
      planMap[p.id] = p.name;
    });

    const chartData = plans.map((item) => ({
      plan: planMap[item.planId] || `Plan #${item.planId}`,
      count: item._count._all,
    }));

    res.json({
      success: true,
      message: 'Plan distribution chart data retrieved successfully',
      data: chartData,
    });
  } catch (error) {
    console.error('Get plan distribution chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve plan distribution chart data',
      error: error.message,
    });
  }
};

/**
 * Trial → Paid Conversion (Funnel Chart)
 * GET /api/v1/super-admin/charts/conversion
 * Access: SUPER_ADMIN only
 */
export const getConversionChart = async (req, res) => {
  try {
    const [trial, paid] = await Promise.all([
      prisma.subscription.count({ where: { status: 'TRIAL' } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    ]);

    res.json({
      success: true,
      message: 'Conversion chart data retrieved successfully',
      data: {
        trial,
        paid,
      },
    });
  } catch (error) {
    console.error('Get conversion chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversion chart data',
      error: error.message,
    });
  }
};

/**
 * Top Cities by Society Count (Horizontal Bar Chart)
 * GET /api/v1/super-admin/charts/top-cities
 * Access: SUPER_ADMIN only
 */
export const getTopCitiesChart = async (req, res) => {
  try {
    const cities = await prisma.society.groupBy({
      by: ['city'],
      _count: { _all: true },
      orderBy: {
        _count: {
          _all: 'desc',
        },
      },
      take: 10,
      where: {
        city: { not: null },
      },
    });

    const chartData = cities.map((item) => ({
      city: item.city || 'Unknown',
      count: item._count._all,
    }));

    res.json({
      success: true,
      message: 'Top cities chart data retrieved successfully',
      data: chartData,
    });
  } catch (error) {
    console.error('Get top cities chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve top cities chart data',
      error: error.message,
    });
  }
};
