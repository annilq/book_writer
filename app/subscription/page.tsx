"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

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

export default function SubscriptionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
        router.push("/api/auth/signin");
    }
    if (status === "authenticated") {
        fetchData();
    }
  }, [status, router]);

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

  if (status === "loading" || loading) {
      return (
          <div className="flex h-screen items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      );
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          Unlock Pro Features
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose a plan that fits your needs or redeem a code to get started.
        </p>
      </div>

      {/* Current Subscription Status */}
      {subscription && subscription.status === 'ACTIVE' && (
        <Card className="mb-12 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-700 dark:text-blue-300">Active Subscription</CardTitle>
            <CardDescription>
                You are currently subscribed to <strong>{subscription.plan.name}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                 <div>
                     <span className="text-muted-foreground">Status:</span>
                     <span className="ml-2 font-semibold text-green-600">Active</span>
                 </div>
                 <div>
                     <span className="text-muted-foreground">Start Date:</span>
                     <span className="ml-2">{new Date(subscription.startDate).toLocaleDateString()}</span>
                 </div>
                 <div>
                     <span className="text-muted-foreground">Expires On:</span>
                     <span className="ml-2 font-semibold">{new Date(subscription.endDate).toLocaleDateString()}</span>
                 </div>
             </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {plans.map((plan) => (
          <Card key={plan.id} className="flex flex-col border-2 hover:border-blue-500 transition-colors">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-3xl font-bold mb-4">
                ${Number(plan.price).toFixed(2)}
                <span className="text-base font-normal text-muted-foreground">
                  / {plan.duration} days
                </span>
              </div>
              <ul className="space-y-2">
                {plan.features?.split(",").map((feature, i) => (
                  <li key={i} className="flex items-center text-sm">
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    {feature.trim()}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                {Number(plan.price) === 0 ? "Get Started" : "Subscribe"}
              </Button>
            </CardFooter>
          </Card>
        ))}
        {plans.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground p-8 border border-dashed rounded-lg">
            No plans available at the moment.
          </div>
        )}
      </div>
    </div>
  );
}
