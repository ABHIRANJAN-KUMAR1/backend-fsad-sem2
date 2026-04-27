import { Layout } from "@/components/Layout";
import { ActivityCard } from "@/components/ActivityCard";
import { useActivities } from "@/context/ActivityContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Heart, Search, Filter, Download } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportActivitiesListToPDF } from "@/lib/pdfExport";

export default function Favorites() {
  const { user } = useAuth();
  const { getFavoriteActivities, registerForActivity, unregisterFromActivity, joinWaitlist, leaveWaitlist, categories } = useActivities();
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-lg font-medium text-foreground mb-4">
            Please login to view your favorites
          </p>
        </div>
      </Layout>
    );
  }

  const favoriteActivities = getFavoriteActivities(user.id);
  
  // Filter by category
  const filteredActivities = categoryFilter === "All" 
    ? favoriteActivities 
    : favoriteActivities.filter(a => a.category === categoryFilter);

  const handleRegister = (activityId: string) => {
    registerForActivity(user.id, activityId);
    toast.success("Successfully registered for the activity!");
  };

  const handleUnregister = (activityId: string) => {
    unregisterFromActivity(user.id, activityId);
    toast.success("Unregistered from the activity");
  };

  const handleJoinWaitlist = (activityId: string) => {
    joinWaitlist(user.id, activityId);
    toast.success("Added to waitlist!");
  };

  const handleLeaveWaitlist = (activityId: string) => {
    leaveWaitlist(user.id, activityId);
    toast.success("Removed from waitlist");
  };

  const handleExportPDF = () => {
    exportActivitiesListToPDF(filteredActivities);
    toast.success("Favorites exported to PDF!");
  };

  // Get unique categories from favorites
  const favoriteCategories = [...new Set(favoriteActivities.map(a => a.category))];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Heart className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Favorites</h1>
              <p className="text-muted-foreground mt-1">
                Your saved activities ({favoriteActivities.length} total)
              </p>
            </div>
          </div>
          {favoriteActivities.length > 0 && (
            <Button variant="outline" onClick={handleExportPDF} className="gap-2">
              <Download className="w-4 h-4" />
              Export to PDF
            </Button>
          )}
        </div>

        {/* Filters */}
        {favoriteActivities.length > 0 && (
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {favoriteCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredActivities.length} of {favoriteActivities.length} favorite activities
        </p>

        {/* Favorites Grid */}
        {filteredActivities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActivities.map((activity) => {
              const isRegistered = activity.currentParticipants.includes(user.id);
              const isOnWaitlist = activity.waitlist.includes(user.id);

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
                  isAdmin={false}
                  showFavoriteButton={true}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[400px] bg-muted/30 rounded-lg">
            <div className="text-center">
              <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium text-foreground mb-2">
                {favoriteActivities.length === 0 
                  ? "No favorites yet" 
                  : "No favorites in this category"}
              </p>
              <p className="text-muted-foreground mb-4">
                {favoriteActivities.length === 0
                  ? "Browse activities and click the heart icon to add favorites"
                  : "Try selecting a different category"}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

