import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { RedemptionCard } from "@/components/RedemptionCard";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/utils/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const userSubscription = await prisma.userSubscription.findUnique({
    where: { userId: session.user.id },
    include: { plan: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your subscription plan and payment methods.
        </p>
      </div>
      <Separator />

      <div className="grid gap-6">
        <section>
             <h2 className="text-lg font-medium mb-4">Current Subscription</h2>
             {userSubscription && userSubscription.status === 'ACTIVE' ? (
                 <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>{userSubscription.plan.name}</CardTitle>
                                <CardDescription>
                                    Renews on {new Date(userSubscription.endDate).toLocaleDateString()}
                                </CardDescription>
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">Active</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold">${Number(userSubscription.plan.price)}</span>
                            <span className="text-muted-foreground">/{userSubscription.plan.duration} days</span>
                        </div>
                    </CardContent>
                 </Card>
             ) : (
                 <Card className="border-dashed">
                     <CardHeader>
                         <CardTitle>Free Plan</CardTitle>
                         <CardDescription>You are currently on the free plan.</CardDescription>
                     </CardHeader>
                     <CardFooter>
                         <Button asChild>
                             <a href="/subscription">Upgrade Plan</a>
                         </Button>
                     </CardFooter>
                 </Card>
             )}
        </section>

        <section>
             <h2 className="text-lg font-medium mb-4">Redeem Code</h2>
             <RedemptionCard />
        </section>
      </div>
    </div>
  );
}
