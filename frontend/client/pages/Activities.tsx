import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ActivityCard } from "@/components/ActivityCard";
import { RecommendedActivities } from "@/components/RecommendedActivities";
import { useActivities } from "@/context/ActivityContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Download } from "lucide-react";
import { toast } from "sonner";
import { ActivityCategory } from "@/types";
import { exportActivitiesListToPDF } from "@/lib/pdfExport";
import { isValid, parseISO } from "date-fns";

export default function Activities() {
  const navigate = useNavigate();
  const { activities, registerForActivity, unregisterFromActivity, deleteActivity, joinWaitlist, leaveWaitlist, categories, addFavorite, removeFavorite, isFavorite } = useActivities();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | "All">("All");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [venueFilter, setVenueFilter] = useState<string>("all");

  const isAdmin = user?.role === "admin";

  // Get unique venues for filter
  const uniqueVenues = [...new Set(activities.map((a) => a.venue).filter(Boolean))] as string[];

  // Filter activities
  const filtered = activities.filter((activity) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (activity.title ?? "").toLowerCase().includes(q) ||
      (activity.description ?? "").toLowerCase().includes(q) ||
      (activity.venue ?? "").toLowerCase().includes(q);

    const matchesCategory = selectedCategory === "All" || activity.category === selectedCategory;

    const activityDate = parseISO(activity.date ?? "");
    const hasValidDate = isValid(activityDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let matchesDate = true;
    if (dateFilter === "upcoming") {
      matchesDate = hasValidDate && activityDate > today;
    } else if (dateFilter === "past") {
      matchesDate = hasValidDate && activityDate < today;
    } else if (dateFilter === "today") {
      matchesDate = hasValidDate && activityDate.toDateString() === today.toDateString();
    }

    const matchesVenue = venueFilter === "all" || (activity.venue ?? "") === venueFilter;
    
    return matchesSearch && matchesCategory && matchesDate && matchesVenue;
  });

  const handleRegister = (activityId: string) => {
    if (user) {
      registerForActivity(user.id, activityId);
      toast.success("Successfully registered for the activity!");
    }
  };

  const handleUnregister = (activityId: string) => {
    if (user) {
      unregisterFromActivity(user.id, activityId);
      toast.success("Unregistered from the activity");
    }
  };

  const handleJoinWaitlist = (activityId: string) => {
    if (user) {
      joinWaitlist(user.id, activityId);
      toast.success("Added to waitlist! We'll notify you if a spot opens up.");
    }
  };

  const handleLeaveWaitlist = (activityId: string) => {
    if (user) {
      leaveWaitlist(user.id, activityId);
      toast.success("Removed from waitlist");
    }
  };

  const handleToggleFavorite = (activityId: string) => {
    if (user) {
      if (isFavorite(user.id, activityId)) {
        removeFavorite(user.id, activityId);
        toast.success("Removed from favorites");
      } else {
        addFavorite(user.id, activityId);
        toast.success("Added to favorites!");
      }
    }
  };

  const handleDelete = (activityId: string) => {
    deleteActivity(activityId);
    toast.success("Activity deleted successfully");
  };

  const handleEdit = (activityId: string) => {
    navigate(`/activities/${activityId}/edit`);
  };

  // Get all category names from context
  const allCategories = ["All", ...categories.map(c => c.name), "Clubs", "Sports", "Events", "Workshops", "Seminar", "Cultural"];
  const uniqueCategories = [...new Set(allCategories)];

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Title", "Category", "Date", "Venue", "Participants", "Max Participants"];
    const rows = filtered.map((a) => [
      a.title ?? "",
      a.category ?? "",
      a.date ?? "",
      a.venue ?? "",
      (a.currentParticipants ?? []).length,
      a.maxParticipants ?? 0,
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "activities.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Activities exported to CSV!");
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isAdmin ? "Activity Management" : "Browse Activities"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin ? "Manage all activities and registrations" : "Find and join exciting activities"}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => navigate("/activities/new")} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Activity
            </Button>
          )}
        </div>

        {/* Recommendations for Students */}
        {!isAdmin && (
          <div className="bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-xl p-4 border">
            <RecommendedActivities showTitle={true} maxItems={6} />
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          
          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as ActivityCategory | "All")}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {uniqueCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Date Filter */}
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
              <SelectItem value="today">Today</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Venue Filter */}
          <Select value={venueFilter} onValueChange={setVenueFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Venue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Venues</SelectItem>
              {uniqueVenues.map((venue) => (
                <SelectItem key={venue} value={venue}>{venue}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Export Button */}
          <Button variant="outline" onClick={exportToCSV} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length} of {activities.length} activities
        </p>

        {/* Activities Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((activity) => {
              const isRegistered = user ? (activity.currentParticipants ?? []).includes(user.id) : false;
              const isOnWaitlist = user ? (activity.waitlist ?? []).includes(user.id) : false;

              return (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  isRegistered={isRegistered}
                  isOnWaitlist={isOnWaitlist}
                  onRegister={() => handleRegister(activity.id)}
                  onUnregister={() => handleUnregister(activity.id)}
                  onJoinWaitlist={() => handleJoinWaitlist(activity.id)}
                  onLeaveWaitlist={() => handleLeaveWaitlist(activity.id)}
                  onEdit={() => handleEdit(activity.id)}
                  onDelete={() => handleDelete(activity.id)}
                  onToggleFavorite={() => handleToggleFavorite(activity.id)}
                  isAdmin={isAdmin}
                  isFavorite={user ? isFavorite(user.id, activity.id) : false}
                  showFavoriteButton={!isAdmin}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[400px] bg-muted/30 rounded-lg">
            <div className="text-center">
              <p className="text-lg font-medium text-foreground mb-2">
                No activities found
              </p>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory !== "All" || dateFilter !== "all" || venueFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "No activities available yet"}
              </p>
              {isAdmin && (
                <Button onClick={() => navigate("/activities/new")}>
                  Create the first activity
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
