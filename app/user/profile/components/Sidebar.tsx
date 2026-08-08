"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth } from "@/auth";
import { cn } from "@/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, CreditCard, Bell, FileText } from "lucide-react";

const sidebarItems = [
  {
    title: "Account",
    items: [
      {
        title: "General",
        href: "/user/profile",
        icon: User,
      },
      {
        title: "Billing",
        href: "/user/billing",
        icon: CreditCard,
      },
      {
        title: "Order History",
        href: "/user/orders",
        icon: FileText,
      },
      {
        title: "Notifications",
        href: "/user/notifications",
        icon: Bell,
      },
    ],
  },
];

export async function ProfileSidebar() {
  const pathname = usePathname();
  const session = await auth();
  const user = session?.user;

  return (
    <div className="w-64 border-r bg-muted/10 h-full flex-shrink-0 hidden md:block">
      <div className="border-b p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={user?.image || ""} />
            <AvatarFallback className="bg-brand/10 text-sm font-semibold text-brand">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">
              {user?.name ?? "User"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </div>
      </div>
      <nav className="p-4 space-y-8">
        {sidebarItems.map((group, index) => (
          <div key={index}>
            <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-brand/10 text-brand"
                        : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand" />
                    )}
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
