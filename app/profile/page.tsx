import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";
import type { User } from "@prisma/client";
import Header from "@/components/Header";
import { RedemptionCard } from "@/components/RedemptionCard";
import { prisma } from "@/utils/prisma";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const userSubscription = await prisma.userSubscription.findUnique({
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
    <div className="flex flex-col h-screen bg-background">
      <Header className="border-b" />
      <div className="container mx-auto p-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Personal Information</h1>
        <ProfileForm user={session.user as User} subscription={serializedSubscription} />
        <RedemptionCard />
      </div>
    </div>
  );
}
