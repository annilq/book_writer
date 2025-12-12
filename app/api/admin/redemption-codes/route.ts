import { auth } from "@/auth";
import { prisma } from "@/utils/prisma";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

export async function GET() {
  const session = await auth();

  // @ts-ignore
  if (!session || session.user?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const codes = await prisma.redemptionCode.findMany({
    include: {
      plan: true,
      usedByUser: {
        select: {
            name: true,
            email: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(codes);
}

export async function POST(req: Request) {
  const session = await auth();

  // @ts-ignore
  if (!session || session.user?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { planId, count, expirationDate } = body;
    const numCount = parseInt(count);

    if (!planId || !numCount || numCount <= 0) {
        return new NextResponse("Invalid input", { status: 400 });
    }

    const codesData = [];
    for (let i = 0; i < numCount; i++) {
        codesData.push({
            code: nanoid(10).toUpperCase(), // Generate a 10-char random code
            planId,
            expiresAt: expirationDate ? new Date(expirationDate) : null,
        });
    }

    const createdCodes = await prisma.redemptionCode.createMany({
        data: codesData,
    });

    return NextResponse.json({ count: createdCodes.count });
  } catch (error) {
    console.error("Error generating codes:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
