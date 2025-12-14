import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";
import type { User } from "@prisma/client";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/utils/prisma";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  // Fetch subscription just for the badge in ProfileForm if needed, 
  // or we can remove it from ProfileForm if we want strict separation.
  // The original ProfileForm uses subscription to show a badge. 
  // I will keep it for now as it's nice to have status in profile.
  const userSubscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    include: { plan: true },
  });

  const serializedSubscription = userSubscription ? {
    ...userSubscription,
    plan: {
      ...userSubscription.plan,
      price: userSubscription.plan.price.toString(),
    }
  } : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">General</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal information and profile settings.
        </p>
      </div>
      <Separator />
      <ProfileForm user={session.user as User} subscription={serializedSubscription} />
    </div>
  );
}
