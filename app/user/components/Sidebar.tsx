"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils";
import { User, CreditCard, History, LayoutDashboard } from "lucide-react";

const sidebarItems = [
  {
    title: "Account",
    items: [
      {
        title: "Profile",
        href: "/user/profile",
        icon: User,
      },
    ],
  },
  {
    title: "Billing",
    items: [
      {
        title: "Subscription",
        href: "/user/subscription",
        icon: CreditCard,
      },
      {
        title: "Order History",
        href: "/user/orders",
        icon: History,
      },
    ],
  },
];

export function UserSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r bg-muted/20 h-full flex-shrink-0">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5" />
          User Center
        </h2>
      </div>
      <nav className="p-4 space-y-8">
        {sidebarItems.map((group, index) => (
          <div key={index}>
            <h3 className="mb-2 px-2 text-sm font-semibold text-muted-foreground tracking-wider uppercase">
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
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
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
