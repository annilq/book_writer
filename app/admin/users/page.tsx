"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import type { User, UserStatus, UserSubscription, SubscriptionPlan } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type UserWithSubscription = User & {
  subscription?: (UserSubscription & { 
    plan: Omit<SubscriptionPlan, "price"> & { price: string | number | any } 
  }) | null;
};

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm font-mono">
      Loading data...
    </div>
  );

  return (
    <div className="space-y-6 mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your users, view their subscriptions and status.
          </p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            className="pl-9 h-9 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[300px]">User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border">
                      <AvatarImage src={user.image || undefined} />
                      <AvatarFallback className="text-xs">{user.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm flex items-center gap-2">
                        {user.name}
                        {session?.user?.id === user.id && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">You</Badge>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">{user.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {user.status === 'ACTIVE' ? (
                    <Badge variant="outline" className="border-transparent bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 font-normal">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="font-normal">
                      Banned
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {user.subscription && user.subscription.status === 'ACTIVE' ? (
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm">{user.subscription.plan.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Exp: {new Date(user.subscription.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground font-mono">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-muted-foreground mr-2">
                      {user.status === 'ACTIVE' ? 'Enabled' : 'Disabled'}
                    </span>
                    <Switch
                      checked={user.status === 'ACTIVE'}
                      disabled={session?.user?.role !== 'ADMIN' || session?.user?.id === user.id}
                      onCheckedChange={() => toggleUserStatus(user)}
                      className="scale-75 origin-right"
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
