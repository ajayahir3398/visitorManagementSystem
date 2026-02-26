import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking for units with null blocks...');

  const nullBlockCount = await prisma.unit.count({
    where: { block: null },
  });

  console.log(`Found ${nullBlockCount} units with null block.`);

  if (nullBlockCount > 0) {
    console.log("Updating units with null block to default 'A'...");
    const result = await prisma.unit.updateMany({
      where: { block: null },
      data: { block: 'A' },
    });
    console.log(`Updated ${result.count} units.`);
  }

  console.log('Check and fix complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
