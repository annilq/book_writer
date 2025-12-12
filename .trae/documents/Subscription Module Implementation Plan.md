# Subscription Module Design Plan

## 1. Database Schema Update (`prisma/schema.prisma`)
We will add the following models to support subscriptions and redemption codes:

*   **SubscriptionPlan**: Defines available plans (e.g., Monthly, Yearly).
    *   Fields: `id`, `name`, `description`, `price`, `duration` (days), `features`, `isActive`, `createdAt`, `updatedAt`.
*   **RedemptionCode**: Codes for users to redeem subscriptions.
    *   Fields: `id`, `code` (unique), `planId`, `isUsed`, `usedByUserId`, `usedAt`, `expiresAt`, `createdAt`.
*   **UserSubscription**: Tracks user's active subscription.
    *   Fields: `id`, `userId`, `planId`, `startDate`, `endDate`, `status` (ACTIVE, EXPIRED, CANCELLED).
*   **SubscriptionOrder**: Records transactions/redemptions.
    *   Fields: `id`, `userId`, `planId`, `amount`, `status`, `paymentMethod`, `createdAt`.

## 2. API Routes
We will create API endpoints for both Admin and User operations:

### Admin APIs
*   `GET /api/admin/subscription-plans`: List all plans.
*   `POST /api/admin/subscription-plans`: Create a new plan.
*   `PUT /api/admin/subscription-plans/[id]`: Update a plan.
*   `DELETE /api/admin/subscription-plans/[id]`: Delete/Deactivate a plan.
*   `GET /api/admin/redemption-codes`: List generated codes.
*   `POST /api/admin/redemption-codes`: Generate new codes for a plan.

### User APIs
*   `GET /api/subscription/plans`: List active plans available for purchase/redemption.
*   `POST /api/subscription/redeem`: Redeem a code to activate a subscription.
*   `GET /api/subscription/status`: Check current user's subscription status.

## 3. UI Implementation
We will build the UI using the existing design system (Tailwind CSS + shadcn/ui) to ensure consistency.

### Admin Dashboard (`/admin/subscriptions`)
*   **Plans Management**: A table to view plans with a dialog to add/edit plans.
*   **Redemption Codes**: A view to generate codes in bulk for specific plans and export/view them.

### User Subscription Page (`/subscription`)
*   **Pricing Cards**: Display available plans with their features and prices.
*   **Redemption Section**: A concise input field to enter a redemption code.
*   **Current Status**: If subscribed, show the active plan details and expiration date.
*   **Design**: Minimalist, tech-focused design using the project's color palette (likely dark/light mode compatible).

## 4. Implementation Steps
1.  **Update Database**: Modify `prisma/schema.prisma` and push changes.
2.  **Backend Logic**: Implement the API routes with necessary validation and error handling.
3.  **Admin Frontend**: Create the admin pages for managing plans and codes.
4.  **User Frontend**: Create the subscription landing page and redemption flow.
5.  **Verification**: Test the flow from creating a plan -> generating a code -> redeeming it as a user.
