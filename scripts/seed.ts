import { PrismaClient } from "@prisma/client";
import { seedInitialData } from "@/lib/seed-data";

const prisma = new PrismaClient();

async function main() {
  await seedInitialData(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed complete");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
