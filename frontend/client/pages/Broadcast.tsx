import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { Bell, Send, Users, Shield, Target, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { broadcastApi, usersApi } from "@/lib/api";
import { BroadcastMessage } from "@/types";

export default function Broadcast() {
  const { user } = useAuth();
  const { addBroadcastNotification } = useNotifications();
  
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetAudience, setTargetAudience] = useState<"all" | "students" | "admins">("all");
  const [notificationType, setNotificationType] = useState<"info" | "success" | "warning" | "error">("info");
  const [sendEmail, setSendEmail] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastMessage[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [recipientPreview, setRecipientPreview] = useState({ all: 0, student: 0, admin: 0 });

  const loadData = async () => {
    const [historyRes, usersRes, previewRes] = await Promise.allSettled([
      broadcastApi.getAll(),
      usersApi.getAll(),
      broadcastApi.getRecipientPreview(),
    ]);

    if (historyRes.status === "fulfilled") {
      const history = historyRes.value;
      setBroadcastHistory(Array.isArray(history) ? history : []);
    } else {
      setBroadcastHistory([]);
    }

    if (usersRes.status === "fulfilled") {
      const users = usersRes.value;
      const allUsers = Array.isArray(users) ? users : [];
      setStudentCount(allUsers.filter((u: any) => (u.role || "").toLowerCase() === "student").length);
      setAdminCount(allUsers.filter((u: any) => (u.role || "").toLowerCase() === "admin").length);
    } else {
      setStudentCount(0);
      setAdminCount(0);
    }

    if (previewRes.status === "fulfilled") {
      const preview = previewRes.value as any;
      setRecipientPreview({
        all: preview?.all || 0,
        student: preview?.student || 0,
        admin: preview?.admin || 0,
      });
    } else {
      setRecipientPreview({ all: 0, student: 0, admin: 0 });
    }

    if (
      historyRes.status === "rejected" &&
      usersRes.status === "rejected" &&
      previewRes.status === "rejected"
    ) {
      toast.error("Could not load broadcast data.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSending(true);
    try {
      if (targetAudience === "all") {
        await broadcastApi.sendToAllUsers({
          title,
          message,
          type: notificationType,
          sendEmail,
        });
      } else if (targetAudience === "students") {
        await broadcastApi.sendToStudents({
          title,
          message,
          type: notificationType,
          sendEmail,
        });
      } else {
        const mappedRole = "admin";
        await broadcastApi.send({
          title,
          message,
          targetRole: mappedRole,
          type: notificationType,
          sendEmail,
        });
      }

      addBroadcastNotification(title, message, notificationType);
      setTitle("");
      setMessage("");
      await loadData();

      const audienceText = targetAudience === "all" ? "all users" : targetAudience === "students" ? "all students" : "all admins";
      toast.success(`Message broadcasted to ${audienceText}${sendEmail ? " with email" : ""}.`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to send broadcast.");
    } finally {
      setIsSending(false);
    }
  };

  // Delete broadcast message
  const deleteBroadcast = async (broadcastId: string) => {
    try {
      await broadcastApi.delete(broadcastId);
      await loadData();
      toast.success("Message deleted successfully!");
    } catch {
      toast.error("Failed to delete message.");
    }
  };

  // Refresh history
  const refreshHistory = () => {
    loadData();
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Broadcast Messages</h1>
            <p className="text-muted-foreground mt-1">
              Send announcements and notifications to students or admins
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Create Broadcast Message
            </CardTitle>
            <CardDescription>
              Reach out to your entire community with important announcements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Message Title</Label>
              <Input
                id="title"
                placeholder="Enter message title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Write your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
              />
            </div>

            {/* Target Audience */}
            <div className="space-y-3">
              <Label>Target Audience</Label>
              <RadioGroup 
                value={targetAudience} 
                onValueChange={(v) => setTargetAudience(v as "all" | "students" | "admins")}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer">
                    <Users className="w-4 h-4" />
                    Everyone ({studentCount + adminCount} users)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="students" id="students" />
                  <Label htmlFor="students" className="flex items-center gap-2 cursor-pointer">
                    <Shield className="w-4 h-4" />
                    Students Only ({studentCount} students)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admins" id="admins" />
                  <Label htmlFor="admins" className="flex items-center gap-2 cursor-pointer">
                    <Target className="w-4 h-4" />
                    Admins Only ({adminCount} admins)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Notification Type */}
            <div className="space-y-2">
              <Label>Message Type</Label>
              <Select 
                value={notificationType} 
                onValueChange={(v) => setNotificationType(v as "info" | "success" | "warning" | "error")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">📢 Info (Blue)</SelectItem>
                  <SelectItem value="success">✅ Success (Green)</SelectItem>
                  <SelectItem value="warning">⚠️ Warning (Orange)</SelectItem>
                  <SelectItem value="error">❌ Error (Red)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Send Email Copy</p>
                <p className="text-xs text-muted-foreground">Deliver this broadcast to recipient email addresses</p>
              </div>
              <Button variant={sendEmail ? "default" : "outline"} onClick={() => setSendEmail((v) => !v)}>
                {sendEmail ? "Enabled" : "Disabled"}
              </Button>
            </div>

            <div className="rounded-lg border border-border p-3 text-sm">
              Will send to{" "}
              <span className="font-semibold">
                {targetAudience === "students"
                  ? recipientPreview.student
                  : targetAudience === "admins"
                    ? recipientPreview.admin
                    : recipientPreview.all}
              </span>{" "}
              recipients.
            </div>

            {/* Send Button */}
            <Button 
              onClick={handleBroadcast} 
              disabled={isSending || !title.trim() || !message.trim()}
              className="w-full gap-2"
              size="lg"
            >
              <Send className="w-4 h-4" />
              {isSending ? "Sending..." : "Broadcast Message"}
            </Button>
          </CardContent>
        </Card>

        {/* Broadcast History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Broadcast History</CardTitle>
                <CardDescription>
                  View your previously sent messages
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={refreshHistory}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {broadcastHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No broadcast messages sent yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {broadcastHistory.slice(0, 10).map((broadcast) => (
                  <div 
                    key={broadcast.id} 
                    className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            broadcast.type === "info" ? "bg-blue-500" :
                            broadcast.type === "success" ? "bg-green-500" :
                            broadcast.type === "warning" ? "bg-orange-500" : "bg-red-500"
                          }`} />
                          <h4 className="font-medium text-foreground">{broadcast.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{broadcast.message}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Status: {broadcast.status}</span>
                          <span>Recipients: {broadcast.recipientCount}</span>
                          <span>
                            Email: {broadcast.sendEmail ? `Sent ${broadcast.emailSentCount}` : "Disabled"}
                          </span>
                          {broadcast.sendEmail && broadcast.emailFailedCount > 0 && (
                            <span>Failed: {broadcast.emailFailedCount}</span>
                          )}
                        </div>
                        {broadcast.failureReason && (
                          <p className="mt-2 text-xs text-red-600">{broadcast.failureReason}</p>
                        )}
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <Badge variant="outline">{broadcast.targetRole}</Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(broadcast.createdAt).toLocaleDateString()}
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => deleteBroadcast(broadcast.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

