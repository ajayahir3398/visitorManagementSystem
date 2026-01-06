import prisma from '../../lib/prisma.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import { fixSequence } from '../../utils/sequenceFix.js';

/**
 * Create or Update Maintenance Plan
 * POST /api/v1/maintenance/plans
 * Access: SOCIETY_ADMIN
 */
export const upsertMaintenancePlan = async (req, res) => {
    try {
        const { planType, amount } = req.body;
        const societyId = req.user.society_id;

        if (!planType || !amount || isNaN(amount)) {
            return res.status(400).json({
                success: false,
                message: 'planType (MONTHLY/YEARLY) and amount are required',
            });
        }

        if (!['MONTHLY', 'YEARLY'].includes(planType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid planType. Must be MONTHLY or YEARLY',
            });
        }

        await fixSequence('society_maintenance_plans');

        const plan = await prisma.societyMaintenancePlan.upsert({
            where: {
                societyId_planType: {
                    societyId,
                    planType,
                },
            },
            update: {
                amount: parseInt(amount),
                isActive: true,
            },
            create: {
                societyId,
                planType,
                amount: parseInt(amount),
                isActive: true,
            },
        });

        await logAction({
            user: req.user,
            action: AUDIT_ACTIONS.MAINTENANCE_PLAN_UPSERTED,
            entity: AUDIT_ENTITIES.SOCIETY_MAINTENANCE_PLAN,
            entityId: plan.id,
            description: `${planType} maintenance plan set to ₹${amount} for society`,
            req,
        });

        res.json({
            success: true,
            message: `${planType} maintenance plan updated successfully`,
            data: plan,
        });
    } catch (error) {
        console.error('Upsert maintenance plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update maintenance plan',
            error: error.message,
        });
    }
};

/**
 * Get Maintenance Plans
 * GET /api/v1/maintenance/plans
 * Access: SOCIETY_ADMIN, RESIDENT
 */
export const getMaintenancePlans = async (req, res) => {
    try {
        const societyId = req.user.society_id;

        const plans = await prisma.societyMaintenancePlan.findMany({
            where: { societyId, isActive: true },
        });

        res.json({
            success: true,
            message: 'Maintenance plans retrieved successfully',
            data: plans,
        });
    } catch (error) {
        console.error('Get maintenance plans error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve maintenance plans',
            error: error.message,
        });
    }
};

/**
 * Generate Bulk Bills
 * POST /api/v1/maintenance/bills/generate
 * Access: SOCIETY_ADMIN
 */
export const generateBulkBills = async (req, res) => {
    try {
        const { billCycle, period, dueDate } = req.body;
        const societyId = req.user.society_id;

        if (!billCycle || !period || !dueDate) {
            return res.status(400).json({
                success: false,
                message: 'billCycle, period, and dueDate are required',
            });
        }

        // Get the maintenance plan for this cycle
        const plan = await prisma.societyMaintenancePlan.findUnique({
            where: {
                societyId_planType: {
                    societyId,
                    planType: billCycle,
                },
            },
        });

        if (!plan) {
            return res.status(400).json({
                success: false,
                message: `No ${billCycle} maintenance plan found. Please create one first.`,
            });
        }

        // Get all active units for the society
        const units = await prisma.unit.findMany({
            where: {
                societyId,
                status: 'ACTIVE',
            },
            select: { id: true, unitNo: true },
        });

        if (units.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No active units found in this society',
            });
        }

        await fixSequence('maintenance_bills');

        let createdCount = 0;
        let skippedCount = 0;

        for (const unit of units) {
            try {
                await prisma.maintenanceBill.create({
                    data: {
                        societyId,
                        unitId: unit.id,
                        billCycle,
                        period,
                        amount: plan.amount,
                        dueDate: new Date(dueDate),
                        status: 'UNPAID',
                        createdBy: req.user.id,
                    },
                });
                createdCount++;
            } catch (error) {
                // Skip duplicates (unique constraint on unitId, billCycle, period)
                if (error.code === 'P2002') {
                    skippedCount++;
                } else {
                    console.error(`Failed to generate bill for unit ${unit.unitNo}:`, error);
                }
            }
        }

        await logAction({
            user: req.user,
            action: AUDIT_ACTIONS.MAINTENANCE_BILL_GENERATED,
            entity: AUDIT_ENTITIES.MAINTENANCE_BILL,
            description: `Generated ${createdCount} bills for ${billCycle} ${period}`,
            req,
        });

        res.json({
            success: true,
            message: `Bill generation complete. Created: ${createdCount}, Skipped: ${skippedCount}`,
            data: { createdCount, skippedCount },
        });
    } catch (error) {
        console.error('Generate bills error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate bills',
            error: error.message,
        });
    }
};

/**
 * Create Single Maintenance Bill
 * POST /api/v1/maintenance/bills/single
 * Access: SOCIETY_ADMIN
 */
export const createSingleMaintenanceBill = async (req, res) => {
    try {
        const { unitId, billCycle, period, amount, dueDate } = req.body;
        const societyId = req.user.society_id;

        // 1️⃣ Basic validation
        if (!unitId || !billCycle || !period || !amount || !dueDate) {
            return res.status(400).json({
                success: false,
                message: 'unitId, billCycle, period, amount, and dueDate are required',
            });
        }

        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be a positive number',
            });
        }

        // 2️⃣ Verify unit belongs to admin's society
        const unit = await prisma.unit.findUnique({
            where: { id: parseInt(unitId) },
        });

        if (!unit || unit.societyId !== societyId) {
            return res.status(404).json({
                success: false,
                message: 'Unit not found or does not belong to your society',
            });
        }

        // 3️⃣ Prevent duplicate bills
        const existing = await prisma.maintenanceBill.findUnique({
            where: {
                unitId_billCycle_period: {
                    unitId: parseInt(unitId),
                    billCycle,
                    period,
                },
            },
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: `Bill already exists for this unit, cycle (${billCycle}), and period (${period})`,
            });
        }

        // 4️⃣ Check subscription status (locked societies cannot generate bills)
        const subscription = await prisma.subscription.findUnique({
            where: { societyId },
        });

        if (subscription && subscription.status === 'LOCKED') {
            return res.status(403).json({
                success: false,
                message: 'Your society is LOCKED. Please renew your subscription to generate bills.',
            });
        }

        await fixSequence('maintenance_bills');

        // 5️⃣ Create bill
        const bill = await prisma.maintenanceBill.create({
            data: {
                societyId,
                unitId: parseInt(unitId),
                billCycle,
                period,
                amount: parseInt(amount),
                dueDate: new Date(dueDate),
                createdBy: req.user.id,
            },
            include: {
                unit: {
                    select: { unitNo: true },
                },
            },
        });

        // 6️⃣ Audit log
        await logAction({
            user: req.user,
            action: AUDIT_ACTIONS.MAINTENANCE_BILL_GENERATED,
            entity: AUDIT_ENTITIES.MAINTENANCE_BILL,
            entityId: bill.id,
            description: `Single ${billCycle} bill of ₹${amount} created for unit ${bill.unit.unitNo}`,
            req,
        });

        res.status(201).json({
            success: true,
            message: 'Maintenance bill created successfully',
            data: bill,
        });
    } catch (error) {
        console.error('Create single bill error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create maintenance bill',
            error: error.message,
        });
    }
};

/**
 * Get Admin Bills (with filters)
 * GET /api/v1/maintenance/bills/admin
 * Access: SOCIETY_ADMIN
 */
export const getAdminBills = async (req, res) => {
    try {
        const { status, unitId, billCycle, period, page = 1, limit = 20 } = req.query;
        const societyId = req.user.society_id;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = { societyId };
        if (status) where.status = status;
        if (unitId) where.unitId = parseInt(unitId);
        if (billCycle) where.billCycle = billCycle;
        if (period) where.period = period;

        const [bills, total] = await Promise.all([
            prisma.maintenanceBill.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    unit: {
                        select: { unitNo: true, block: true, floor: true },
                    },
                    payments: true,
                },
            }),
            prisma.maintenanceBill.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                bills,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error('Get admin bills error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve bills',
            error: error.message,
        });
    }
};

/**
 * Get My Bills (Resident)
 * GET /api/v1/maintenance/bills/my
 * Access: RESIDENT
 */
export const getMyBills = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get units where this user is a member
        const unitMembers = await prisma.unitMember.findMany({
            where: { userId },
            select: { unitId: true },
        });

        const unitIds = unitMembers.map((m) => m.unitId);

        if (unitIds.length === 0) {
            return res.json({
                success: true,
                message: 'No units associated with this user',
                data: [],
            });
        }

        const bills = await prisma.maintenanceBill.findMany({
            where: {
                unitId: { in: unitIds },
            },
            include: {
                unit: {
                    select: { unitNo: true },
                },
                payments: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            success: true,
            data: bills,
        });
    } catch (error) {
        console.error('Get my bills error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve your bills',
            error: error.message,
        });
    }
};

/**
 * Pay Maintenance Bill
 * POST /api/v1/maintenance/bills/:id/pay
 * Access: RESIDENT
 */
export const payBill = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentMode, transactionId } = req.body;
        const userId = req.user.id;

        if (!paymentMode) {
            return res.status(400).json({
                success: false,
                message: 'paymentMode is required',
            });
        }

        const billId = parseInt(id);
        const bill = await prisma.maintenanceBill.findUnique({
            where: { id: billId },
            include: {
                unit: {
                    include: {
                        members: {
                            where: { userId },
                        },
                    },
                },
            },
        });

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found',
            });
        }

        // Verify resident belongs to the unit
        if (bill.unit.members.length === 0 && req.user.role_name !== 'SOCIETY_ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only pay bills for your own unit.',
            });
        }

        if (bill.status === 'PAID') {
            return res.status(400).json({
                success: false,
                message: 'This bill is already paid',
            });
        }

        await fixSequence('maintenance_payments');

        // Start transaction to record payment and update bill status
        const result = await prisma.$transaction(async (tx) => {
            const payment = await tx.maintenancePayment.create({
                data: {
                    billId,
                    paidBy: userId,
                    amount: bill.amount,
                    paymentMode,
                    transactionId,
                    status: 'SUCCESS',
                },
            });

            const updatedBill = await tx.maintenanceBill.update({
                where: { id: billId },
                data: { status: 'PAID' },
            });

            return { payment, updatedBill };
        });

        await logAction({
            user: req.user,
            action: AUDIT_ACTIONS.MAINTENANCE_BILL_PAID,
            entity: AUDIT_ENTITIES.MAINTENANCE_PAYMENT,
            entityId: result.payment.id,
            description: `Bill ID ${billId} of ₹${bill.amount} paid by ${req.user.name}`,
            req,
        });

        res.json({
            success: true,
            message: 'Payment recorded successfully',
            data: result,
        });
    } catch (error) {
        console.error('Pay bill error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process payment',
            error: error.message,
        });
    }
};
