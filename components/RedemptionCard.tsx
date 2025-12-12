"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function RedemptionCard() {
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const router = useRouter();

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCode) return;

    try {
      setRedeeming(true);
      const res = await fetch("/api/subscription/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: redeemCode }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Redemption failed");
      }

      toast.success("Code redeemed successfully!");
      setRedeemCode("");
      router.refresh(); // Refresh to show updated subscription status if we display it somewhere
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Redeem Subscription Code</CardTitle>
        <CardDescription>
          Enter your code below to activate your subscription.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRedeem} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Enter Code</Label>
            <Input
              id="code"
              placeholder="XXXX-XXXX-XXXX"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={redeeming || !redeemCode}>
            {redeeming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Redeem
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
