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
import { Plus, Copy, Loader2 } from "lucide-react";
import { useClipboard } from 'use-clipboard-copy';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

  if (loading) return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Redemption Codes</h1>
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

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Code</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Used By</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Expires At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes.map((code) => (
              <TableRow key={code.id}>
                <TableCell className="font-mono font-medium">{code.code}</TableCell>
                <TableCell>{code.plan.name}</TableCell>
                <TableCell>
                  {code.isUsed ? (
                    <span className="text-destructive">Used</span>
                  ) : (
                    <span className="text-success">Available</span>
                  )}
                </TableCell>
                <TableCell>
                  {code.usedByUser ? (
                    <div>
                      <div>{code.usedByUser.name}</div>
                      <div className="text-xs text-muted-foreground">{code.usedByUser.email}</div>
                    </div>
                  ) : "—"}
                </TableCell>
                <TableCell>{new Date(code.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : "Never"}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(code.code)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {codes.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No codes generated yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
