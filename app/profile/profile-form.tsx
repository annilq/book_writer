"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import type { User, UserSubscription, SubscriptionPlan } from "@prisma/client";

type SubscriptionWithPlan = UserSubscription & { 
  plan: Omit<SubscriptionPlan, "price"> & { price: string | number } 
};

export function ProfileForm({ user, subscription }: { user: Partial<User>; subscription?: SubscriptionWithPlan | null }) {
  const { t } = useTranslation();
  const [name, setName] = useState(user.name || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      toast.success(t("profileUpdated"));
    } catch (error) {
      toast.error(t("errorUpdatingProfile"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
          <Avatar className="h-24 w-24 border-2 border-muted">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback className="text-2xl">{user.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <div>
                <h3 className="text-xl font-semibold tracking-tight">{user.name}</h3>
                <p className="text-sm text-muted-foreground font-mono">{user.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs font-normal">
                    {user.role || 'USER'}
                </Badge>
                {user.status === 'ACTIVE' ? (
                     <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 text-xs font-normal">Active</Badge>
                ) : (
                     <Badge variant="destructive" className="text-xs font-normal">Banned</Badge>
                )}
                {subscription && subscription.status === 'ACTIVE' && (
                    <Badge variant="secondary" className="text-xs font-normal">
                        {subscription.plan.name}
                    </Badge>
                )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
          <div className="grid gap-2">
            <Label htmlFor="name">{t("displayName")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="max-w-md"
            />
            <p className="text-[0.8rem] text-muted-foreground">
              This is your public display name.
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" value={user.email || ""} disabled className="max-w-md bg-muted/50" />
             <p className="text-[0.8rem] text-muted-foreground">
              Email address cannot be changed.
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="id" className="font-mono text-xs uppercase text-muted-foreground">User ID</Label>
            <div className="flex items-center gap-2">
                <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-medium">
                    {user.id}
                </code>
            </div>
          </div>
          
          <div className="pt-4">
             <Button type="submit" disabled={loading}>
                {loading ? t("saving") : t("saveChanges")}
            </Button>
          </div>
        </form>
    </div>
  );
}
