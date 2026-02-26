import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting verification...');

  // 1. Get a society
  const society = await prisma.society.findFirst();
  if (!society) {
    console.error('No society found to test with.');
    process.exit(1);
  }
  console.log(`Using society: ${society.name} (ID: ${society.id})`);

  // 2. Create a unit with floor and block
  const unitNo = `TEST-${Date.now()}`;
  const floor = 5;
  const block = 'TEST-BLOCK';

  console.log(`Creating unit ${unitNo} with floor=${floor}, block=${block}...`);

  const createdUnit = await prisma.unit.create({
    data: {
      societyId: society.id,
      unitNo: unitNo,
      floor: floor,
      block: block,
      status: 'ACTIVE',
    },
  });

  console.log('Created unit:', createdUnit);

  // 3. Verify fields
  if (createdUnit.floor !== floor) {
    console.error(`Mismatch! Expected floor ${floor}, got ${createdUnit.floor}`);
    process.exit(1);
  }
  if (createdUnit.block !== block) {
    console.error(`Mismatch! Expected block ${block}, got ${createdUnit.block}`);
    process.exit(1);
  }

  // 4. Update the unit
  const newFloor = 10;
  const newBlock = 'UPDATED-BLOCK';
  console.log(`Updating unit to floor=${newFloor}, block=${newBlock}...`);

  const updatedUnit = await prisma.unit.update({
    where: { id: createdUnit.id },
    data: {
      floor: newFloor,
      block: newBlock,
    },
  });

  console.log('Updated unit:', updatedUnit);

  if (updatedUnit.floor !== newFloor) {
    console.error(`Mismatch! Expected floor ${newFloor}, got ${updatedUnit.floor}`);
    process.exit(1);
  }
  if (updatedUnit.block !== newBlock) {
    console.error(`Mismatch! Expected block ${newBlock}, got ${updatedUnit.block}`);
    process.exit(1);
  }

  // 5. Clean up
  console.log('Cleaning up...');
  await prisma.unit.delete({
    where: { id: createdUnit.id },
  });

  console.log('Verification successful!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
