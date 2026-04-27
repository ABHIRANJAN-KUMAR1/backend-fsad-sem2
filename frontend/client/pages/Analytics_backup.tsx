import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { useActivities } from "@/context/ActivityContext";
import { Card, CardContent } from "@/components/ui/card";
import { getJson } from "@/lib/safeStorage";

export default function Analytics() {
  const { activities } = useActivities();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year" | "all">("month");
  const usersRaw = getJson<unknown>("users", []);
  const users = Array.isArray(usersRaw) ? usersRaw : [];
  const totalStudents = users.length;

  const filteredActivities = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;
    switch (timeRange) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = null;
    }
    return startDate 
      ? activities.filter(a => new Date(a.createdAt) >= startDate!)
      : activities;
  }, [activities, timeRange]);

  const stats = useMemo(() => {
    const total = filteredActivities.length;
    const upcoming = filteredActivities.filter(a => new Date(a.date) > new Date()).length;
    const completed = filteredActivities.filter(a => new Date(a.date) < new Date()).length;
      const totalRegistrations = filteredActivities.reduce(
        (sum, a) => sum + (a.currentParticipants ?? []).length,
        0,
      );
    const totalCheckIns = filteredActivities.reduce((sum, a) => sum + (a.checkIns?.length || 0), 0);
    const attendanceRate = totalRegistrations > 0 ? Math.round((totalCheckIns / totalRegistrations) * 100) : 0;
    return { total, upcoming, completed, totalRegistrations, totalCheckIns, attendanceRate };
  }, [filteredActivities]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track activity performance</p>
        </div>
        
        <div className="flex gap-2">
          {(["week", "month", "year", "all"] as const).map((range) => (
            <button 
              key={range} 
              onClick={() => setTimeRange(range)} 
              className={`px-4 py-2 rounded-lg ${timeRange === range ? "bg-blue-500 text-white" : "bg-muted"}`}
            >
              {range === "all" ? "All Time" : range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-3xl font-bold">{totalStudents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Activities</p>
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">{stats.upcoming} upcoming, {stats.completed} completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Registrations</p>
              <p className="text-3xl font-bold">{stats.totalRegistrations}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
              <p className="text-3xl font-bold">{stats.attendanceRate}%</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
