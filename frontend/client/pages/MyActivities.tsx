import React, { useState, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { ActivityCard } from "@/components/ActivityCard";
import { useActivities } from "@/context/ActivityContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Calendar, 
  Award, 
  Users, 
  Download, 
  CheckCircle, 
  Clock 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { generateCertificatePDF } from "@/lib/certificate";
import { format, isPast, isValid, parseISO } from "date-fns";

function safeActivityDate(date: string | undefined): Date | null {
  const d = parseISO(date ?? "");
  return isValid(d) ? d : null;
}

export default function MyActivities() {
  const navigate = useNavigate();
  const { getUserActivities, unregisterFromActivity } = useActivities();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "stats">("upcoming");

  const myActivities = user ? getUserActivities(user.id) : [];
  
  // Separate tabs
  const now = new Date();
  const upcomingActivities = myActivities.filter((a) => {
    const dt = safeActivityDate(a.date);
    return dt ? !isPast(dt) : false;
  });
  const pastActivities = myActivities.filter((a) => {
    const dt = safeActivityDate(a.date);
    return dt ? isPast(dt) : false;
  });

  // Stats
  const totalJoined = myActivities.length;
  const totalUpcoming = upcomingActivities.length;
  const totalCompleted = pastActivities.length;
  const avgRatingGiven = myActivities.reduce((sum, a) => {
    const userRatings = a.ratings?.filter(r => r.userId === user?.id) || [];
    return sum + (userRatings.reduce((s, r) => s + (Number(r.score) || 0), 0) / Math.max(userRatings.length, 1) || 0);
  }, 0) / Math.max(totalJoined, 1);

  // Certificate handler
  const handleUnregister = useCallback((activityId: string) => {
    if (user) {
      unregisterFromActivity(user.id, activityId);
      toast.success("Unregistered from activity");
    }
  }, [user, unregisterFromActivity]);

  const handleDownloadCertificate = useCallback((activity: any) => {
    if (user) {
      generateCertificatePDF(activity, user.name);
      toast.success("Certificate downloaded!");
    }
  }, [user]);

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-lg font-medium text-foreground mb-4">Please login to view your activities</p>
          <Button onClick={() => navigate("/login")}>Login</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-500" />
              My Activities
            </h1>
            <p className="text-muted-foreground mt-1">
              {totalJoined} activities total | {totalUpcoming} upcoming
            </p>
          </div>
          <Button onClick={() => navigate("/activities")} className="gap-2">
            <Calendar className="w-4 h-4" />
            Browse More
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 mx-auto flex items-center justify-center mb-3">
              <BookOpen className="w-7 h-7 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-foreground">{totalJoined}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Joined</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/30 mx-auto flex items-center justify-center mb-3">
              <Calendar className="w-7 h-7 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-foreground">{totalUpcoming}</p>
            <p className="text-sm text-muted-foreground mt-1">Upcoming</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 mx-auto flex items-center justify-center mb-3">
              <Award className="w-7 h-7 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-foreground">{totalCompleted}</p>
            <p className="text-sm text-muted-foreground mt-1">Completed</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming" className="gap-2">
              <Calendar className="w-4 h-4" />
              Upcoming
              <span className="ml-auto text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded-full font-mono">{totalUpcoming}</span>
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Past
              <span className="ml-auto text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded-full font-mono">{totalCompleted}</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <Users className="w-4 h-4" />
              Stats
            </TabsTrigger>
          </TabsList>

          {/* Upcoming */}
          <TabsContent value="upcoming" className="mt-6">
            {upcomingActivities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingActivities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    isRegistered={true}
                    onUnregister={() => handleUnregister(activity.id)}
                    isAdmin={false}
                    showFavoriteButton={true}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-border rounded-lg">
                <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No upcoming activities</h3>
                <p className="text-muted-foreground mb-6">Browse and register for activities to see them here</p>
                <Button onClick={() => navigate("/activities")}>
                  Find Activities
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Past */}
          <TabsContent value="past" className="mt-6">
            {pastActivities.length > 0 ? (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download All Certificates
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastActivities.map((activity) => (
                    <div key={activity.id} className="group relative">
                      <ActivityCard
                        activity={activity}
                        isRegistered={true}
                        isAdmin={false}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all"
                        onClick={() => handleDownloadCertificate(activity)}
                      >
                        <Award className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-border rounded-lg">
                <CheckCircle className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No completed activities</h3>
                <p className="text-muted-foreground mb-6">Join more activities to see your history here</p>
                <Button onClick={() => navigate("/activities")}>
                  Join Activities
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Stats */}
          <TabsContent value="stats" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-card border border-border p-6 rounded-lg">
                <div className="text-3xl font-bold text-foreground">{totalJoined}</div>
                <div className="text-muted-foreground mt-1">Total Activities Joined</div>
              </div>
              <div className="bg-card border border-border p-6 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold text-blue-600">{totalUpcoming}</div>
                  <Clock className="w-8 h-8 text-blue-500 bg-blue-100 rounded-lg p-2" />
                </div>
                <div className="text-muted-foreground mt-1">Upcoming</div>
              </div>
              <div className="bg-card border border-border p-6 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold text-green-600">{totalCompleted}</div>
                  <CheckCircle className="w-8 h-8 text-green-500 bg-green-100 rounded-lg p-2" />
                </div>
                <div className="text-muted-foreground mt-1">Completed</div>
              </div>
              <div className="bg-card border border-border p-6 rounded-lg md:col-span-2 lg:col-span-1">
                <div className="text-2xl font-bold text-yellow-600 mb-2">{avgRatingGiven.toFixed(1)}</div>
                <div>Average Rating Given</div>
                <div className="text-sm text-muted-foreground mt-1">Out of 5 stars</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

