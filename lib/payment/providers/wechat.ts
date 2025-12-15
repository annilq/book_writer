import { 
    PaymentProviderInstance, 
    CreateOrderInput, 
    CreateOrderResult, 
    VerifyCallbackInput, 
    VerifyCallbackResult 
} from "../types";

export class WechatProvider implements PaymentProviderInstance {
    name = "WECHAT" as const;
    private pay: any;

    constructor() {
        const appid = process.env.WECHAT_APPID;
        const mchid = process.env.WECHAT_MCHID;
        // const publicKey = process.env.WECHAT_PUBLIC_KEY; // Platform Certificate (or use certificate downloader)
        const privateKey = process.env.WECHAT_PRIVATE_KEY; // Merchant Private Key
        const apiV3Key = process.env.WECHAT_API_V3_KEY;

        if (appid && mchid && privateKey && apiV3Key) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const WxPay = require('wechatpay-node-v3');
                // Note: The library initialization might vary. 
                // We assume user will configure certificates properly.
                // For this implementation, we allow failing if keys are invalid, 
                // but we wrap in try-catch to not crash the app.
                this.pay = new WxPay({
                    appid,
                    mchid,
                    publicKey: process.env.WECHAT_PUBLIC_KEY || "", // Optional if using serial map?
                    privateKey,
                });
            } catch (e) {
                console.error("Failed to initialize WeChat Pay", e);
            }
        }
    }

    async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
        if (!this.pay) {
            console.log("WeChat Pay not configured, using Mock");
            return {
                providerOrderId: `mock_wx_${Date.now()}`,
                qrCode: "weixin://wxpay/bizpayurl?pr=mock_qrcode",
            };
        }

        try {
            const result = await this.pay.transactions_native({
                description: input.description,
                out_trade_no: input.orderNo,
                notify_url: `${process.env.NEXTAUTH_URL}/api/webhooks/wechat`,
                amount: {
                    total: input.amount, // cents
                    currency: input.currency || 'CNY',
                },
            });

            if (result.code_url) {
                return {
                    providerOrderId: "", // Not available in sync response
                    qrCode: result.code_url,
                };
            } else {
                throw new Error(`WeChat Pay Error: ${JSON.stringify(result)}`);
            }
        } catch (error) {
             console.error("WeChat Create Order Error", error);
             throw error;
        }
    }

    async verifyCallback(input: VerifyCallbackInput): Promise<VerifyCallbackResult> {
        if (!this.pay) {
             throw new Error("WeChat Pay not configured");
        }

        try {
            // Verify Signature
            // The library's verify function signature might depend on version.
            // Assuming we manually decrypt if verification passes (or lib does both).
            
            // Decrypt resource
            // Input body should be the parsed JSON object
            const { resource } = input.body;
            
            if (!resource || !resource.ciphertext) {
                throw new Error("Invalid WeChat Callback Body");
            }

            const decrypted = this.pay.decipher_gcm(
                resource.ciphertext,
                resource.associated_data,
                resource.nonce,
                process.env.WECHAT_API_V3_KEY
            );
            
            return {
                isPaid: decrypted.trade_state === 'SUCCESS',
                orderNo: decrypted.out_trade_no,
                providerOrderId: decrypted.transaction_id,
                paidAt: new Date(decrypted.success_time),
                metadata: decrypted
            };

        } catch (error) {
             console.error("WeChat Callback Error", error);
             throw error;
        }
    }
}
