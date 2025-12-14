import { PaymentProvider } from "@prisma/client";

export interface CreateOrderInput {
  orderNo: string;
  amount: number; // In smallest unit (e.g. cents)
  currency: string;
  description: string;
  payer?: {
    openid?: string; // For WeChat
    email?: string;  // For Stripe
  };
  metadata?: Record<string, any>;
}

export interface CreateOrderResult {
  providerOrderId: string; // payment_intent_id or transaction_id
  payUrl?: string;         // For Stripe Checkout / WeChat H5
  qrCode?: string;         // For WeChat Native
  clientSecret?: string;   // For Stripe Elements
}

export interface VerifyCallbackInput {
  headers: Headers;
  body: any;
  rawBody: string; // For signature verification
}

export interface VerifyCallbackResult {
  isPaid: boolean;
  orderNo: string;
  providerOrderId: string;
  paidAt?: Date;
  metadata?: any;
}

export interface PaymentProviderInstance {
  name: PaymentProvider;
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>;
  verifyCallback(input: VerifyCallbackInput): Promise<VerifyCallbackResult>;
}
