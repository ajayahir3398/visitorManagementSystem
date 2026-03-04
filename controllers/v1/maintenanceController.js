import { MaintenanceService } from '../../services/maintenanceService.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import { sendNotificationToUnitResidents } from '../../utils/notificationHelper.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const payMaintenance = asyncHandler(async (req, res) => {
  const { finalBill, tempBill, payment } = await MaintenanceService.payMaintenance({
    ...req.body,
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.MAINTENANCE_BILL_PAID,
    entity: AUDIT_ENTITIES.MAINTENANCE_BILL,
    entityId: finalBill.id,
    description: `Maintenance bill of ₹${finalBill.amount} paid for unit ${tempBill.unit.unitNo} (Period: ${tempBill.period})`,
    req,
  });

  res.status(200).json({
    success: true,
    message: 'Maintenance paid successfully',
    data: { bill: finalBill, payment },
  });
});

export const getUpcomingMaintenance = asyncHandler(async (req, res) => {
  const data = await MaintenanceService.getUpcomingMaintenance({ reqUser: req.user });

  if (data.upcoming.length === 0 && data.outstanding.length === 0) {
    return res.json({
      success: true,
      message: 'No upcoming maintenance',
      data: { tempBills: [] },
    });
  }

  res.json({
    success: true,
    message: 'Upcoming and outstanding maintenance retrieved successfully',
    data,
  });
});

export const createCustomBill = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const { tempBill, unit } = await MaintenanceService.createCustomBill({
    ...req.body,
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: 'MAINTENANCE_BILL_GENERATED',
    entity: AUDIT_ENTITIES.MAINTENANCE_BILL,
    entityId: tempBill.id,
    description: `Custom bill generated for unit ${unit.unitNo}: ₹${amount}`,
    req,
  });

  try {
    sendNotificationToUnitResidents(
      unit.id,
      'New Maintenance Bill',
      `A new custom maintenance bill of ₹${amount} has been generated.`,
      {
        type: 'maintenance_bill',
        id: tempBill.id.toString(),
        screen: 'maintenance_bill_detail',
      }
    );
  } catch (notifError) {
    console.error('Error sending maintenance notifications:', notifError);
  }

  res.status(201).json({
    success: true,
    message: 'Custom maintenance bill created successfully',
    data: { tempBill },
  });
});

export const getMyBills = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { bills, total } = await MaintenanceService.getMyBills({
    ...req.query,
    reqUser: req.user,
  });

  res.json({
    success: true,
    message: bills.length === 0 ? 'No bills found' : 'My maintenance bills retrieved successfully',
    data: {
      bills,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: total ? Math.ceil(total / parseInt(limit)) : 0,
      },
    },
  });
});

export const getAdminMaintenanceBills = asyncHandler(async (req, res) => {
  const data = await MaintenanceService.getAdminMaintenanceBills({ reqUser: req.user });

  res.json({
    success: true,
    message: 'Society maintenance bills retrieved successfully',
    data,
  });
});

export const adminMarkBillPaid = asyncHandler(async (req, res) => {
  const { finalBill, payment } = await MaintenanceService.adminMarkBillPaid({
    ...req.body,
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: 'MAINTENANCE_MARKED_PAID',
    entity: AUDIT_ENTITIES.MAINTENANCE_BILL,
    entityId: finalBill.id,
    description: `Admin marked bill as paid (${payment.paymentMode}) for unit ${finalBill.unitId}`,
    req,
  });

  res.json({
    success: true,
    message: 'Bill marked as paid successfully',
    data: { bill: finalBill, payment },
  });
});

export const getSocietyBills = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { bills, total } = await MaintenanceService.getSocietyBills({
    ...req.query,
    reqUser: req.user,
  });

  res.json({
    success: true,
    message: 'Society bills retrieved successfully',
    data: {
      bills,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});
