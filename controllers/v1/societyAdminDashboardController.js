import { SocietyAdminDashboardService } from '../../services/societyAdminDashboardService.js';
import asyncHandler from '../../utils/asyncHandler.js';

/**
 * KPI cards for society admin dashboard
 */
export const getOverview = asyncHandler(async (req, res) => {
  const data = await SocietyAdminDashboardService.getOverview(req.user.societyId);
  res.json({
    success: true,
    message: 'Dashboard overview retrieved successfully',
    data,
  });
});

/**
 * Financial overview for society admin dashboard
 */
export const getMaintenance = asyncHandler(async (req, res) => {
  const data = await SocietyAdminDashboardService.getMaintenance(req.user.societyId);
  res.json({
    success: true,
    message: 'Maintenance summary retrieved successfully',
    data,
  });
});

/**
 * Visitor activity summary for society admin dashboard
 */
export const getVisitors = asyncHandler(async (req, res) => {
  const data = await SocietyAdminDashboardService.getVisitors(req.user.societyId);
  res.json({
    success: true,
    message: 'Visitor summary retrieved successfully',
    data,
  });
});

/**
 * Emergency snapshot for society admin dashboard
 */
export const getEmergencies = asyncHandler(async (req, res) => {
  const data = await SocietyAdminDashboardService.getEmergencies(req.user.societyId);
  res.json({
    success: true,
    message: 'Emergency summary retrieved successfully',
    data,
  });
});

/**
 * Notice & communication summary for society admin dashboard
 */
export const getNotices = asyncHandler(async (req, res) => {
  const data = await SocietyAdminDashboardService.getNotices(req.user.societyId);
  res.json({
    success: true,
    message: 'Notice summary retrieved successfully',
    data,
  });
});

/**
 * Recent activity feed for society admin dashboard
 */
export const getActivity = asyncHandler(async (req, res) => {
  const data = await SocietyAdminDashboardService.getActivity(req.user.societyId);
  res.json({
    success: true,
    message: 'Recent activity retrieved successfully',
    data,
  });
});
