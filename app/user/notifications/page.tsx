import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure how you receive notifications.
        </p>
      </div>
      <Separator />

      <div className="space-y-8">
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Email Notifications</h3>
            <div className="grid gap-4">
                 <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base">Product Updates</Label>
                        <p className="text-sm text-muted-foreground">
                            Receive emails about new features and improvements.
                        </p>
                    </div>
                    <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base">Security Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                            Receive emails about your account security.
                        </p>
                    </div>
                    <Switch defaultChecked disabled />
                </div>
            </div>
        </div>

        <div className="flex justify-end">
            <Button>Save Preferences</Button>
        </div>
      </div>
    </div>
  );
}
