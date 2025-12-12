"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import type { User, UserStatus, UserSubscription, SubscriptionPlan } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type UserWithSubscription = User & {
  subscription?: (UserSubscription & { 
    plan: Omit<SubscriptionPlan, "price"> & { price: string | number | any } 
  }) | null;
};

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      toast.error("Error fetching users");
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: string, data: Partial<User>) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update user");
      
      setUsers(users.map((u) => (u.id === id ? { ...u, ...data } : u)));
      toast.success("User updated successfully");
    } catch (error) {
      toast.error("Error updating user");
    }
  };

  const toggleUserStatus = (user: UserWithSubscription) => {
    const newStatus = user.status === "ACTIVE" ? "BANNED" : "ACTIVE";
    updateUser(user.id, { status: newStatus as UserStatus });
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={user.image || undefined} />
                  <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium">
                        {user.name} 
                        {session?.user?.id === user.id && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">You</span>
                        )}
                    </div>
                    {user.status === 'ACTIVE' ? (
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active</Badge>
                    ) : (
                        <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Banned</Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-xs text-gray-400">
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                    {user.subscription && user.subscription.status === 'ACTIVE' && (
                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full border border-purple-200">
                            {user.subscription.plan.name} • Exp: {new Date(user.subscription.endDate).toLocaleDateString()}
                        </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`user-status-${user.id}`}
                    checked={user.status === 'ACTIVE'}
                    disabled={session?.user?.role !== 'ADMIN'}
                    onCheckedChange={() => toggleUserStatus(user)}
                  />
                  <Label htmlFor={`user-status-${user.id}`}>
                    {user.status === 'ACTIVE' ? 'Enabled' : 'Disabled'}
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
