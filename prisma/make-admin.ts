import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const email = process.argv[2];

if (!email) {
  console.log('Please provide an email address.');
  process.exit(1);
}

async function main() {
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });
    console.log(`User ${email} is now an ADMIN.`);
  } catch (e: any) {
    console.error(`Error updating user: ${e.message}`);
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log(`User with email ${email} not found. Login first to create the account.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
