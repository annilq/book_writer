import { auth } from "@/auth";
import { prisma } from "@/utils/prisma";
import { OrderStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: any = {
    userId: session.user.id,
  };

  if (status && status !== "ALL") {
    where.status = status as OrderStatus;
  }

  try {
    const orders = await prisma.paymentOrder.findMany({
      where,
      include: {
        plan: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
