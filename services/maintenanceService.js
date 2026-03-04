import prisma from '../lib/prisma.js';
import { fixSequence } from '../utils/sequenceFix.js';

export const MaintenanceService = {
  payMaintenance: async ({ tempBillId, paymentMode, transactionId, reqUser }) => {
    const userId = reqUser.id;
    const societyId = reqUser.society_id;

    if (!societyId) throw { status: 400, message: 'User is not associated with a society' };

    const tempBill = await prisma.tempMaintenanceBill.findUnique({
      where: { id: parseInt(tempBillId) },
      include: { unit: true },
    });

    if (!tempBill) throw { status: 404, message: 'Upcoming maintenance bill not found' };

    const unitMember = await prisma.unitMember.findFirst({
      where: { unitId: tempBill.unitId, userId: userId },
    });

    if (!unitMember)
      throw { status: 403, message: 'Access denied. This unit does not belong to you.' };

    await fixSequence('maintenance_bills');
    const finalBill = await prisma.maintenanceBill.create({
      data: {
        societyId: tempBill.societyId,
        unitId: tempBill.unitId,
        billCycle: tempBill.billCycle,
        period: tempBill.period,
        amount: tempBill.amount,
        dueDate: tempBill.dueDate,
        status: 'PAID',
        createdBy: userId,
      },
    });

    await fixSequence('maintenance_payments');
    const payment = await prisma.maintenancePayment.create({
      data: {
        billId: finalBill.id,
        paidBy: userId,
        amount: finalBill.amount,
        paymentMode: paymentMode,
        transactionId: transactionId || null,
        status: 'SUCCESS',
        paidAt: new Date(),
      },
    });

    if (tempBill.billCycle === 'YEARLY') {
      await prisma.tempMaintenanceBill.deleteMany({
        where: {
          unitId: tempBill.unitId,
          period: { startsWith: tempBill.period.split('-')[0] },
        },
      });
    } else {
      await prisma.tempMaintenanceBill.delete({ where: { id: tempBill.id } });
    }

    return { finalBill, tempBill, payment };
  },

  getUpcomingMaintenance: async ({ reqUser }) => {
    const userId = reqUser.id;

    const userUnits = await prisma.unitMember.findMany({
      where: { userId },
      select: { unitId: true },
    });

    const unitIds = userUnits.map((um) => um.unitId);

    if (unitIds.length === 0) return { upcoming: [], outstanding: [] };

    const [tempBills, outstandingBills] = await Promise.all([
      prisma.tempMaintenanceBill.findMany({
        where: { unitId: { in: unitIds } },
        include: { unit: true },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.maintenanceBill.findMany({
        where: { unitId: { in: unitIds }, status: { in: ['UNPAID', 'OVERDUE'] } },
        include: { unit: true },
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    return { upcoming: tempBills, outstanding: outstandingBills };
  },

  createCustomBill: async ({ unitId, amount, description, dueDate, reqUser }) => {
    const societyId = reqUser.society_id;
    const userId = reqUser.id;

    const unit = await prisma.unit.findFirst({
      where: { id: parseInt(unitId), societyId: parseInt(societyId) },
    });

    if (!unit) throw { status: 404, message: 'Unit not found in this society' };

    const period = `ADHOC-${Date.now()}`;

    await fixSequence('temp_maintenance_bills');
    const tempBill = await prisma.tempMaintenanceBill.create({
      data: {
        societyId: parseInt(societyId),
        unitId: parseInt(unitId),
        billCycle: 'SPECIAL',
        period: period,
        amount: parseInt(amount),
        dueDate: new Date(dueDate),
        description: description || 'Custom Maintenance Charge',
        createdBy: userId,
      },
    });

    return { tempBill, unit };
  },

  getMyBills: async ({ page = 1, limit = 10, status, reqUser }) => {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const userId = reqUser.id;

    const userUnits = await prisma.unitMember.findMany({
      where: { userId },
      select: { unitId: true },
    });

    const unitIds = userUnits.map((um) => um.unitId);

    if (unitIds.length === 0) return { bills: [], total: 0 };

    const where = { unitId: { in: unitIds } };
    if (status) where.status = status;

    const [bills, total] = await Promise.all([
      prisma.maintenanceBill.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { unit: true, payments: true },
      }),
      prisma.maintenanceBill.count({ where }),
    ]);

    return { bills, total };
  },

  getAdminMaintenanceBills: async ({ reqUser }) => {
    const societyId = reqUser.society_id;

    const [tempBills, outstandingBills] = await Promise.all([
      prisma.tempMaintenanceBill.findMany({
        where: { societyId: societyId },
        include: { unit: true },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.maintenanceBill.findMany({
        where: { societyId: societyId, status: { in: ['UNPAID', 'OVERDUE'] } },
        include: { unit: true },
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    return { upcoming: tempBills, outstanding: outstandingBills };
  },

  adminMarkBillPaid: async ({ billType, billId, paymentMode, transactionId, reqUser }) => {
    const societyId = reqUser.society_id;
    const adminId = reqUser.id;

    let targetUnitId;
    let finalBill;

    if (billType === 'TEMP') {
      const tempBill = await prisma.tempMaintenanceBill.findUnique({
        where: { id: parseInt(billId) },
        include: { unit: true },
      });

      if (!tempBill) throw { status: 404, message: 'Temporary bill not found' };
      if (tempBill.societyId !== societyId) throw { status: 403, message: 'Access denied' };

      targetUnitId = tempBill.unitId;

      await fixSequence('maintenance_bills');
      finalBill = await prisma.maintenanceBill.create({
        data: {
          societyId: tempBill.societyId,
          unitId: tempBill.unitId,
          billCycle: tempBill.billCycle,
          period: tempBill.period,
          amount: tempBill.amount,
          dueDate: tempBill.dueDate,
          description: tempBill.description,
          status: 'PAID',
          createdBy: tempBill.createdBy,
        },
      });

      if (tempBill.billCycle === 'YEARLY') {
        await prisma.tempMaintenanceBill.deleteMany({
          where: { unitId: tempBill.unitId, period: { startsWith: tempBill.period.split('-')[0] } },
        });
      } else {
        await prisma.tempMaintenanceBill.delete({ where: { id: tempBill.id } });
      }
    } else if (billType === 'FINAL') {
      finalBill = await prisma.maintenanceBill.findUnique({
        where: { id: parseInt(billId) },
        include: { unit: true },
      });

      if (!finalBill) throw { status: 404, message: 'Maintenance bill not found' };
      if (finalBill.societyId !== societyId) throw { status: 403, message: 'Access denied' };
      if (finalBill.status === 'PAID') throw { status: 400, message: 'Bill is already paid' };

      targetUnitId = finalBill.unitId;

      finalBill = await prisma.maintenanceBill.update({
        where: { id: finalBill.id },
        data: { status: 'PAID' },
      });
    } else {
      throw { status: 400, message: 'Invalid bill type' };
    }

    const unitMember = await prisma.unitMember.findFirst({
      where: { unitId: targetUnitId, isPrimary: true },
    });
    const paidByUserId = unitMember ? unitMember.userId : adminId;

    await fixSequence('maintenance_payments');
    const payment = await prisma.maintenancePayment.create({
      data: {
        billId: finalBill.id,
        paidBy: paidByUserId,
        amount: finalBill.amount,
        paymentMode: paymentMode || 'CASH',
        transactionId: transactionId || null,
        status: 'SUCCESS',
        paidAt: new Date(),
      },
    });

    return { finalBill, payment };
  },

  getSocietyBills: async ({ page = 1, limit = 10, unitId, reqUser }) => {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const societyId = reqUser.society_id;
    const where = { societyId: societyId, status: 'PAID' };

    if (unitId) where.unitId = parseInt(unitId);

    const [bills, total] = await Promise.all([
      prisma.maintenanceBill.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { unit: true, payments: true, admin: { select: { name: true, id: true } } },
      }),
      prisma.maintenanceBill.count({ where }),
    ]);

    return { bills, total };
  },
};
