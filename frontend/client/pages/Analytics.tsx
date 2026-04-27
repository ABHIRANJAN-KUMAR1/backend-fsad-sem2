import { useState, useMemo, useEffect, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { useActivities } from "@/context/ActivityContext";
import { usersApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { 
  TrendingUp, Users, BookOpen, Calendar, CheckCircle, Activity, 
  ArrowUp, ArrowDown, Download, Star, Target, Award, Eye,
  Zap, Heart, MessageCircle, ThumbsUp, Flame, Trophy,
  CalendarDays, Mail, FileSpreadsheet, FileText
} from "lucide-react";

export default function Analytics() {
  const { activities, reloadActivities } = useActivities();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year" | "all">("month");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "engagement" | "export">("overview");
  const [users, setUsers] = useState<any[]>([]);

  const totalStudents = users.length;

  const refreshAnalyticsData = useCallback(async () => {
    try {
      await reloadActivities();
      const latestUsers = await usersApi.getStudents();
      setUsers(Array.isArray(latestUsers) ? latestUsers : []);
    } catch {
      // Silent fail: keep last known data on screen
    }
  }, [reloadActivities]);

  useEffect(() => {
    refreshAnalyticsData();

    const intervalId = setInterval(() => {
      refreshAnalyticsData();
    }, 30000);

    const onFocus = () => refreshAnalyticsData();
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refreshAnalyticsData();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshAnalyticsData]);

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
    let filtered = startDate 
      ? activities.filter(a => new Date(a.createdAt) >= startDate!)
      : activities;
    if (selectedCategory !== "all") {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }
    return filtered;
  }, [activities, timeRange, selectedCategory]);

  const stats = useMemo(() => {
    const total = filteredActivities.length;
    const upcoming = filteredActivities.filter(a => new Date(a.date) > new Date()).length;
    const completed = filteredActivities.filter(a => new Date(a.date) < new Date()).length;
    const totalRegistrations = filteredActivities.reduce((sum, a) => sum + a.currentParticipants.length, 0);
    const totalCapacity = filteredActivities.reduce((sum, a) => sum + a.maxParticipants, 0);
    const totalCheckIns = filteredActivities.reduce((sum, a) => sum + (a.checkIns?.length || 0), 0);
    const totalComments = filteredActivities.reduce((sum, a) => sum + (a.comments?.length || 0), 0);
    const totalRatings = filteredActivities.reduce((sum, a) => sum + (a.ratings?.length || 0), 0);
    const attendanceRate = totalRegistrations > 0 ? Math.round((totalCheckIns / totalRegistrations) * 100) : 0;
    const avgRegistrations = total > 0 ? (totalRegistrations / total).toFixed(1) : "0";
    const fillRate = totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0;
    const engagementScore = Math.min(100, Math.round((attendanceRate * 0.3) + (fillRate * 0.3) + (totalComments / Math.max(total, 1) * 10) + (totalRatings / Math.max(total, 1) * 10)));
    return { total, upcoming, completed, totalRegistrations, totalCapacity, totalCheckIns, totalComments, totalRatings, attendanceRate, avgRegistrations, fillRate, engagementScore };
  }, [filteredActivities]);

  const categories = useMemo(() => {
    const cats = [...new Set(activities.map(a => a.category))];
    return ["all", ...cats];
  }, [activities]);

  const categoryData = useMemo(() => {
    const cats = ["Clubs", "Sports", "Events", "Academic", "Other"];
    return cats.map(cat => {
      const filtered = filteredActivities.filter(a => a.category === cat);
      return {
        name: cat,
        activities: filtered.length,
        registrations: filtered.reduce((sum, a) => sum + a.currentParticipants.length, 0),
      };
    }).filter(c => c.activities > 0);
  }, [filteredActivities]);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899"];

  const weeklyData = useMemo(() => {
    const weeks = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekActivities = activities.filter(a => {
        const date = new Date(a.date);
        return date >= weekStart && date < weekEnd;
      });
      const registrations = weekActivities.reduce((sum, a) => sum + a.currentParticipants.length, 0);
      const checkIns = weekActivities.reduce((sum, a) => sum + (a.checkIns?.length || 0), 0);
      weeks.push({ week: `Week ${6 - i}`, activities: weekActivities.length, registrations, checkIns });
    }
    return weeks;
  }, [activities]);

  const monthlyData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthActivities = activities.filter(a => {
        const date = new Date(a.date);
        return date >= monthStart && date <= monthEnd;
      });
      months.push({ month: monthStart.toLocaleDateString("en-US", { month: "short" }), activities: monthActivities.length, registrations: monthActivities.reduce((sum, a) => sum + a.currentParticipants.length, 0) });
    }
    return months;
  }, [activities]);

  const topActivities = useMemo(() => {
    return [...filteredActivities].sort((a, b) => b.currentParticipants.length - a.currentParticipants.length).slice(0, 8).map(a => ({
      name: a.title.length > 18 ? a.title.substring(0, 18) + "..." : a.title,
      fullTitle: a.title,
      registrations: a.currentParticipants.length,
      capacity: a.maxParticipants,
      percentage: Math.round((a.currentParticipants.length / a.maxParticipants) * 100),
      checkIns: a.checkIns?.length || 0,
      rating: a.ratings?.length ? (a.ratings.reduce((sum, r) => sum + r.score, 0) / a.ratings.length).toFixed(1) : "N/A"
    }));
  }, [filteredActivities]);

  const topStudents = useMemo(() => {
    const studentStats: Record<string, { name: string; email: string; count: number; checkIns: number }> = {};
    filteredActivities.forEach(activity => {
      activity.currentParticipants.forEach(studentId => {
        if (!studentStats[studentId]) {
          const user = users.find((u: any) => u.id === studentId);
          studentStats[studentId] = { name: user?.name || "Unknown", email: user?.email || "", count: 0, checkIns: 0 };
        }
        studentStats[studentId].count++;
      });
      activity.checkIns?.forEach(checkIn => {
        if (studentStats[checkIn.userId]) studentStats[checkIn.userId].checkIns++;
      });
    });
    return Object.entries(studentStats).map(([id, data]) => ({ id, ...data, attendanceRate: data.count > 0 ? Math.round((data.checkIns / data.count) * 100) : 0 })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [filteredActivities, users]);

  const feedbackSummary = useMemo(() => {
    let totalRating = 0;
    let totalReviews = 0;
    let ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    filteredActivities.forEach(activity => {
      activity.ratings?.forEach(rating => {
        totalRating += rating.score;
        totalReviews++;
        if (ratingCounts[rating.score as keyof typeof ratingCounts]) ratingCounts[rating.score as keyof typeof ratingCounts]++;
      });
    });
    const avgRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : "0";
    return { avgRating, totalReviews, ratingCounts: Object.entries(ratingCounts).map(([rating, count]) => ({ rating: parseInt(rating), count })) };
  }, [filteredActivities]);

  const radarData = useMemo(() => [
    { metric: "Activities", value: stats.total, fullMark: Math.max(stats.total * 1.5, 10) },
    { metric: "Registrations", value: stats.totalRegistrations, fullMark: Math.max(stats.totalRegistrations * 1.5, 50) },
    { metric: "Check-ins", value: stats.totalCheckIns, fullMark: Math.max(stats.totalCheckIns * 1.5, 50) },
    { metric: "Comments", value: stats.totalComments, fullMark: Math.max(stats.totalComments * 1.5, 30) },
    { metric: "Ratings", value: stats.totalRatings, fullMark: Math.max(stats.totalRatings * 1.5, 30) },
    { metric: "Capacity", value: stats.fillRate, fullMark: 100 },
  ], [stats]);

  const heatmapData = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayActivities = activities.filter(a => new Date(a.date).toDateString() === date.toDateString());
      days.push({ date: date.toISOString().split("T")[0], day: date.getDate(), activities: dayActivities.length, intensity: Math.min(dayActivities.length / 3, 1) });
    }
    return days;
  }, [activities]);

  const handleExportJSON = () => {
    const reportData = { generatedAt: new Date().toISOString(), timeRange, stats, categoryData, topActivities, topStudents, feedbackSummary };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = ["Metric", "Value"];
    const rows = [["Total Activities", stats.total], ["Upcoming Activities", stats.upcoming], ["Completed Activities", stats.completed], ["Total Registrations", stats.totalRegistrations], ["Total Check-ins", stats.totalCheckIns], ["Attendance Rate", `${stats.attendanceRate}%`], ["Capacity Fill Rate", `${stats.fillRate}%`], ["Engagement Score", stats.engagementScore], ["Average Rating", feedbackSummary.avgRating], ["Total Reviews", feedbackSummary.totalReviews]];
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-summary-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-500" />
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Track activity performance and user engagement</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleExportJSON}><FileText className="w-4 h-4 mr-2" />JSON</Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}><FileSpreadsheet className="w-4 h-4 mr-2" />CSV</Button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button variant={activeTab === "overview" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("overview")} className="gap-2">
            <Eye className="w-4 h-4" />Overview
          </Button>
          <Button variant={activeTab === "students" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("students")} className="gap-2">
            <Users className="w-4 h-4" />Students
          </Button>
          <Button variant={activeTab === "engagement" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("engagement")} className="gap-2">
            <Heart className="w-4 h-4" />Engagement
          </Button>
          <Button variant={activeTab === "export" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("export")} className="gap-2">
            <Download className="w-4 h-4" />Export
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-lg border">
          <div className="flex gap-2">
            {(["week", "month", "year", "all"] as const).map((range) => (
              <button key={range} onClick={() => setTimeRange(range)} className={`px-4 py-2 rounded-lg font-medium transition-all ${timeRange === range ? "bg-blue-500 text-white" : "bg-muted text-foreground hover:bg-muted/80"}`}>
                {range === "all" ? "All Time" : range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-4 py-2 rounded-lg border bg-background text-foreground">
            {categories.map(cat => <option key={cat} value={cat}>{cat === "all" ? "All Categories" : cat}</option>)}
          </select>
        </div>

        {activeTab === "overview" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:shadow-lg transition-all"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Students</p><p className="text-3xl font-bold mt-1">{totalStudents}</p><p className="text-xs text-green-600 flex items-center mt-1"><ArrowUp className="w-3 h-3" /> +12% from last month</p></div><div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><Users className="w-7 h-7 text-blue-600" /></div></div></CardContent></Card>
              <Card className="hover:shadow-lg transition-all"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Activities</p><p className="text-3xl font-bold mt-1">{stats.total}</p><p className="text-xs text-muted-foreground mt-1">{stats.upcoming} upcoming, {stats.completed} completed</p></div><div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><BookOpen className="w-7 h-7 text-green-600" /></div></div></CardContent></Card>
              <Card className="hover:shadow-lg transition-all"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Registrations</p><p className="text-3xl font-bold mt-1">{stats.totalRegistrations}</p><p className="text-xs text-muted-foreground mt-1">{stats.avgRegistrations} per activity avg</p></div><div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"><CheckCircle className="w-7 h-7 text-purple-600" /></div></div></CardContent></Card>
              <Card className="hover:shadow-lg transition-all"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Attendance Rate</p><p className="text-3xl font-bold mt-1">{stats.attendanceRate}%</p><p className="text-xs text-muted-foreground mt-1">{stats.totalCheckIns} check-ins</p></div><div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center"><Target className="w-7 h-7 text-orange-600" /></div></div></CardContent></Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover:shadow-lg transition-all"><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">Capacity Fill Rate</p><p className="text-4xl font-bold text-blue-600 mt-2">{stats.fillRate}%</p><p className="text-xs text-muted-foreground mt-1">{stats.totalRegistrations} / {stats.totalCapacity} slots</p></CardContent></Card>
              <Card className="hover:shadow-lg transition-all"><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">Average Rating</p><div className="flex items-center justify-center gap-1 mt-2"><p className="text-4xl font-bold text-yellow-500">{feedbackSummary.avgRating}</p><Star className="w-6 h-6 text-yellow-500 fill-yellow-500" /></div><p className="text-xs text-muted-foreground mt-1">{feedbackSummary.totalReviews} reviews</p></CardContent></Card>
              <Card className="hover:shadow-lg transition-all"><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">Engagement Score</p><p className="text-4xl font-bold text-green-600 mt-2">{stats.engagementScore}</p><p className="text-xs text-muted-foreground mt-1">Out of 100</p></CardContent></Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-500" />Monthly Registration Trend</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><AreaChart data={monthlyData}><defs><linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" className="opacity-30" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend /><Area type="monotone" dataKey="registrations" stroke="#3b82f6" fillOpacity={1} fill="url(#colorReg)" name="Registrations" strokeWidth={2} /><Bar dataKey="activities" fill="#10b981" name="Activities" radius={[4, 4, 0, 0]} /></AreaChart></ResponsiveContainer></CardContent></Card>
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-purple-500" />Category Distribution</CardTitle></CardHeader><CardContent>{categoryData.length > 0 ? <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={categoryData} cx="50%" cy="50%" labelLine label={({ name, activities }) => `${name}: ${activities}`} outerRadius={100} fill="#8884d8" dataKey="activities">{categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer> : <div className="h-[300px] flex items-center justify-center text-muted-foreground">No activities yet</div>}</CardContent></Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" />Performance Overview</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><RadarChart data={radarData}><PolarGrid /><PolarAngleAxis dataKey="metric" /><PolarRadiusAxis angle={30} domain={[0, "auto"]} /><Radar name="Value" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} /><Radar name="Target" dataKey="fullMark" stroke="#10b981" fill="none" strokeDasharray="5 5" /><Legend /><Tooltip /></RadarChart></ResponsiveContainer></CardContent></Card>
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-green-500" />Weekly Activity Breakdown</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={weeklyData}><CartesianGrid strokeDasharray="3 3" className="opacity-30" /><XAxis dataKey="week" /><YAxis /><Tooltip /><Legend /><Bar dataKey="registrations" fill="#3b82f6" name="Registrations" radius={[4, 4, 0, 0]} /><Bar dataKey="checkIns" fill="#10b981" name="Check-ins" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
            </div>

            <Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="w-5 h-5 text-blue-500" />Activity Calendar Heatmap (Last 30 Days)</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-1 justify-center">{heatmapData.map((day, index) => <div key={index} className="w-10 h-10 rounded-md flex flex-col items-center justify-center text-xs transition-all hover:scale-110 cursor-pointer" style={{ backgroundColor: day.activities === 0 ? "var(--muted)" : `rgba(59, 130, 246, ${0.2 + day.intensity * 0.8})`, color: day.intensity > 0.5 ? "white" : "var(--foreground)" }} title={`${day.date}: ${day.activities} activities`}><span className="font-medium">{day.day}</span></div>)}</div><div className="flex items-center justify-center gap-4 mt-4"><div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-muted" /><span className="text-xs text-muted-foreground">No activities</span></div><div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-500" /><span className="text-xs text-muted-foreground">High</span></div></div></CardContent></Card>

            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" />Top Activities by Registrations</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b"><th className="text-left py-3 px-4 font-medium text-muted-foreground">#</th><th className="text-left py-3 px-4 font-medium text-muted-foreground">Activity</th><th className="text-right py-3 px-4 font-medium text-muted-foreground">Reg</th><th className="text-right py-3 px-4 font-medium text-muted-foreground">Fill %</th><th className="text-right py-3 px-4 font-medium text-muted-foreground">Rating</th></tr></thead><tbody>{topActivities.map((activity, index) => <tr key={index} className="border-b hover:bg-muted/30"><td className="py-3 px-4"><span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? "bg-yellow-100 text-yellow-700" : index === 1 ? "bg-gray-100 text-gray-700" : index === 2 ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>{index + 1}</span></td><td className="py-3 px-4 font-medium">{activity.fullTitle}</td><td className="text-right py-3 px-4">{activity.registrations}</td><td className="text-right py-3 px-4"><div className="flex items-center justify-end gap-2"><div className="w-16 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${activity.percentage}%` }} /></div><span>{activity.percentage}%</span></div></td><td className="text-right py-3 px-4"><div className="flex items-center justify-end gap-1"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />{activity.rating}</div></td></tr>)}</tbody></table></div></CardContent></Card>
          </>
        )}

        {activeTab === "students" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">Active Students</p><p className="text-4xl font-bold text-blue-600 mt-2">{topStudents.length}</p></CardContent></Card>
              <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">Total Check-ins</p><p className="text-4xl font-bold text-green-600 mt-2">{stats.totalCheckIns}</p></CardContent></Card>
              <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">Avg. Attendance</p><p className="text-4xl font-bold text-purple-600 mt-2">{stats.attendanceRate}%</p></CardContent></Card>
            </div>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" />Most Active Students</CardTitle></CardHeader><CardContent>{topStudents.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{topStudents.map((student, index) => <div key={student.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? "bg-yellow-100 text-yellow-700" : index === 1 ? "bg-gray-100 text-gray-700" : index === 2 ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>{index + 1}</div><div><p className="font-medium">{student.name}</p><p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{student.email}</p></div></div><div className="flex items-center gap-3"><div className="text-center"><p className="text-lg font-bold text-blue-600">{student.count}</p><p className="text-xs text-muted-foreground">Registered</p></div><div className="text-center"><p className="text-lg font-bold text-green-600">{student.checkIns}</p><p className="text-xs text-muted-foreground">Attended</p></div><div className="text-center"><p className="text-lg font-bold text-orange-600">{student.attendanceRate}%</p><p className="text-xs text-muted-foreground">Rate</p></div></div></div>)}</div> : <div className="h-[200px] flex items-center justify-center text-muted-foreground">No student data yet</div>}</CardContent></Card>
          </>
        )}

        {activeTab === "engagement" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">Comments</p><p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalComments}</p></CardContent></Card>
              <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">Ratings</p><p className="text-3xl font-bold text-yellow-600 mt-2">{stats.totalRatings}</p></CardContent></Card>
              <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">Avg Rating</p><p className="text-3xl font-bold text-orange-600 mt-2">{feedbackSummary.avgRating}</p></CardContent></Card>
              <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">Engagement</p><p className="text-3xl font-bold text-red-600 mt-2">{stats.engagementScore}</p></CardContent></Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" />Rating Distribution</CardTitle></CardHeader><CardContent>{feedbackSummary.totalReviews > 0 ? <ResponsiveContainer width="100%" height={300}><BarChart data={feedbackSummary.ratingCounts} layout="vertical"><CartesianGrid strokeDasharray="3 3" className="opacity-30" /><XAxis type="number" /><YAxis dataKey="rating" type="category" width={50} /><Tooltip /><Bar dataKey="count" fill="#f59e0b" name="Reviews" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer> : <div className="h-[300px] flex items-center justify-center text-muted-foreground">No ratings yet</div>}</CardContent></Card>
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-500" />Engagement Over Time</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><LineChart data={weeklyData}><CartesianGrid strokeDasharray="3 3" className="opacity-30" /><XAxis dataKey="week" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="registrations" stroke="#3b82f6" strokeWidth={2} name="Registrations" /><Line type="monotone" dataKey="checkIns" stroke="#10b981" strokeWidth={2} name="Check-ins" /></LineChart></ResponsiveContainer></CardContent></Card>
            </div>
          </>
        )}

        {activeTab === "export" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card><CardHeader><CardTitle>Export Data</CardTitle></CardHeader><CardContent className="space-y-4"><div className="p-4 border rounded-lg hover:bg-muted/50 transition-all cursor-pointer" onClick={handleExportJSON}><div className="flex items-center gap-3"><div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><FileText className="w-6 h-6 text-blue-600" /></div><div><p className="font-medium">Export as JSON</p><p className="text-sm text-muted-foreground">Full detailed report</p></div></div></div><div className="p-4 border rounded-lg hover:bg-muted/50 transition-all cursor-pointer" onClick={handleExportCSV}><div className="flex items-center gap-3"><div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><FileSpreadsheet className="w-6 h-6 text-green-600" /></div><div><p className="font-medium">Export as CSV</p><p className="text-sm text-muted-foreground">Spreadsheet format</p></div></div></div></CardContent></Card>
              <Card><CardHeader><CardTitle>Summary Report</CardTitle></CardHeader><CardContent><div className="space-y-3"><div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Time Range</span><span className="font-medium capitalize">{timeRange}</span></div><div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Total Activities</span><span className="font-medium">{stats.total}</span></div><div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Total Registrations</span><span className="font-medium">{stats.totalRegistrations}</span></div><div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Total Check-ins</span><span className="font-medium">{stats.totalCheckIns}</span></div><div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Attendance Rate</span><span className="font-medium">{stats.attendanceRate}%</span></div><div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Capacity Fill Rate</span><span className="font-medium">{stats.fillRate}%</span></div><div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Engagement Score</span><span className="font-medium">{stats.engagementScore}/100</span></div><div className="flex justify-between py-2"><span className="text-muted-foreground">Average Rating</span><span className="font-medium flex items-center gap-1">{feedbackSummary.avgRating}<Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /></span></div></div></CardContent></Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

