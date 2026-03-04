import 'dotenv/config';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import { fixSequence } from '../utils/sequenceFix.js';

/**
 * Quick script to create a super admin user with default credentials
 * Usage: node scripts/createSuperAdminQuick.js
 */
async function createSuperAdminQuick() {
  try {
    console.log('🔐 Creating Super Admin User (Quick Mode)\n');

    // Get SUPER_ADMIN role
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
    });

    if (!superAdminRole) {
      console.error('❌ SUPER_ADMIN role not found. Please run: npm run db:seed');
      process.exit(1);
    }

    // Default super admin credentials (change these!)
    const defaultAdmin = {
      name: 'Super Admin',
      email: 'admin@visitor.com',
      mobile: '9999999999',
      password: 'Admin@123', // Change this password!
    };

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: defaultAdmin.email }, { mobile: defaultAdmin.mobile }],
      },
    });

    if (existingUser) {
      console.log('⚠️  Super Admin already exists.');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Mobile: ${existingUser.mobile}`);
      console.log('\n💡 To create a new admin, use: npm run create:superadmin');
      process.exit(0);
    }

    // Fix PostgreSQL sequence if it's out of sync
    // This can happen if rows were manually deleted or inserted with specific IDs
    try {
      await prisma.$executeRawUnsafe(`
        SELECT setval(
          pg_get_serial_sequence('users', 'id'),
          COALESCE((SELECT MAX(id) FROM users), 0) + 1,
          true
        );
      `);
    } catch (seqError) {
      // If sequence fix fails, log but continue (might work anyway)
      console.warn('⚠️  Warning: Could not fix sequence:', seqError.message);
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(defaultAdmin.password, saltRounds);

    await fixSequence('users');
    // Create super admin user
    const _user = await prisma.user.create({
      data: {
        name: defaultAdmin.name,
        email: defaultAdmin.email,
        mobile: defaultAdmin.mobile,
        passwordHash,
        roleId: superAdminRole.id,
        status: 'ACTIVE',
        societyId: null, // Super admin doesn't belong to any society
      },
      include: {
        role: true,
      },
    });

    console.log('✅ Super Admin created successfully!');
    console.log('\n📋 Default Credentials:');
    console.log(`   Email: ${defaultAdmin.email}`);
    console.log(`   Mobile: ${defaultAdmin.mobile}`);
    console.log(`   Password: ${defaultAdmin.password}`);
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
    console.log('\n💡 To create a custom admin, use: npm run create:superadmin');
  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdminQuick();
