import 'dotenv/config';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import readline from 'readline';
import { fixSequence } from '../utils/sequenceFix.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createSuperAdmin() {
  try {
    console.log('🔐 Creating Super Admin User\n');

    // Get SUPER_ADMIN role
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
    });

    if (!superAdminRole) {
      console.error('❌ SUPER_ADMIN role not found. Please run: npm run db:seed');
      process.exit(1);
    }

    // Get user input
    const name = await question('Enter name: ');
    const email = await question('Enter email: ');
    const mobile = await question('Enter mobile (10 digits): ');
    const password = await question('Enter password: ');

    // Validate mobile
    if (!/^[0-9]{10}$/.test(mobile)) {
      console.error('❌ Invalid mobile number. Must be 10 digits.');
      process.exit(1);
    }

    // Validate email
    if (!email.includes('@')) {
      console.error('❌ Invalid email format.');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { mobile }],
      },
    });

    if (existingUser) {
      console.error('❌ User with this email or mobile already exists.');
      process.exit(1);
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await fixSequence('users');

    // Create super admin user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        mobile,
        passwordHash,
        roleId: superAdminRole.id,
        status: 'ACTIVE',
        societyId: null, // Super admin doesn't belong to any society
      },
      include: {
        role: true,
      },
    });

    console.log('\n✅ Super Admin created successfully!');
    console.log('\n📋 User Details:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Mobile: ${user.mobile}`);
    console.log(`   Role: ${user.role.name}`);
    console.log(`   Status: ${user.status}`);
    console.log('\n💡 You can now login using:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createSuperAdmin();
