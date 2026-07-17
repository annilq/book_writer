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
        return <Badge className="bg-success/10 text-success hover:bg-success/10 border-success/20">Completed</Badge>;
      case "PENDING":
        return <Badge variant="secondary" className="bg-warning/10 text-warning hover:bg-warning/10 border-warning/20">Pending</Badge>;
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
              return <Badge variant="outline" className="border-brand/30 text-brand bg-brand/10">Stripe</Badge>;
          case "WECHAT":
              return <Badge variant="outline" className="border-success/30 text-success bg-success/10">WeChat</Badge>;
          case "REDEMPTION":
              return <Badge variant="secondary">Redeem</Badge>;
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
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
