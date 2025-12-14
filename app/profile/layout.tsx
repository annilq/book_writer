import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { ProfileSidebar } from "./components/Sidebar";

export default async function ProfileLayout({
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
      <Header className="border-b h-14" />
      <div className="flex flex-1 overflow-hidden">
        <ProfileSidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}
