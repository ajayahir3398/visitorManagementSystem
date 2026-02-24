import 'dotenv/config';
import prisma from '../lib/prisma.js';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.log('⚠️  WARNING: This will DELETE ALL DATA from the database!');
    console.log('   (Roles and Subscription Plans will be preserved)');
    console.log('   This action CANNOT be undone.\n');

    const answer = await question('Are you sure you want to proceed? (yes/no): ');

    if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Operation cancelled.');
        rl.close();
        process.exit(0);
    }

    console.log('\n🗑️  Starting database cleanup...\n');

    try {
        // Delete in reverse order of dependencies to avoid foreign key constraints

        // 1. Notifications & Tokens
        console.log('Cleaning Notifications and Tokens...');
        await prisma.notification.deleteMany({});
        await prisma.fcmToken.deleteMany({});
        await prisma.refreshToken.deleteMany({});
        await prisma.otp.deleteMany({});

        // 2. Emergency
        console.log('Cleaning Emergency Module...');
        await prisma.emergencyResponse.deleteMany({});
        await prisma.emergencyRequest.deleteMany({});

        // 3. Notices
        console.log('Cleaning Notices...');
        await prisma.noticeRead.deleteMany({});
        await prisma.notice.deleteMany({});

        // 4. Rules & Violations
        console.log('Cleaning Rules...');
        await prisma.ruleViolation.deleteMany({});
        await prisma.rule.deleteMany({});

        // 5. Audit Logs
        console.log('Cleaning Audit Logs...');
        await prisma.auditLog.deleteMany({});

        // 6. Visitors & Approvals
        console.log('Cleaning Visitor Module...');
        await prisma.approval.deleteMany({});
        await prisma.visitorLog.deleteMany({});
        await prisma.preApprovedGuest.deleteMany({});
        await prisma.visitor.deleteMany({});

        // 7. Maintenance & Payments
        console.log('Cleaning Maintenance Module...');
        await prisma.maintenancePayment.deleteMany({});
        await prisma.maintenanceBill.deleteMany({});
        await prisma.tempMaintenanceBill.deleteMany({});
        await prisma.societyMaintenancePlan.deleteMany({});

        // 8. Units & Members
        console.log('Cleaning Units and Members...');
        await prisma.unitMember.deleteMany({});

        // 9. Society Financials
        console.log('Cleaning Society Financials...');
        await prisma.invoice.deleteMany({});
        await prisma.payment.deleteMany({}); // Society payments

        // 10. Core Infrastructure
        console.log('Cleaning Core Infrastructure...');
        await prisma.gate.deleteMany({});
        await prisma.unit.deleteMany({});
        await prisma.subscription.deleteMany({});

        // 11. Users
        // Note: Roles are preserved
        console.log('Cleaning Users...');
        await prisma.user.deleteMany({});

        // 12. Societies
        // Note: SubscriptionPlans are preserved
        console.log('Cleaning Societies...');
        await prisma.society.deleteMany({});

        console.log('\n✅ Database cleared successfully!');
        console.log('   (Roles and Subscription Plans were preserved)');

    } catch (error) {
        console.error('\n❌ Error clearing database:', error);
    } finally {
        rl.close();
        await prisma.$disconnect();
    }
}

main();
