import prisma from '../lib/prisma.js';

async function main() {
    console.log('Starting verification...');

    try {
        // 0. Find a role
        const role = await prisma.role.findFirst();
        if (!role) {
            throw new Error('No roles found in DB');
        }

        // 1. Create a dummy user
        // utilize a random mobile number to avoid unique constraint violation
        const randomMobile = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        const user = await prisma.user.create({
            data: {
                name: 'Test Notif User',
                mobile: randomMobile, // Random mobile
                roleId: role.id
            }
        });
        console.log('Created test user:', user.id, user.mobile);

        try {
            // 2. Create notification manually
            const notif = await prisma.notification.create({
                data: {
                    userId: user.id,
                    title: 'Test Notification',
                    body: 'This is a test body',
                    type: 'SYSTEM'
                }
            });
            console.log('Created notification:', notif.id);

            // 3. Fetch notifications
            const notifications = await prisma.notification.findMany({
                where: { userId: user.id }
            });
            console.log('Fetched notifications:', notifications.length);

            if (notifications.length !== 1) throw new Error('Expected 1 notification');
            if (notifications[0].title !== 'Test Notification') throw new Error('Title mismatch');

            // 4. Get unread count
            const unreadCount = await prisma.notification.count({
                where: { userId: user.id, isRead: false }
            });
            console.log('Unread count:', unreadCount);
            if (unreadCount !== 1) throw new Error('Expected unread count 1');

            // 5. Mark as read
            await prisma.notification.update({
                where: { id: notif.id },
                data: { isRead: true }
            });
            console.log('Marked as read');

            // 6. Verify unread count again
            const unreadCountAfter = await prisma.notification.count({
                where: { userId: user.id, isRead: false }
            });
            console.log('Unread count after:', unreadCountAfter);
            if (unreadCountAfter !== 0) throw new Error('Expected unread count 0');

            console.log('Verification SUCCESS!');

        } catch (e) {
            console.error('Verification FAILED:', e);
        } finally {
            // Cleanup
            console.log('Cleaning up...');
            await prisma.notification.deleteMany({ where: { userId: user.id } });
            await prisma.user.delete({ where: { id: user.id } });
            console.log('Cleanup done');
        }

    } catch (e) {
        console.error('Setup failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
