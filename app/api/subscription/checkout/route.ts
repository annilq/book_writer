import { auth } from "@/auth";
import { prisma } from "@/utils/prisma";
import { paymentService } from "@/lib/payment/service";
import { PaymentProvider } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { planId, provider } = await req.json();

        if (!planId || !provider) {
            return new NextResponse("Missing planId or provider", { status: 400 });
        }

        const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
        if (!plan) return new NextResponse("Plan not found", { status: 404 });

        const orderNo = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const selectedProvider = provider as PaymentProvider;

        // Determine currency and amount
        let currency = "USD";
        let amount = Number(plan.price);
        
        if (selectedProvider === "WECHAT") {
            currency = "CNY";
            // Simple conversion for demo: 1 USD = 7 CNY
            // In production, use real exchange rate or store CNY price in DB
            amount = amount * 7; 
        }

        // Create PaymentOrder (Pending)
        const order = await prisma.paymentOrder.create({
            data: {
                orderNo,
                userId: session.user.id,
                planId: plan.id,
                amount: plan.price, // Store original plan price/currency in DB? Or converted?
                // Schema says amount Decimal. Let's store the charged amount?
                // Actually, let's store the plan price.
                currency: currency, 
                provider: selectedProvider,
                status: "PENDING",
            }
        });

        const result = await paymentService.getProvider(selectedProvider).createOrder({
            orderNo,
            amount: Math.round(amount * 100), // Convert to smallest unit (cents/fen)
            currency: currency,
            description: `Subscription to ${plan.name}`,
            payer: {
                email: session.user.email || undefined,
            }
        });

        // Update with provider info if needed (e.g. providerOrderId)
        if (result.providerOrderId) {
            await prisma.paymentOrder.update({
                where: { id: order.id },
                data: { providerOrderId: result.providerOrderId }
            });
        }

        return NextResponse.json({
            orderNo,
            payUrl: result.payUrl,
            qrCode: result.qrCode,
        });

    } catch (error: any) {
        console.error("Checkout Error", error);
        return new NextResponse(error.message || "Internal Server Error", { status: 500 });
    }
}
