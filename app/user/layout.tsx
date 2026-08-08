import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { ProfileSidebar } from "./profile/components/Sidebar";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header className="border-b" />
      <div className="flex flex-1 overflow-hidden">
        <ProfileSidebar />
        <main className="flex-1 overflow-y-auto bg-muted/[0.02] px-6 py-8 md:px-10">
          <div className="mx-auto w-full max-w-4xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
