import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";
import type { User } from "@prisma/client";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Personal Information</h1>
      <ProfileForm user={session.user as User} />
    </div>
  );
}
