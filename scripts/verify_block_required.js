import _axios from 'axios';
import 'dotenv/config';

const _API_URL = `http://localhost:${process.env.PORT || 1111}/api/v1`;

async function _testMandatoryBlock() {
  console.log('Testing mandatory block field...');

  // 1. Login to get token (assuming a superadmin or society admin exists)
  // For verification, I'll use a manual check if possible, or just look at the code.
  // However, I can create a temporary test script that uses the existing DB.

  console.log('Note: This script requires a running server and valid credentials.');
  console.log('I will attempt to create a unit directly via Prisma to verify DB constraints.');
}

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verifyDbConstraint() {
  console.log('Verifying DB constraint directly via Prisma...');

  const society = await prisma.society.findFirst();
  if (!society) {
    console.error('No society found.');
    return;
  }

  try {
    console.log('Attempting to create unit WITHOUT block (should fail at Prisma level)...');
    await prisma.unit.create({
      data: {
        societyId: society.id,
        unitNo: 'FAIL-TEST-' + Date.now(),
        // block is missing
      },
    });
    console.error('FAIL: Unit created without block!');
  } catch (_error) {
    console.log('SUCCESS: Prisma blocked creation without block field.');
    // console.log('Error message:', error.message);
  }

  try {
    console.log('Attempting to create unit WITH block (should succeed)...');
    const unit = await prisma.unit.create({
      data: {
        societyId: society.id,
        unitNo: 'SUCCESS-TEST-' + Date.now(),
        block: 'T',
      },
    });
    console.log('SUCCESS: Unit created with block:', unit.unitNo);

    // Clean up
    await prisma.unit.delete({ where: { id: unit.id } });
  } catch (_error) {
    console.error('FAIL: Failed to create unit with block!', _error.message);
  }
}

verifyDbConstraint()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
