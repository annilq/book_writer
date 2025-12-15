import Stripe from "stripe";
import { 
    PaymentProviderInstance, 
    CreateOrderInput, 
    CreateOrderResult, 
    VerifyCallbackInput, 
    VerifyCallbackResult 
} from "../types";

export class StripeProvider implements PaymentProviderInstance {
    name = "STRIPE" as const;
    private stripe: Stripe;
    private webhookSecret: string;

    constructor() {
        const apiKey = process.env.STRIPE_SECRET_KEY;
        if (!apiKey) {
            console.warn("STRIPE_SECRET_KEY is not set");
        }
        this.stripe = new Stripe(apiKey || "sk_test_mock", {
            apiVersion: "2024-12-18.acacia", // Use a recent version
            typescript: true,
        });
        this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
    }

    async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
        // Create a Checkout Session
        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: input.currency,
                        product_data: {
                            name: input.description,
                        },
                        unit_amount: input.amount, // Expecting cents
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.NEXTAUTH_URL}/subscription?success=true&orderNo=${input.orderNo}`,
            cancel_url: `${process.env.NEXTAUTH_URL}/subscription?canceled=true`,
            client_reference_id: input.orderNo,
            customer_email: input.payer?.email,
            metadata: {
                orderNo: input.orderNo,
                ...input.metadata
            }
        });

        return {
            providerOrderId: session.id,
            payUrl: session.url || "",
        };
    }

    async verifyCallback(input: VerifyCallbackInput): Promise<VerifyCallbackResult> {
        const sig = input.headers.get("stripe-signature");
        
        if (!sig || !this.webhookSecret) {
            // In dev/mock mode, we might want to skip signature verification if secret is missing
            // But for security, we throw.
            throw new Error("Missing stripe signature or webhook secret");
        }

        let event: Stripe.Event;

        try {
            event = this.stripe.webhooks.constructEvent(
                input.rawBody,
                sig,
                this.webhookSecret
            );
        } catch (err: any) {
            throw new Error(`Webhook Error: ${err.message}`);
        }

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            return {
                isPaid: session.payment_status === "paid",
                orderNo: session.client_reference_id || session.metadata?.orderNo || "",
                providerOrderId: session.id,
                paidAt: new Date(),
                metadata: session
            };
        }

        return {
            isPaid: false,
            orderNo: "",
            providerOrderId: "",
        };
    }
}
