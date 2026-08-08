"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/utils";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { QRCodeSVG } from 'qrcode.react';
import { RedemptionCard } from "@/components/RedemptionCard";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: number;
  features: string | null;
}

interface Subscription {
  id: string;
  plan: Plan;
  status: string;
  startDate: string;
  endDate: string;
}

export default function UserSubscriptionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const [provider, setProvider] = useState<"STRIPE" | "WECHAT">("STRIPE");
  const [showWechatQR, setShowWechatQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [currentOrderNo, setCurrentOrderNo] = useState("");
  const [subscribingId, setSubscribingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
        router.push("/api/auth/signin");
    }
    if (status === "authenticated") {
        fetchData();
    }
  }, [status, router]);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    if (params.get("success")) {
        toast.success("Subscription successful!");
    }
    if (params.get("canceled")) {
        toast.info("Subscription canceled.");
    }
  }, []);

  // Polling for WeChat Payment Status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showWechatQR && currentOrderNo) {
        interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/payment/check?orderNo=${currentOrderNo}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'COMPLETED') {
                        setShowWechatQR(false);
                        toast.success("Payment Successful!");
                        fetchData(); // Reload data
                        clearInterval(interval);
                    }
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 2000);
    }
    return () => clearInterval(interval);
  }, [showWechatQR, currentOrderNo]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, subRes] = await Promise.all([
        fetch("/api/subscription/plans"),
        fetch("/api/subscription/status"),
      ]);

      if (plansRes.ok) {
        setPlans(await plansRes.json());
      }
      if (subRes.ok) {
        const subData = await subRes.json();
        if (subData) setSubscription(subData);
      }
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: Plan) => {
      try {
          setSubscribingId(plan.id);
          const res = await fetch("/api/subscription/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ planId: plan.id, provider }),
          });

          if (!res.ok) {
              const text = await res.text();
              throw new Error(text || "Checkout failed");
          }

          const data = await res.json();

          if (provider === "STRIPE" && data.payUrl) {
              window.location.href = data.payUrl;
          } else if (provider === "WECHAT" && data.qrCode) {
              setQrCodeUrl(data.qrCode);
              setCurrentOrderNo(data.orderNo);
              setShowWechatQR(true);
          }
      } catch (error: any) {
          toast.error(error.message || "Failed to start checkout");
      } finally {
          setSubscribingId(null);
      }
  };

  if (status === "loading" || loading) {
      return (
          <div className="flex h-screen items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      );
  }

  // Cheapest paid plan is highlighted as "Most popular"
  const cheapestPaidId = plans
    .filter((p) => Number(p.price) > 0)
    .sort((a, b) => Number(a.price) - Number(b.price))[0]?.id;

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="text-center mb-10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
          <Sparkles className="h-3.5 w-3.5" />
          Membership
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Subscription
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Manage your plan, unlock Pro features, or redeem a code to get started.
        </p>
      </div>

      {/* Current Subscription Status */}
      {subscription && subscription.status === 'ACTIVE' && (
        <Card className="mb-12 border-brand/30 bg-gradient-to-br from-brand/10 to-brand/[0.03] shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success">
                <Check className="h-3.5 w-3.5" />
              </span>
              <CardTitle className="text-brand">Active Subscription</CardTitle>
            </div>
            <CardDescription>
                You are currently subscribed to <strong>{subscription.plan.name}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                 <div className="rounded-lg bg-background/60 p-3">
                     <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
                     <div className="mt-1 font-semibold text-success">Active</div>
                 </div>
                 <div className="rounded-lg bg-background/60 p-3">
                     <div className="text-xs uppercase tracking-wide text-muted-foreground">Start Date</div>
                     <div className="mt-1">{new Date(subscription.startDate).toLocaleDateString()}</div>
                 </div>
                 <div className="rounded-lg bg-background/60 p-3">
                     <div className="text-xs uppercase tracking-wide text-muted-foreground">Expires On</div>
                     <div className="mt-1 font-semibold">{new Date(subscription.endDate).toLocaleDateString()}</div>
                 </div>
             </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Method Selector */}
      <div className="flex justify-center mb-8">
        <Tabs value={provider} onValueChange={(v) => setProvider(v as any)} className="w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="STRIPE">Card (Stripe)</TabsTrigger>
                <TabsTrigger value="WECHAT">WeChat Pay</TabsTrigger>
            </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-wrap justify-center items-stretch gap-6 mb-16">
        {plans.map((plan) => {
          const popular = plan.id === cheapestPaidId;
          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex w-full sm:w-80 flex-col border-2 transition-all",
                popular
                  ? "border-brand bg-brand/[0.03] shadow-lg shadow-brand/10 hover:border-brand"
                  : "border-border hover:border-brand/50"
              )}
            >
              {popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground shadow-sm">
                    <Sparkles className="h-3 w-3" />
                    Most popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className={popular ? "text-brand" : ""}>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-4 text-3xl font-bold tabular-nums">
                  <span className="text-brand">${Number(plan.price).toFixed(2)}</span>
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}/ {plan.duration} days
                  </span>
                </div>
                <ul className="space-y-2">
                  {plan.features?.split(",").map((feature, i) => (
                    <li key={i} className="flex items-center text-sm">
                      <Check className="w-4 h-4 mr-2 shrink-0 text-success" />
                      {feature.trim()}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan)}
                  disabled={!!subscribingId && subscribingId !== plan.id}
                >
                  {subscribingId === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {Number(plan.price) === 0 ? "Get Started" : `Subscribe with ${provider === 'STRIPE' ? 'Card' : 'WeChat'}`}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
        {plans.length === 0 && (
          <div className="w-full text-center text-muted-foreground p-8 border border-dashed rounded-lg">
            No plans available at the moment.
          </div>
        )}
      </div>

      {/* Redeem Code */}
      <div className="max-w-md mx-auto">
        <RedemptionCard />
      </div>

      <Dialog open={showWechatQR} onOpenChange={setShowWechatQR}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>WeChat Pay</DialogTitle>
                <DialogDescription>
                    Scan the QR code with WeChat to complete payment.
                </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center p-6 space-y-4">
                {qrCodeUrl && (
                    <QRCodeSVG value={qrCodeUrl} size={200} />
                )}
                <div className="text-center text-sm text-muted-foreground">
                    Order No: {currentOrderNo}
                </div>
            </div>
            <div className="text-center text-sm text-muted-foreground">
                Waiting for payment...
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
