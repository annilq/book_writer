"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentOrder, SubscriptionPlan, OrderStatus, PaymentProvider } from "@prisma/client";

interface OrderWithDetails extends PaymentOrder {
  plan: SubscriptionPlan | null;
  user?: {
    name: string | null;
    email: string | null;
  };
}

interface OrderListProps {
  orders: OrderWithDetails[];
  loading: boolean;
  isAdmin?: boolean;
  onCancelOrder?: (orderNo: string) => void;
}

export function OrderList({ orders, loading, isAdmin = false, onCancelOrder }: OrderListProps) {
  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
        No orders found.
      </div>
    );
  }

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">Completed</Badge>;
      case "PENDING":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>;
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
      case "REFUNDED":
        return <Badge variant="outline" className="text-muted-foreground">Refunded</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" className="text-muted-foreground border-dashed">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProviderBadge = (provider: PaymentProvider) => {
      switch (provider) {
          case "STRIPE":
              return <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Stripe</Badge>;
          case "WECHAT":
              return <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">WeChat</Badge>;
          case "REDEMPTION":
              return <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">Redeem</Badge>;
          default:
              return <span className="text-muted-foreground text-xs">{provider}</span>;
      }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order No</TableHead>
            {isAdmin && <TableHead>User</TableHead>}
            <TableHead>Plan</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            {!isAdmin && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-xs">{order.orderNo}</TableCell>
              {isAdmin && (
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{order.user?.name || "Unknown"}</span>
                    <span className="text-xs text-muted-foreground">{order.user?.email}</span>
                  </div>
                </TableCell>
              )}
              <TableCell>{order.plan?.name || "Unknown Plan"}</TableCell>
              <TableCell>
                {order.amount && Number(order.amount) > 0 ? (
                    <span className="font-medium">
                        {Number(order.amount).toFixed(2)} <span className="text-xs text-muted-foreground">{order.currency}</span>
                    </span>
                ) : (
                    <span className="text-muted-foreground">Free</span>
                )}
              </TableCell>
              <TableCell>{getProviderBadge(order.provider)}</TableCell>
              <TableCell>{getStatusBadge(order.status)}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(order.createdAt).toLocaleString()}
              </TableCell>
              {!isAdmin && (
                  <TableCell className="text-right">
                      {order.status === 'PENDING' && onCancelOrder && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => onCancelOrder(order.orderNo)}
                          >
                              Cancel
                          </Button>
                      )}
                  </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
