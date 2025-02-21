import { PrismaClient } from "@prisma/client";
import seedCategorys from "./categories";

const prisma = new PrismaClient();

const main = async () => {
  await seedCategorys(prisma)
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });