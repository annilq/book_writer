"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Copy } from "lucide-react";
import { useClipboard } from 'use-clipboard-copy';

interface Code {
  id: string;
  code: string;
  plan: { name: string };
  isUsed: boolean;
  usedByUser: { name: string; email: string } | null;
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface Plan {
  id: string;
  name: string;
}

export default function CodesPage() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const clipboard = useClipboard();

  // Form state
  const [formData, setFormData] = useState({
    planId: "",
    count: "1",
    expirationDate: "",
  });

  useEffect(() => {
    fetchCodes();
    fetchPlans();
  }, []);

  const fetchCodes = async () => {
    try {
      const res = await fetch("/api/admin/redemption-codes");
      if (!res.ok) throw new Error("Failed to fetch codes");
      const data = await res.json();
      setCodes(data);
    } catch (error) {
      toast.error("Error fetching codes");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/admin/subscription-plans");
      if (!res.ok) throw new Error("Failed to fetch plans");
      const data = await res.json();
      setPlans(data.filter((p: any) => p.isActive));
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/redemption-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to generate codes");

      await fetchCodes();
      setIsDialogOpen(false);
      setFormData({ planId: "", count: "1", expirationDate: "" });
      toast.success("Codes generated successfully");
    } catch (error) {
      toast.error("Error generating codes");
    }
  };

  const copyToClipboard = (text: string) => {
      clipboard.copy(text);
      toast.success("Code copied");
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Redemption Codes</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Generate Codes</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Redemption Codes</DialogTitle>
              <DialogDescription>
                Create new codes for users to redeem subscriptions.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="plan">Plan</Label>
                <Select
                  value={formData.planId}
                  onValueChange={(val) => setFormData({ ...formData, planId: val })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="count">Count</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.count}
                  onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="expirationDate">Expiration Date (Optional)</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="submit">Generate</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th className="px-6 py-3">Code</th>
                        <th className="px-6 py-3">Plan</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Used By</th>
                        <th className="px-6 py-3">Created At</th>
                        <th className="px-6 py-3">Expires At</th>
                        <th className="px-6 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {codes.map((code) => (
                        <tr key={code.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                            <td className="px-6 py-4 font-mono font-medium">{code.code}</td>
                            <td className="px-6 py-4">{code.plan.name}</td>
                            <td className="px-6 py-4">
                                {code.isUsed ? (
                                    <span className="text-red-600">Used</span>
                                ) : (
                                    <span className="text-green-600">Available</span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                {code.usedByUser ? (
                                    <div>
                                        <div>{code.usedByUser.name}</div>
                                        <div className="text-xs text-gray-500">{code.usedByUser.email}</div>
                                    </div>
                                ) : "-"}
                            </td>
                            <td className="px-6 py-4">
                                {new Date(code.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                                {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : "Never"}
                            </td>
                            <td className="px-6 py-4">
                                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(code.code)}>
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
