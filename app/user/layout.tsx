import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { UserSidebar } from "./components/Sidebar";

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
        <UserSidebar />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
