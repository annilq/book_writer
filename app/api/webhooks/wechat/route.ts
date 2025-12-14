import { paymentService } from "@/lib/payment/service";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { handlePaymentSuccess } from "@/lib/payment/handler";

export async function POST(req: Request) {
    const headersList = await headers();
    
    let rawBody;
    try {
        rawBody = await req.text();
    } catch (e) {
         return new NextResponse("Read Body Failed", { status: 400 });
    }

    let body;
    try {
        body = JSON.parse(rawBody);
    } catch (e) {
        return new NextResponse("Invalid JSON", { status: 400 });
    }

    try {
        const result = await paymentService.getProvider("WECHAT").verifyCallback({
            headers: headersList,
            body: body, 
            rawBody: rawBody,
        });

        if (result.isPaid && result.orderNo) {
            await handlePaymentSuccess(result.orderNo, result.providerOrderId, "WECHAT", result.metadata);
        }

        return new NextResponse("OK", { status: 200 });
    } catch (error: any) {
        console.error("WeChat Webhook Error", error);
        // Return 500 so WeChat retries, or 200 if it's a permanent error we handled?
        // Usually 500/400 triggers retry.
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 500 });
    }
}
