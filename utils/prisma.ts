import { PrismaClient } from "@prisma/client"
import { cache } from "react";
 
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
 
let prismaInstance: PrismaClient
try {
  const { PrismaPg } = require("@prisma/adapter-pg")
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  prismaInstance = new PrismaClient({ adapter })
} catch {
  prismaInstance = new PrismaClient()
}
export const prisma = globalForPrisma.prisma || prismaInstance
 
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export const getPrisma = cache(() => {
  return prisma;
});
