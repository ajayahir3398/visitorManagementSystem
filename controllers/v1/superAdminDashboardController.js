import { SuperAdminDashboardService } from '../../services/superAdminDashboardService.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const getSummary = asyncHandler(async (req, res) => {
  const summary = await SuperAdminDashboardService.getSummary();
  res.json({
    success: true,
    message: 'Dashboard summary retrieved successfully',
    data: summary,
  });
});

export const getRevenue = asyncHandler(async (req, res) => {
  const revenue = await SuperAdminDashboardService.getRevenue();
  res.json({
    success: true,
    message: 'Revenue summary retrieved successfully',
    data: revenue,
  });
});

export const getSubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await SuperAdminDashboardService.getSubscriptions();
  res.json({
    success: true,
    message: 'Subscription breakdown retrieved successfully',
    data: subscriptions,
  });
});

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await SuperAdminDashboardService.getNotifications(req.user.id);
  res.json({
    success: true,
    message: 'Notification stats retrieved successfully',
    data: notifications,
  });
});
