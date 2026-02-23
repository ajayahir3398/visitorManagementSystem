import prisma from '../../lib/prisma.js';

// ═══════════════════════════════════════════════════════════════
// 1️⃣  GET /maintenance-collection — Monthly collection trend (Line chart)
// ═══════════════════════════════════════════════════════════════
export const getMaintenanceCollectionChart = async (req, res) => {
  try {
    const societyId = req.user.societyId;

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

    res.json({
      success: true,
      message: 'Maintenance collection chart data retrieved successfully',
      data,
    });
  } catch (error) {
    console.error('Society chart maintenance-collection error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve maintenance collection chart data' });
  }
};

// ═══════════════════════════════════════════════════════════════
// 2️⃣  GET /visitor-trend — Daily visitors last 7 days (Bar chart)
// ═══════════════════════════════════════════════════════════════
export const getVisitorTrendChart = async (req, res) => {
  try {
    const societyId = req.user.societyId;

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

    res.json({
      success: true,
      message: 'Visitor trend chart data retrieved successfully',
      data,
    });
  } catch (error) {
    console.error('Society chart visitor-trend error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve visitor trend chart data' });
  }
};

// ═══════════════════════════════════════════════════════════════
// 3️⃣  GET /emergency-types — Emergency type distribution (Pie chart)
// ═══════════════════════════════════════════════════════════════
export const getEmergencyTypesChart = async (req, res) => {
  try {
    const societyId = req.user.societyId;

    const data = await prisma.emergencyRequest.groupBy({
      by: ['emergencyType'],
      where: { societyId },
      _count: { _all: true },
    });

    const formatted = data.map((item) => ({
      type: item.emergencyType,
      count: item._count._all,
    }));

    res.json({
      success: true,
      message: 'Emergency types chart data retrieved successfully',
      data: formatted,
    });
  } catch (error) {
    console.error('Society chart emergency-types error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve emergency types chart data' });
  }
};

// ═══════════════════════════════════════════════════════════════
// 4️⃣  GET /maintenance-status — Bill status breakdown (Donut chart)
// ═══════════════════════════════════════════════════════════════
export const getMaintenanceStatusChart = async (req, res) => {
  try {
    const societyId = req.user.societyId;

    const data = await prisma.maintenanceBill.groupBy({
      by: ['status'],
      where: { societyId },
      _count: { _all: true },
    });

    const formatted = data.map((item) => ({
      status: item.status,
      count: item._count._all,
    }));

    res.json({
      success: true,
      message: 'Maintenance status chart data retrieved successfully',
      data: formatted,
    });
  } catch (error) {
    console.error('Society chart maintenance-status error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve maintenance status chart data' });
  }
};
