import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useActivities } from "@/context/ActivityContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, Mail, Calendar, Award, BookOpen, 
  Clock, CheckCircle, Star, Download, Activity as ActivityIcon,
  TrendingUp, Trophy, Flame, Zap
} from "lucide-react";
import { toast } from "sonner";
import { getJson, setJson, type LocalUserPreview } from "@/lib/safeStorage";
import { isValid, parseISO } from "date-fns";

export default function Profile() {
  const { user } = useAuth();
  const { activities, getUserActivities } = useActivities();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || "");

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-lg font-medium text-foreground mb-4">
            Please login to view your profile
          </p>
        </div>
      </Layout>
    );
  }

  const userActivities = user ? getUserActivities(user.id) : [];
  const registeredCount = userActivities.length;
  
  const userRatings = activities.flatMap(a => 
    (a.ratings || []).filter(r => r.userId === user.id)
  );
  const avgRatingGiven = userRatings.length > 0 
    ? (userRatings.reduce((sum, r) => sum + (Number(r.score) || 0), 0) / userRatings.length).toFixed(1)
    : "N/A";

  const completedCount = userActivities.filter((a) => {
    const d = parseISO(a.date ?? "");
    return isValid(d) && d < new Date();
  }).length;
  const upcomingCount = userActivities.filter((a) => {
    const d = parseISO(a.date ?? "");
    return isValid(d) && d > new Date();
  }).length;

  const handleSaveProfile = () => {
    if (editedName.trim()) {
      const users = getJson<LocalUserPreview[]>("users", []);
      const updatedUsers = users.map((u) => (u.id === user.id ? { ...u, name: editedName } : u));
      setJson("users", updatedUsers);
      setJson("currentUser", { ...user, name: editedName });
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    }
  };

  const handleDownloadCertificate = async (activity: any) => {
    try {
      const { jsPDF } = await import("jspdf");
      
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      // Certificate border
      doc.setLineWidth(2);
      doc.rect(10, 10, 277, 190);
      
      // Inner border
      doc.setLineWidth(0.5);
      doc.rect(15, 15, 270, 180);

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(36);
      doc.setTextColor(0, 51, 102);
      doc.text("CERTIFICATE OF PARTICIPATION", 148.5, 45, { align: "center" });

      // Decorative line
      doc.setLineWidth(1);
      doc.line(80, 55, 217, 55);

      // "This is to certify that"
      doc.setFont("helvetica", "normal");
      doc.setFontSize(16);
      doc.setTextColor(80, 80, 80);
      doc.text("This is to certify that", 148.5, 70, { align: "center" });

      // Student name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.setTextColor(0, 0, 0);
      doc.text(user.name, 148.5, 90, { align: "center" });

      // Underline for name
      doc.setLineWidth(0.5);
      doc.line(100, 95, 197, 95);

      // "has successfully participated in"
      doc.setFont("helvetica", "normal");
      doc.setFontSize(16);
      doc.setTextColor(80, 80, 80);
      doc.text("has successfully participated in the activity", 148.5, 110, { align: "center" });

      // Activity title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(0, 51, 102);
      doc.text(activity.title, 148.5, 130, { align: "center" });

      // Activity details
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(60, 60, 60);
      doc.text(`Category: ${activity.category}`, 148.5, 150, { align: "center" });
      doc.text(`Date: ${new Date(activity.date).toLocaleDateString()}`, 148.5, 160, { align: "center" });
      doc.text(`Venue: ${activity.venue}`, 148.5, 170, { align: "center" });

      // Footer branding
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text("Activity Hub Manager", 148.5, 195, { align: "center" });
      doc.text("Organizing and Managing Student Extracurricular Activities", 148.5, 202, { align: "center" });

      // Save PDF
      doc.save(`Certificate-${activity.title.replace(/\s+/g, "-")}.pdf`);
      
      toast.success("Certificate downloaded successfully!");
    } catch (error) {
      console.error("Error generating certificate:", error);
      toast.error("Failed to generate certificate");
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your account and view your activity</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Full Name</label>
                {isEditing ? (
                  <Input value={editedName} onChange={(e) => setEditedName(e.target.value)} placeholder="Your name" />
                ) : (
                  <div className="text-foreground font-medium flex items-center gap-2">
                    <span>{user.name}</span>
                    <Badge variant="outline" className="ml-2">{user.role}</Badge>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Email Address</label>
                <p className="text-foreground font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {user.email}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Member Since</label>
                <p className="text-foreground font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Account Type</label>
                <Badge className={user.role === "admin" ? "bg-blue-500" : "bg-green-500"}>
                  {user.role === "admin" ? "Administrator" : "Student"}
                </Badge>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              {isEditing ? (
                <div className="flex gap-2">
                  <Button onClick={handleSaveProfile}>Save Changes</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress Tracker */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              My Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Activity Goal</span>
                <span className="text-sm text-muted-foreground">{registeredCount} / 10</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  style={{ width: `${Math.min((registeredCount / 10) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <BookOpen className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold text-foreground">{registeredCount}</p>
                <p className="text-xs text-muted-foreground">Registered</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold text-foreground">{completedCount}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <Clock className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                <p className="text-2xl font-bold text-foreground">{upcomingCount}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <Star className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold text-foreground">{avgRatingGiven}</p>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${registeredCount >= 1 ? "bg-muted/50" : "bg-muted/20 opacity-50"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${registeredCount >= 1 ? "bg-yellow-500" : "bg-gray-400"}`}>
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${registeredCount >= 1 ? "text-foreground" : "text-muted-foreground"}`}>First Step</p>
                  <p className="text-xs text-muted-foreground">1 activity</p>
                </div>
                {registeredCount >= 1 && <Badge className="bg-green-500">✓</Badge>}
              </div>
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${registeredCount >= 5 ? "bg-muted/50" : "bg-muted/20 opacity-50"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${registeredCount >= 5 ? "bg-orange-500" : "bg-gray-400"}`}>
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${registeredCount >= 5 ? "text-foreground" : "text-muted-foreground"}`}>Getting Active</p>
                  <p className="text-xs text-muted-foreground">5 activities</p>
                </div>
                {registeredCount >= 5 && <Badge className="bg-green-500">✓</Badge>}
              </div>
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${registeredCount >= 10 ? "bg-muted/50" : "bg-muted/20 opacity-50"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${registeredCount >= 10 ? "bg-purple-500" : "bg-gray-400"}`}>
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${registeredCount >= 10 ? "text-foreground" : "text-muted-foreground"}`}>Champion</p>
                  <p className="text-xs text-muted-foreground">10 activities</p>
                </div>
                {registeredCount >= 10 && <Badge className="bg-green-500">✓</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registered Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivityIcon className="w-5 h-5" />
              My Registered Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userActivities.length > 0 ? (
              <div className="space-y-3">
                {userActivities.map((activity) => {
                  const isUpcoming = new Date(activity.date) > new Date();
                  const isFull = activity.currentParticipants.length >= activity.maxParticipants;
                  return (
                    <div key={activity.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{activity.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(activity.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {activity.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isUpcoming ? <Badge className="bg-green-500">Upcoming</Badge> : <Badge className="bg-gray-500">Completed</Badge>}
                        {isFull && <Badge className="bg-orange-500">Full</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>You haven't registered for any activities yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {completedCount > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Certificates of Participation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userActivities.filter(a => new Date(a.date) < new Date()).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h3 className="font-medium text-foreground">{activity.title}</h3>
                      <p className="text-sm text-muted-foreground">Certificate of Participation - Completed on {new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handleDownloadCertificate(activity)}>
                      <Download className="w-4 h-4" />
                      Download PDF
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
