"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils";
import { User, CreditCard, Bell, LayoutDashboard, Settings } from "lucide-react";

const sidebarItems = [
  {
    title: "Account",
    items: [
      {
        title: "General",
        href: "/profile",
        icon: User,
      },
      {
        title: "Billing",
        href: "/profile/billing",
        icon: CreditCard,
      },
      {
        title: "Notifications",
        href: "/profile/notifications",
        icon: Bell,
      },
    ],
  },
];

export function ProfileSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r bg-muted/10 h-full flex-shrink-0 hidden md:block">
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
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-secondary text-secondary-foreground"
                        : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
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
