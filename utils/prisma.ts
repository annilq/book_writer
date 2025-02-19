import { PrismaClient } from "@prisma/client"
import { cache } from "react";
 
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
 
export const prisma = globalForPrisma.prisma || new PrismaClient()
 
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export const getPrisma = cache(() => {
  // const neon = new Pool({ connectionString: process.env.DATABASE_URL });
  // const adapter = new PrismaNeon(neon);
  // return new PrismaClient({ adapter });
  return prisma;
});