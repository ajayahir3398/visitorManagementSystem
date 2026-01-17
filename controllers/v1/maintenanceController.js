import prisma from '../../lib/prisma.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import { fixSequence } from '../../utils/sequenceFix.js';

/**
 * Pay maintenance and create final bill
 * POST /api/v1/maintenance/pay
 * Access: RESIDENT only
 */
export const payMaintenance = async (req, res) => {
    try {
        const { tempBillId, paymentMode, transactionId } = req.body;
        const userId = req.user.id;
        const societyId = req.user.society_id;

        if (!societyId) {
            return res.status(400).json({
                success: false,
                message: 'User is not associated with a society',
            });
        }

        // 1. Find Temp Bill
        const tempBill = await prisma.tempMaintenanceBill.findUnique({
            where: { id: parseInt(tempBillId) },
            include: { unit: true }
        });

        if (!tempBill) {
            return res.status(404).json({
                success: false,
                message: 'Upcoming maintenance bill not found',
            });
        }

        // 2. Verify unit ownership
        const unitMember = await prisma.unitMember.findFirst({
            where: {
                unitId: tempBill.unitId,
                userId: userId
            }
        });

        if (!unitMember) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. This unit does not belong to you.',
            });
        }

        // 3. Create Final Maintenance Bill
        await fixSequence('maintenance_bills');
        const finalBill = await prisma.maintenanceBill.create({
            data: {
                societyId: tempBill.societyId,
                unitId: tempBill.unitId,
                billCycle: tempBill.billCycle,
                period: tempBill.period,
                amount: tempBill.amount,
                dueDate: tempBill.dueDate,
                status: 'PAID', // Set to PAID immediately since this is part of payment flow
                createdBy: userId
            }
        });

        // 4. Create Maintenance Payment
        await fixSequence('maintenance_payments');
        const payment = await prisma.maintenancePayment.create({
            data: {
                billId: finalBill.id,
                paidBy: userId,
                amount: finalBill.amount,
                paymentMode: paymentMode,
                transactionId: transactionId || null,
                status: 'SUCCESS',
                paidAt: new Date()
            }
        });

        // 5. Cleanup Temp Bills
        if (tempBill.billCycle === 'YEARLY') {
            // If paying yearly, remove ALL temp bills for this unit in the same financial year
            // Specifically, remove the Monthly bill for April which was generated alongside.
            await prisma.tempMaintenanceBill.deleteMany({
                where: {
                    unitId: tempBill.unitId,
                    period: {
                        startsWith: tempBill.period.split('-')[0] // If period is "2025-2026", match "2025" for monthly periods like "2025-04"
                    }
                }
            });
        } else {
            // Just remove this specific monthly temp bill
            await prisma.tempMaintenanceBill.delete({
                where: { id: tempBill.id }
            });
        }

        // 6. Log Action
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
            data: {
                bill: finalBill,
                payment
            }
        });

    } catch (error) {
        console.error('Pay maintenance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process maintenance payment',
            error: error.message,
        });
    }
};

/**
 * Get upcoming maintenance (Temp Bills) for resident
 * GET /api/v1/maintenance/upcoming
 * Access: RESIDENT only
 */
export const getUpcomingMaintenance = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user units
        const userUnits = await prisma.unitMember.findMany({
            where: { userId },
            select: { unitId: true }
        });

        const unitIds = userUnits.map(um => um.unitId);

        if (unitIds.length === 0) {
            return res.json({
                success: true,
                message: 'No upcoming maintenance',
                data: { tempBills: [] }
            });
        }

        const [tempBills, outstandingBills] = await Promise.all([
            prisma.tempMaintenanceBill.findMany({
                where: {
                    unitId: { in: unitIds }
                },
                include: {
                    unit: true
                },
                orderBy: { dueDate: 'asc' }
            }),
            prisma.maintenanceBill.findMany({
                where: {
                    unitId: { in: unitIds },
                    status: { in: ['UNPAID', 'OVERDUE'] }
                },
                include: {
                    unit: true
                },
                orderBy: { dueDate: 'asc' }
            })
        ]);

        res.json({
            success: true,
            message: 'Upcoming and outstanding maintenance retrieved successfully',
            data: {
                upcoming: tempBills,
                outstanding: outstandingBills
            }
        });

    } catch (error) {
        console.error('Get upcoming maintenance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve upcoming maintenance',
            error: error.message,
        });
    }
};


/**
 * Create Custom Maintenance Bill (Ad-hoc)
 * POST /api/v1/maintenance/custom-bill
 * Access: SOCIETY_ADMIN only
 */
export const createCustomBill = async (req, res) => {
    try {
        const { unitId, amount, description, dueDate } = req.body;
        const societyId = req.user.society_id;
        const userId = req.user.id;

        // 1. Verify Unit
        const unit = await prisma.unit.findFirst({
            where: {
                id: parseInt(unitId),
                societyId: parseInt(societyId)
            }
        });

        if (!unit) {
            return res.status(404).json({
                success: false,
                message: 'Unit not found in this society',
            });
        }

        // 2. Generate Unique Period Identifier for Ad-hoc
        // Format: ADHOC-{Timestamp} to avoid collision
        const period = `ADHOC-${Date.now()}`;

        // 3. Create Temp Bill
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
                createdBy: userId
            }
        });

        // 4. Log Action
        await logAction({
            user: req.user,
            action: 'MAINTENANCE_BILL_GENERATED', // Using string directly as generic action
            entity: AUDIT_ENTITIES.MAINTENANCE_BILL,
            entityId: tempBill.id,
            description: `Custom bill generated for unit ${unit.unitNo}: ₹${amount}`,
            req,
        });

        res.status(201).json({
            success: true,
            message: 'Custom maintenance bill created successfully',
            data: { tempBill }
        });

    } catch (error) {
        console.error('Create custom bill error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create custom bill',
            error: error.message,
        });
    }
};

/**
 * Get current user's maintenance bills
 * GET /api/v1/maintenance/my-bills
 * Access: RESIDENT only
 */
export const getMyBills = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get user units first
        const userUnits = await prisma.unitMember.findMany({
            where: { userId },
            select: { unitId: true }
        });

        const unitIds = userUnits.map(um => um.unitId);

        if (unitIds.length === 0) {
            return res.json({
                success: true,
                message: 'No bills found',
                data: { bills: [], pagination: { total: 0 } }
            });
        }

        const where = {
            unitId: { in: unitIds }
        };

        if (status) {
            where.status = status;
        }

        const [bills, total] = await Promise.all([
            prisma.maintenanceBill.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    unit: true,
                    payments: true
                }
            }),
            prisma.maintenanceBill.count({ where })
        ]);

        res.json({
            success: true,
            message: 'My maintenance bills retrieved successfully',
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

    } catch (error) {
        console.error('Get my bills error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve maintenance bills',
            error: error.message,
        });
    }
};
