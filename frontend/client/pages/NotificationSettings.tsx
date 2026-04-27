import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { getJson, setJson } from "@/lib/safeStorage";
import { Bell, Mail, Smartphone, Clock, Radio, UserCheck, Save } from "lucide-react";

interface Settings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  activityReminders: boolean;
  broadcastMessages: boolean;
  registrationUpdates: boolean;
}

export default function NotificationSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>({
    emailNotifications: true,
    pushNotifications: true,
    activityReminders: true,
    broadcastMessages: true,
    registrationUpdates: true
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      const stored = getJson<Settings | null>(`notification_settings_${user.id}`, null);
      if (stored && typeof stored === "object") {
        setSettings((prev) => ({ ...prev, ...stored }));
      }
    }
  }, [user]);

  const handleToggle = (key: keyof Settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    if (!user) return;
    setIsSaving(true);
    setJson(`notification_settings_${user.id}`, settings);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Notification settings saved!");
    }, 500);
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-lg font-medium text-foreground">Please login to manage notification settings</p>
        </div>
      </Layout>
    );
  }

  const SettingItem = ({ 
    icon: Icon, 
    title, 
    description, 
    enabled, 
    onToggle 
  }: { 
    icon: React.ElementType; 
    title: string; 
    description: string; 
    enabled: boolean; 
    onToggle: () => void;
  }) => (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${enabled ? "bg-blue-100 dark:bg-blue-900/30" : "bg-muted"}`}>
          <Icon className={`w-5 h-5 ${enabled ? "text-blue-600" : "text-muted-foreground"}`} />
        </div>
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        aria-label={`${title} toggle`}
        onClick={onToggle}
        className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? "bg-blue-500" : "bg-muted"}`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? "left-7" : "left-1"}`} />
      </button>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notification Settings</h1>
          <p className="text-muted-foreground mt-1">Manage how you receive notifications</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>Choose which notifications you want to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingItem
              icon={Mail}
              title="Email Notifications"
              description="Receive updates via email"
              enabled={settings.emailNotifications}
              onToggle={() => handleToggle("emailNotifications")}
            />
            <SettingItem
              icon={Smartphone}
              title="Push Notifications"
              description="Receive browser push notifications"
              enabled={settings.pushNotifications}
              onToggle={() => handleToggle("pushNotifications")}
            />
            <SettingItem
              icon={Clock}
              title="Activity Reminders"
              description="Get reminded before activities start"
              enabled={settings.activityReminders}
              onToggle={() => handleToggle("activityReminders")}
            />
            <SettingItem
              icon={Radio}
              title="Broadcast Messages"
              description="Receive announcements from admins"
              enabled={settings.broadcastMessages}
              onToggle={() => handleToggle("broadcastMessages")}
            />
            <SettingItem
              icon={UserCheck}
              title="Registration Updates"
              description="Get notified about registration status changes"
              enabled={settings.registrationUpdates}
              onToggle={() => handleToggle("registrationUpdates")}
            />
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </Layout>
  );
}

