import { PaymentProvider } from "@prisma/client";
import { PaymentProviderInstance } from "./types";
import { StripeProvider } from "./providers/stripe";
import { WechatProvider } from "./providers/wechat";

class PaymentService {
    private providers: Partial<Record<PaymentProvider, PaymentProviderInstance>>;

    constructor() {
        this.providers = {
            [PaymentProvider.STRIPE]: new StripeProvider(),
            [PaymentProvider.WECHAT]: new WechatProvider(),
        };
    }

    getProvider(name: PaymentProvider): PaymentProviderInstance {
        const provider = this.providers[name];
        if (!provider) {
            throw new Error(`Provider ${name} not implemented or configured`);
        }
        return provider;
    }
}

export const paymentService = new PaymentService();
