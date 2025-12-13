import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/utils/prisma";
import { RedemptionCard } from "@/components/RedemptionCard";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default async function UserSubscriptionPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const [userSubscription, plans] = await Promise.all([
    prisma.userSubscription.findUnique({
      where: { userId: session.user.id },
      include: { plan: true },
    }),
    prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' }
    })
  ]);

  return (
      <div className="space-y-8 max-w-5xl">
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          
          {/* Active Subscription */}
          {userSubscription && userSubscription.status === 'ACTIVE' ? (
              <Card className="border-primary/50 bg-primary/5">
                  <CardHeader>
                      <CardTitle>Active Subscription</CardTitle>
                      <CardDescription>
                          You are currently subscribed to <strong>{userSubscription.plan.name}</strong>.
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
                              <span className="ml-2">{userSubscription.startDate.toLocaleDateString()}</span>
                          </div>
                          <div>
                              <span className="text-muted-foreground">Expires On:</span>
                              <span className="ml-2 font-semibold">{userSubscription.endDate.toLocaleDateString()}</span>
                          </div>
                      </div>
                  </CardContent>
              </Card>
          ) : (
             <Card>
                 <CardHeader>
                     <CardTitle>No Active Subscription</CardTitle>
                     <CardDescription>You are currently on the free tier. Upgrade to unlock more features.</CardDescription>
                 </CardHeader>
             </Card>
          )}

          {/* Plans */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <Card key={plan.id} className="flex flex-col">
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
            </div>
          </div>

          {/* Redeem Code */}
          <div>
             <h2 className="text-xl font-semibold mb-4">Redeem Code</h2>
             <div className="max-w-md">
                <RedemptionCard />
             </div>
          </div>
      </div>
  )
}
