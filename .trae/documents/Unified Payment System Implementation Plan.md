# Implementation Plan: Unified Stripe + WeChat Payment System

This plan implements the "Unified Payment & Subscription Scheme" as requested, ensuring decoupling between subscription logic and payment providers.

## 1. Database Schema Refactoring (`prisma/schema.prisma`)

We will align the database with the proposed unified model.

### New Enums
- `PaymentProvider`: `STRIPE`, `WECHAT`, `REDEMPTION`
- `RenewMode`: `AUTO`, `MANUAL`
- `SubscriptionStatus`: `PENDING`, `ACTIVE`, `EXPIRED`, `CANCELED` (Update existing)

### Model Updates
- **Rename** `UserSubscription` → `Subscription`
  - Add `renewMode` (RenewMode, default: MANUAL)
  - Add `provider` (PaymentProvider, optional)
- **Rename** `SubscriptionOrder` → `PaymentOrder`
  - Add `orderNo` (String, unique)
  - Add `subscriptionId` (String, Relation to Subscription)
  - Add `provider` (PaymentProvider)
  - Add `providerOrderId` (String, optional)
  - Add `providerPayload` (Json, optional)
  - Add `currency` (String, default: "USD")
  - Add `paidAt` (DateTime, optional)

## 2. Codebase Refactoring (Fixing Breaking Changes)

Since we are renaming models, we must update existing references:
- Update `app/api/subscription/redeem/route.ts` to use new `Subscription` and `PaymentOrder` models.
- Update `app/api/subscription/status/route.ts`.
- Update `app/subscription/page.tsx` (Frontend types).

## 3. Payment Module Architecture (`lib/payment/`)

We will create a dedicated payment module to abstract provider differences.

### Structure
- `lib/payment/types.ts`: Define `PaymentProvider` interface, `CreateOrderInput`, `VerifyCallbackInput`.
- `lib/payment/providers/stripe.ts`: Stripe implementation (using `stripe` SDK).
- `lib/payment/providers/wechat.ts`: WeChat Pay implementation (using `wechatpay-node-v3` or compatible).
- `lib/payment/service.ts`: Factory and orchestration logic (The "Unified Payment Layer").

### Core Logic
- **`createOrder`**: Generates a local `PaymentOrder` and calls the provider to get payment info (URL/QRCode).
- **`handleCallback`**: Verifies signature, updates `PaymentOrder` status, and triggers subscription activation/extension.

## 4. API Routes Implementation

- **`POST /api/subscription/checkout`**:
  - Input: `planId`, `provider` (stripe | wechat)
  - Output: `orderNo`, `payInfo` (url | qrCode)
- **`POST /api/webhooks/stripe`**: Handles Stripe `checkout.session.completed` & `invoice.paid`.
- **`POST /api/webhooks/wechat`**: Handles WeChat Pay notifications.
- **`GET /api/payment/check/[orderNo]`**: For frontend to poll payment status (especially for WeChat).

## 5. Frontend Implementation (`app/subscription/page.tsx`)

- Add Payment Method Selector (Stripe / WeChat).
- Update "Subscribe" button logic:
  - Call `/api/subscription/checkout`.
  - **Stripe**: Redirect to Stripe Checkout URL.
  - **WeChat**: Open a Dialog showing the QR Code and poll `/api/payment/check`.

## Dependencies
- We will need to install: `stripe`.
- For WeChat Pay, we will use a standard library or implement the signature logic if preferred.

## Verification
- Verify database migrations.
- Verify "Redemption Code" flow still works.
- Verify "Stripe" checkout flow (Mock mode or Test mode keys).
- Verify "WeChat" flow (Mock/Test).
