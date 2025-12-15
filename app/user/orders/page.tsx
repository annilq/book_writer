"use client";

import { useEffect, useState } from "react";
import { OrderList } from "@/components/OrderList";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import { toast } from "sonner";

export default function UserOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") {
        params.append("status", statusFilter);
      }
      const res = await fetch(`/api/user/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderNo: string) => {
    try {
      const res = await fetch("/api/user/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNo }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to cancel order");
      }

      toast.success("Order canceled successfully");
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Order History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View your past transactions and order status.
        </p>
      </div>
      <Separator />

      <div className="flex flex-col gap-4">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
            <TabsTrigger value="PENDING">Pending</TabsTrigger>
            <TabsTrigger value="FAILED">Failed</TabsTrigger>
            <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>

        <OrderList orders={orders} loading={loading} onCancelOrder={handleCancelOrder} />
      </div>
    </div>
  );
}
