import { auth } from "@/auth";
import { prisma } from "@/utils/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  // @ts-ignore
  if (!session || session.user?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(plans);
}

export async function POST(req: Request) {
  const session = await auth();

  // @ts-ignore
  if (!session || session.user?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, price, duration, features, isActive } = body;

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description,
        price,
        duration: parseInt(duration),
        features,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error creating plan:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
