import { auth } from "@/auth";
import { prisma } from "@/utils/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    include: { plan: true },
  });

  // Check if expired
  if (subscription && subscription.status === 'ACTIVE' && subscription.endDate < new Date()) {
      // Update to expired
      await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'EXPIRED' }
      });
      subscription.status = 'EXPIRED';
  }

  return NextResponse.json(subscription);
}
