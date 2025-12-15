import { auth } from "@/auth";
import { prisma } from "@/utils/prisma";
import { OrderStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Check for admin role
  // Assuming 'role' is in session.user, if not we might need to fetch user
  // Based on prisma schema: role Role @default(USER)
  // session.user usually has role if configured in auth.ts
  // For safety, let's fetch user role or trust session if configured.
  // Let's assume session.user.role is available or we check db.
  
  const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
  });

  if (!user || user.role !== 'ADMIN') {
      return new NextResponse("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: any = {};

  if (status && status !== "ALL") {
    where.status = status as OrderStatus;
  }

  if (search) {
      where.OR = [
          { orderNo: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { user: { name: { contains: search, mode: 'insensitive' } } }
      ];
  }

  try {
    const orders = await prisma.paymentOrder.findMany({
      where,
      include: {
        plan: true,
        user: {
            select: {
                name: true,
                email: true,
            }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
