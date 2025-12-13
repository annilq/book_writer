"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: number;
  features: string | null;
}

export function SubscriptionPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/subscription/plans");
        if (res.ok) {
          const data = await res.json();
          setPlans(data);
        }
      } catch (error) {
        console.error("Error fetching plans", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  if (loading) return null; // Or a skeleton
  if (plans.length === 0) return null;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-center mb-8 text-white">Choose Your Plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="flex flex-col border-2 border-transparent hover:border-white/20 transition-all bg-white/10 backdrop-blur-md text-white border-white/10">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription className="text-gray-200">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-3xl font-bold mb-4">
                ${Number(plan.price).toFixed(2)}
                <span className="text-base font-normal text-gray-300">
                  / {plan.duration} days
                </span>
              </div>
              <ul className="space-y-2">
                {plan.features?.split(",").map((feature, i) => (
                  <li key={i} className="flex items-center text-sm">
                    <Check className="w-4 h-4 mr-2 text-green-400" />
                    {feature.trim()}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/user/subscription" className="w-full">
                <Button className="w-full bg-white text-purple-600 hover:bg-gray-100">
                  {Number(plan.price) === 0 ? "Get Started" : "Subscribe Now"}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
