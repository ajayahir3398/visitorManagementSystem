import { SocietyAdminChartService } from '../../services/societyAdminChartService.js';
import asyncHandler from '../../utils/asyncHandler.js';

/**
 * Monthly collection trend (Line chart)
 */
export const getMaintenanceCollectionChart = asyncHandler(async (req, res) => {
  const data = await SocietyAdminChartService.getMaintenanceCollectionChart(req.user.societyId);
  res.json({
    success: true,
    message: 'Maintenance collection chart data retrieved successfully',
    data,
  });
});

/**
 * Daily visitors last 7 days (Bar chart)
 */
export const getVisitorTrendChart = asyncHandler(async (req, res) => {
  const data = await SocietyAdminChartService.getVisitorTrendChart(req.user.societyId);
  res.json({
    success: true,
    message: 'Visitor trend chart data retrieved successfully',
    data,
  });
});

/**
 * Emergency type distribution (Pie chart)
 */
export const getEmergencyTypesChart = asyncHandler(async (req, res) => {
  const data = await SocietyAdminChartService.getEmergencyTypesChart(req.user.societyId);
  res.json({
    success: true,
    message: 'Emergency types chart data retrieved successfully',
    data,
  });
});

/**
 * Bill status breakdown (Donut chart)
 */
export const getMaintenanceStatusChart = asyncHandler(async (req, res) => {
  const data = await SocietyAdminChartService.getMaintenanceStatusChart(req.user.societyId);
  res.json({
    success: true,
    message: 'Maintenance status chart data retrieved successfully',
    data,
  });
});
