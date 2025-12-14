import { paymentService } from "@/lib/payment/service";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { handlePaymentSuccess } from "@/lib/payment/handler";

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();

    try {
        const result = await paymentService.getProvider("STRIPE").verifyCallback({
            headers: headersList,
            body: null, 
            rawBody: body,
        });

        if (result.isPaid && result.orderNo) {
            await handlePaymentSuccess(result.orderNo, result.providerOrderId, "STRIPE", result.metadata);
        }

        return new NextResponse("OK", { status: 200 });
    } catch (error: any) {
        console.error("Stripe Webhook Error", error);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }
}
