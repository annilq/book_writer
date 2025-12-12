import { auth } from "@/auth";
import { prisma } from "@/utils/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { code } = await req.json();

    if (!code) {
        return new NextResponse("Code is required", { status: 400 });
    }

    // 1. Find and validate code
    const redemptionCode = await prisma.redemptionCode.findUnique({
        where: { code },
        include: { plan: true }
    });

    if (!redemptionCode) {
        return new NextResponse("Invalid code", { status: 400 });
    }

    if (redemptionCode.isUsed) {
        return new NextResponse("Code already used", { status: 400 });
    }

    if (redemptionCode.expiresAt && redemptionCode.expiresAt < new Date()) {
        return new NextResponse("Code expired", { status: 400 });
    }

    // 2. Activate subscription and mark code as used in a transaction
    await prisma.$transaction(async (tx) => {
        // Mark code as used
        await tx.redemptionCode.update({
            where: { id: redemptionCode.id },
            data: {
                isUsed: true,
                usedByUserId: session.user?.id,
                usedAt: new Date(),
            }
        });

        // Calculate end date
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + redemptionCode.plan.duration);

        // Create or Update User Subscription
        // Check if user already has a subscription
        const existingSub = await tx.userSubscription.findUnique({
            where: { userId: session.user?.id! }
        });

        if (existingSub) {
             // If active, extend? Or overwrite? Let's overwrite/extend based on current status.
             // For simplicity, if active, we extend from the current end date.
             let newStartDate = startDate;
             let newEndDate = endDate;
             
             if (existingSub.status === 'ACTIVE' && existingSub.endDate > new Date()) {
                 newStartDate = existingSub.endDate;
                 newEndDate = new Date(newStartDate);
                 newEndDate.setDate(newEndDate.getDate() + redemptionCode.plan.duration);
             }

             await tx.userSubscription.update({
                 where: { userId: session.user?.id! },
                 data: {
                     planId: redemptionCode.planId,
                     startDate: existingSub.startDate, // Keep original start date or update? Maybe keep original.
                     endDate: newEndDate,
                     status: 'ACTIVE'
                 }
             });
        } else {
            await tx.userSubscription.create({
                data: {
                    userId: session.user?.id!,
                    planId: redemptionCode.planId,
                    startDate: startDate,
                    endDate: endDate,
                    status: 'ACTIVE'
                }
            });
        }

        // Create Order Record
        await tx.subscriptionOrder.create({
            data: {
                userId: session.user?.id!,
                planId: redemptionCode.planId,
                amount: 0,
                status: 'COMPLETED',
                paymentMethod: 'REDEMPTION_CODE'
            }
        });
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error redeeming code:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
