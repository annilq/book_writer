import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/utils/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const orders = await prisma.subscriptionOrder.findMany({
    where: { userId: session.user.id },
    include: { plan: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Order History</h1>
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
            {orders.length === 0 ? (
                <p className="text-muted-foreground">No orders found.</p>
            ) : (
              <div className="w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Plan</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Payment Method</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle">{order.createdAt.toLocaleDateString()} {order.createdAt.toLocaleTimeString()}</td>
                        <td className="p-4 align-middle">{order.plan.name}</td>
                        <td className="p-4 align-middle">${Number(order.amount).toFixed(2)}</td>
                        <td className="p-4 align-middle">
                            <Badge variant="outline">{order.paymentMethod}</Badge>
                        </td>
                        <td className="p-4 align-middle">
                            <Badge variant={order.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                {order.status}
                            </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
