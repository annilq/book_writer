import { prisma } from "@/utils/prisma";
import { PaymentProvider } from "@prisma/client";

export async function handlePaymentSuccess(orderNo: string, providerOrderId: string, provider: PaymentProvider, metadata: any) {
    const order = await prisma.paymentOrder.findUnique({
        where: { orderNo },
    });

    if (!order) {
        console.error(`Order ${orderNo} not found`);
        return;
    }

    if (order.status === 'COMPLETED') return;

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: order.planId! } });
    if (!plan) return;

    const duration = plan.duration;
    
    await prisma.$transaction(async (tx) => {
         await tx.paymentOrder.update({
            where: { id: order.id },
            data: {
                status: 'COMPLETED',
                providerOrderId,
                paidAt: new Date(),
                providerPayload: metadata ? JSON.stringify(metadata) : undefined
            }
        });

         const existingSub = await tx.subscription.findUnique({
            where: { userId: order.userId }
        });

        let newEndDate = new Date();
        newEndDate.setDate(newEndDate.getDate() + duration);

        if (existingSub) {
             if (existingSub.status === 'ACTIVE' && existingSub.endDate > new Date()) {
                 const currentEndDate = new Date(existingSub.endDate);
                 currentEndDate.setDate(currentEndDate.getDate() + duration);
                 newEndDate = currentEndDate;
             }

             const updatedSub = await tx.subscription.update({
                 where: { userId: order.userId },
                 data: {
                     planId: plan.id,
                     endDate: newEndDate,
                     status: 'ACTIVE',
                     paymentProvider: provider,
                     renewMode: 'MANUAL'
                 }
             });
             
             await tx.paymentOrder.update({
                 where: { id: order.id },
                 data: { subscriptionId: updatedSub.id }
             });

        } else {
            const newSub = await tx.subscription.create({
                data: {
                    userId: order.userId,
                    planId: plan.id,
                    startDate: new Date(),
                    endDate: newEndDate,
                    status: 'ACTIVE',
                    paymentProvider: provider,
                    renewMode: 'MANUAL'
                }
            });
            
             await tx.paymentOrder.update({
                 where: { id: order.id },
                 data: { subscriptionId: newSub.id }
             });
        }
    });
}
