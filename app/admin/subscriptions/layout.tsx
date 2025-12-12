"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils";
import { Button } from "@/components/ui/button";

export default function SubscriptionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Subscription Management</h1>
      <div className="flex space-x-4 mb-6 border-b pb-2">
        <Link href="/admin/subscriptions/plans">
          <Button
            variant={pathname.includes("/plans") ? "default" : "ghost"}
          >
            Plans
          </Button>
        </Link>
        <Link href="/admin/subscriptions/codes">
          <Button
            variant={pathname.includes("/codes") ? "default" : "ghost"}
          >
            Redemption Codes
          </Button>
        </Link>
      </div>
      {children}
    </div>
  );
}
