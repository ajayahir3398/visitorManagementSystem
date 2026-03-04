import { SuperAdminChartService } from '../../services/superAdminChartService.js';
import asyncHandler from '../../utils/asyncHandler.js';

/**
 * Society Status Distribution (Pie Chart)
 */
export const getSocietyStatusChart = asyncHandler(async (req, res) => {
  const data = await SuperAdminChartService.getSocietyStatusChart();
  res.json({
    success: true,
    message: 'Society status chart data retrieved successfully',
    data,
  });
});

/**
 * Monthly Revenue (Line Chart)
 */
export const getMonthlyRevenueChart = asyncHandler(async (req, res) => {
  const data = await SuperAdminChartService.getMonthlyRevenueChart(req.query.year);
  res.json({
    success: true,
    message: 'Monthly revenue chart data retrieved successfully',
    data,
  });
});

/**
 * Visitor Trend (Bar Chart)
 */
export const getVisitorTrendChart = asyncHandler(async (req, res) => {
  const data = await SuperAdminChartService.getVisitorTrendChart(req.query.year);
  res.json({
    success: true,
    message: 'Visitor trend chart data retrieved successfully',
    data,
  });
});

/**
 * Plan Distribution (Donut Chart)
 */
export const getPlanDistributionChart = asyncHandler(async (req, res) => {
  const data = await SuperAdminChartService.getPlanDistributionChart();
  res.json({
    success: true,
    message: 'Plan distribution chart data retrieved successfully',
    data,
  });
});

/**
 * Trial → Paid Conversion (Funnel Chart)
 */
export const getConversionChart = asyncHandler(async (req, res) => {
  const data = await SuperAdminChartService.getConversionChart();
  res.json({
    success: true,
    message: 'Conversion chart data retrieved successfully',
    data,
  });
});

/**
 * Top Cities by Society Count (Horizontal Bar Chart)
 */
export const getTopCitiesChart = asyncHandler(async (req, res) => {
  const data = await SuperAdminChartService.getTopCitiesChart();
  res.json({
    success: true,
    message: 'Top cities chart data retrieved successfully',
    data,
  });
});
