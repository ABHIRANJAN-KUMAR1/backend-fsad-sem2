import { Layout } from "@/components/Layout";
import { useActivities } from "@/context/ActivityContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line 
} from "recharts";
import { 
  Plus, Users, BookOpen, TrendingUp, Calendar, 
  CheckCircle, Clock, AlertCircle, ArrowRight, Activity as ActivityIcon,
  UserPlus, FileText, Settings, User, Mail, Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
import { usersApi } from "@/lib/api";

export default function AdminDashboard() {
  const { activities, reloadActivities } = useActivities();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);

  const refreshData = useCallback(async (showToast: boolean = true) => {
    setIsRefreshing(true);
    try {
      await reloadActivities();
      const students = await usersApi.getStudents();
      setTotalStudents(Array.isArray(students) ? students.length : 0);
      if (showToast) {
        toast.success("Data refreshed!");
      }
    } catch {
      if (showToast) {
        toast.error("Refresh failed");
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [reloadActivities]);

  useEffect(() => {
    refreshData(false);

    const intervalId = setInterval(() => {
      refreshData(false);
    }, 30000);

    const onFocus = () => refreshData(false);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refreshData(false);
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshData]);

  const totalActivities = activities.length;

  // Mock user lookup for dashboard (real data in server JSON)
  const getUserById = (userId: string) => {
    const users = [
      { id: "user_1773122259066", name: "rohan", email: "2400030581@kluniversity.in", role: "student" },
      { id: "user_1773122299571", name: "himanshu", email: "2400030582@kluniversity.in", role: "student" },
      { id: "user_1773122343630", name: "john", email: "2400030583@kluniversity.in", role: "student" },
      { id: "admin_1", name: "sohan", email: "abhiranjansinghsci@gmail.com", role: "admin" }
    ];
    return users.find(u => u.id === userId);
  };

  // Get registered students for activity (data persists in activities.json)
  const getRegisteredStudents = (activityId: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return [];
    return activity.currentParticipants.map(userId => getUserById(userId)).filter(Boolean) as any[];
  };

  // Selected activity details
  const selectedActivityData = selectedActivity ? activities.find(a => a.id === selectedActivity) : null;
  const registeredStudents = selectedActivity ? getRegisteredStudents(selectedActivity) : [];
  
  // Calculate registrations
  const totalRegistrations = activities.reduce(
    (sum, a) => sum + a.currentParticipants.length, 0
  );
  
  const activeEvents = activities.filter(
    (a) => new Date(a.date) > new Date()
  ).length;
  
  const completedEvents = activities.filter(
    (a) => new Date(a.date) < new Date()
  ).length;

  // Calculate occupancy rate
  const totalCapacity = activities.reduce((sum, a) => sum + a.maxParticipants, 0);
  const occupancyRate = totalCapacity > 0 
    ? Math.round((totalRegistrations / totalCapacity) * 100) 
    : 0;

  // Activity by status
  const statusData = [
    { name: "Upcoming", value: activeEvents, color: "#3b82f6" },
    { name: "Completed", value: completedEvents, color: "#10b981" },
    { name: "Full", value: activities.filter(a => a.currentParticipants.length >= a.maxParticipants).length, color: "#f59e0b" },
  ];

  // Category data
  const categoryChartData = [
    {
      name: "Clubs",
      value: activities.filter((a) => a.category === "Clubs").length,
    },
    {
      name: "Sports",
      value: activities.filter((a) => a.category === "Sports").length,
    },
    {
      name: "Events",
      value: activities.filter((a) => a.category === "Events").length,
    },
  ];

  // Participation trend (mock data for demo)
  const trendData = [
    { month: "Jan", registrations: 45 },
    { month: "Feb", registrations: 52 },
    { month: "Mar", registrations: 38 },
    { month: "Apr", registrations: 65 },
    { month: "May", registrations: 48 },
    { month: "Jun", registrations: totalRegistrations || 72 },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {user?.name || "Admin"}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your activities today.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/activities/new")} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Activity
            </Button>
            <Button onClick={() => refreshData(true)} disabled={isRefreshing} variant="outline" className="gap-2">
              <ArrowRight className="w-4 h-4" />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                +{totalStudents} total
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">{totalStudents}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Students</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{totalActivities}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Activities</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{totalRegistrations}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Registrations</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-xs font-medium text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">
                {occupancyRate}%
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">{occupancyRate}%</p>
            <p className="text-sm text-muted-foreground mt-1">Avg. Occupancy</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center justify-center gap-2"
            onClick={() => navigate("/activities/new")}
          >
            <Plus className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium">New Activity</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center justify-center gap-2"
            onClick={() => navigate("/students")}
          >
            <UserPlus className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium">View Students</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center justify-center gap-2"
            onClick={() => navigate("/categories")}
          >
            <FileText className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium">Categories</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center justify-center gap-2"
            onClick={() => navigate("/settings")}
          >
            <Settings className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium">Settings</span>
          </Button>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Status */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Activity Status
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Activities by Category
            </h2>
            {categoryChartData.some((c) => c.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis type="number" stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} />
                  <YAxis type="category" dataKey="name" stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} width={60} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No activities yet
              </div>
            )}
          </div>
        </div>

        {/* Registrations Trend & Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend Chart */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Registration Trend
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} />
                <YAxis stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="registrations" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", strokeWidth: 2 }}
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activities */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Recent Activities
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/activities")}
                className="gap-1"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {activities.slice(0, 5).length > 0 ? (
                activities.slice(0, 5).map((activity) => {
                  const isFull = activity.currentParticipants.length >= activity.maxParticipants;
                  const isUpcoming = new Date(activity.date) > new Date();
                  
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/activities/${activity.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isUpcoming ? "bg-blue-100 dark:bg-blue-900/30" : "bg-gray-100 dark:bg-gray-900/30"
                        }`}>
                          <ActivityIcon className={`w-5 h-5 ${isUpcoming ? "text-blue-600" : "text-gray-500"}`} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.date).toLocaleDateString()} • {activity.category}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">
                          {activity.currentParticipants.length}/{activity.maxParticipants}
                        </p>
                        {isFull ? (
                          <span className="text-xs text-orange-600">Full</span>
                        ) : isUpcoming ? (
                          <span className="text-xs text-green-600">Open</span>
                        ) : (
                          <span className="text-xs text-gray-500">Past</span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No activities yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => navigate("/activities/new")}
                  >
                    Create First Activity
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        {activeEvents > 0 && (
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Upcoming Events
              </h2>
              <span className="text-sm text-muted-foreground">
                {activeEvents} events scheduled
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activities
                .filter(a => new Date(a.date) > new Date())
                .slice(0, 3)
                .map((activity) => (
                  <div 
                    key={activity.id}
                    className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/activities/${activity.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-medium px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                        {activity.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {activity.currentParticipants.length}/{activity.maxParticipants}
                      </span>
                    </div>
                    <h3 className="font-medium text-foreground mb-1">{activity.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(activity.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Registered Students Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Event Registrations
            </h2>
            <span className="text-sm text-muted-foreground">
              View students registered for each activity
            </span>
          </div>
          
          {/* Activity Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Select Activity
            </label>
            <select
              aria-label="Select an activity to view registered students"
              value={selectedActivity || ""}
              onChange={(e) => setSelectedActivity(e.target.value || null)}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select an activity --</option>
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.title} ({activity.currentParticipants.length} registered)
                </option>
              ))}
            </select>
          </div>

          {/* Registered Students List */}
          {selectedActivity && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">
                  {selectedActivityData?.title}
                </h3>
                <Badge variant="secondary">
                  {registeredStudents.length} / {selectedActivityData?.maxParticipants} registered
                </Badge>
              </div>

              {registeredStudents.length > 0 ? (
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Student Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {registeredStudents.map((student: any, index: number) => (
                        <tr key={index} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-foreground">{student.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-foreground">{student.email}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="capitalize">
                              {student.role}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No students registered for this activity yet</p>
                </div>
              )}
            </div>
          )}

          {!selectedActivity && (
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Select an activity above to view registered students</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}