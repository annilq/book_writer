"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The canonical subscription page is now /user/subscription.
// This route is kept for backward compatibility (e.g. Stripe return URLs
// like /subscription?success=true) and forwards any query params.
export default function SubscriptionPage() {
  const router = useRouter();

  useEffect(() => {
    const qs = typeof window !== "undefined" ? window.location.search : "";
    router.replace(`/user/subscription${qs}`);
  }, [router]);

  return null;
}
