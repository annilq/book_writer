import { prisma } from "@/utils/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });

  return NextResponse.json(plans);
}
