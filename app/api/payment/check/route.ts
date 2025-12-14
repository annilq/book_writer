import { auth } from "@/auth";
import { prisma } from "@/utils/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const orderNo = searchParams.get("orderNo");

    if (!orderNo) {
        return new NextResponse("Missing orderNo", { status: 400 });
    }

    const order = await prisma.paymentOrder.findUnique({
        where: { orderNo },
        select: { status: true }
    });

    if (!order) {
        return new NextResponse("Order not found", { status: 404 });
    }

    return NextResponse.json({ status: order.status });
}
