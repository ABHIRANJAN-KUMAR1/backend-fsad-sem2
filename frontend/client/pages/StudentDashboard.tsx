import { Layout } from "@/components/Layout";
import { useActivities } from "@/context/ActivityContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { BookOpen, Award, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const { activities, getUserActivities } = useActivities();
  const { user } = useAuth();
  const navigate = useNavigate();

  const myActivities = user ? getUserActivities(user.id) : [];
  const totalRegistrations = myActivities.length;
  const upcomingActivities = activities.filter(
    (a) => new Date(a.date) > new Date()
  ).length;

  // Prepare data for participation chart
  const chartData = activities
    .filter((a) => myActivities.some((my) => my.id === a.id))
    .map((activity) => ({
      name: activity.title.substring(0, 12),
      category: activity.category,
    }));

  // Category breakdown
  const categoryBreakdown = [
    {
      name: "Clubs",
      value: myActivities.filter((a) => a.category === "Clubs").length,
    },
    {
      name: "Sports",
      value: myActivities.filter((a) => a.category === "Sports").length,
    },
    {
      name: "Events",
      value: myActivities.filter((a) => a.category === "Events").length,
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome, {user?.name}!</h1>
            <p className="text-muted-foreground mt-1">Your activity dashboard</p>
          </div>
          <Button onClick={() => navigate("/activities")} className="gap-2">
            <BookOpen className="w-4 h-4" />
            Browse Activities
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                My Registrations
              </h3>
              <BookOpen className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-foreground">{totalRegistrations}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Activities you're registered for
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Upcoming Events
              </h3>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-foreground">{upcomingActivities}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Available to register
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Participation Badge
              </h3>
              <Award className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {totalRegistrations >= 5 ? "Gold" : totalRegistrations >= 3 ? "Silver" : totalRegistrations >= 1 ? "Bronze" : "None"}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Based on activity registrations
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Activities Chart */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Your Registrations
            </h2>
            {chartData.length > 0 ? (
              <div className="space-y-3">
                {chartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-center">
                <div>
                  <p className="font-medium mb-2">No activities registered yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/activities")}
                  >
                    Browse Activities
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              By Category
            </h2>
            <div className="space-y-3">
              {categoryBreakdown.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{cat.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div
                        className="bg-blue-500 h-full rounded-full"
                        style={{
                          width: `${Math.max(
                            10,
                            (cat.value / Math.max(...categoryBreakdown.map((c) => c.value), 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="font-bold text-foreground w-8 text-right">
                      {cat.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => navigate("/activities")}
            >
              <BookOpen className="w-5 h-5 mr-2" />
              <div className="text-left">
                <p className="font-medium text-foreground">Browse Activities</p>
                <p className="text-xs text-muted-foreground">Find and join activities</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => navigate("/my-activities")}
            >
              <Award className="w-5 h-5 mr-2" />
              <div className="text-left">
                <p className="font-medium text-foreground">My Activities</p>
                <p className="text-xs text-muted-foreground">View your registrations</p>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
