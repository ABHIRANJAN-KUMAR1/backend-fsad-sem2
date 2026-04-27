import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useActivities } from "@/context/ActivityContext";
import { 
  getRecommendations, 
  getSimilarUserRecommendations, 
  getCategorySuggestions,
  updatePreferencesFromActivity 
} from "@/lib/recommendations";
import { RecommendedActivity } from "@/types";
import { ActivityCard } from "./ActivityCard";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  TrendingUp, 
  RefreshCw, 
  Lightbulb,
  Users,
  Star
} from "lucide-react";

interface RecommendedActivitiesProps {
  showTitle?: boolean;
  maxItems?: number;
  compact?: boolean;
}

export function RecommendedActivities({ 
  showTitle = true, 
  maxItems = 6,
  compact = false 
}: RecommendedActivitiesProps) {
  const { user } = useAuth();
  const { activities, registerForActivity } = useActivities();
  const [recommendations, setRecommendations] = useState<RecommendedActivity[]>([]);
  const [similarActivities, setSimilarActivities] = useState<RecommendedActivity[]>([]);
  const [categoryRecs, setCategoryRecs] = useState<Record<string, RecommendedActivity[]>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"recommended" | "popular" | "similar">("recommended");

  useEffect(() => {
    if (!user || user.role !== "student") {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Get main recommendations
    const recs = getRecommendations(user.id, activities, maxItems);
    setRecommendations(recs);

    // Get similar user activities
    const similar = getSimilarUserRecommendations(user.id, activities, 4);
    setSimilarActivities(similar);

    // Get category-based suggestions
    const categories = [...new Set(activities.map((a) => a.category).filter(Boolean))] as string[];
    const categoryData: Record<string, RecommendedActivity[]> = {};
    categories.forEach(cat => {
      categoryData[cat] = getCategorySuggestions(user.id, activities, cat);
    });
    setCategoryRecs(categoryData);

    setLoading(false);
  }, [user, activities, maxItems]);

  const handleRefresh = () => {
    if (!user) return;
    setLoading(true);
    
    const recs = getRecommendations(user.id, activities, maxItems);
    setRecommendations(recs);
    
    const similar = getSimilarUserRecommendations(user.id, activities, 4);
    setSimilarActivities(similar);
    
    setLoading(false);
  };

  // Update preferences when user registers/rates
  const handleRegister = async (activityId: string) => {
    if (!user) return;
    
    const activity = activities.find(a => a.id === activityId);
    if (activity) {
      await registerForActivity(user.id, activityId);
      // Update preferences based on registration
      updatePreferencesFromActivity(user.id, activity);
      
      // Refresh recommendations
      const recs = getRecommendations(user.id, activities, maxItems);
      setRecommendations(recs);
    }
  };

  if (!user || user.role !== "student") {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {showTitle && (
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-semibold">Recommended for You</h2>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-muted h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const renderRecommendationCard = (rec: RecommendedActivity) => {
    const act = rec?.activity;
    if (!act?.id) return null;
    const reasons = rec.reasons ?? [];
    return (
      <div key={act.id} className="relative">
        <ActivityCard activity={act} onRegister={() => handleRegister(act.id)} />
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-purple-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {(rec.score ?? 0)}% Match
          </div>
        </div>
        {reasons.length > 0 && reasons[0]?.message && (
          <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-950/20 rounded-md">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-purple-700 dark:text-purple-300">{reasons[0].message}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="font-medium text-sm">Recommended</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
        <div className="space-y-2">
          {recommendations.slice(0, 3).map((rec) => {
            const act = rec?.activity;
            if (!act?.id) return null;
            return (
            <div key={act.id} className="p-2 border rounded-md hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{act.title ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {act.category ?? "—"} • {act.date ?? "—"}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-1.5 py-0.5 rounded">
                    {rec.score}%
                  </span>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-semibold">Recommended for You</h2>
            <span className="text-sm text-muted-foreground">
              Based on your activity
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      )}

      {/* View Toggle Buttons */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === "recommended" ? "default" : "outline"}
          size="sm"
          className="gap-1"
          onClick={() => setViewMode("recommended")}
        >
          <Sparkles className="w-4 h-4" />
          For You
        </Button>
        <Button
          variant={viewMode === "popular" ? "default" : "outline"}
          size="sm"
          className="gap-1"
          onClick={() => setViewMode("popular")}
        >
          <TrendingUp className="w-4 h-4" />
          Popular
        </Button>
        <Button
          variant={viewMode === "similar" ? "default" : "outline"}
          size="sm"
          className="gap-1"
          onClick={() => setViewMode("similar")}
        >
          <Users className="w-4 h-4" />
          Students Like You
        </Button>
      </div>

      {/* Recommended View */}
      {viewMode === "recommended" && (
        <div className="space-y-4">
          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map(renderRecommendationCard)}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Join some activities to get personalized recommendations!</p>
            </div>
          )}
        </div>
      )}

      {/* Popular View */}
      {viewMode === "popular" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...activities]
              .filter((a) => a?.id && !(a.currentParticipants ?? []).includes(user.id))
              .sort(
                (a, b) =>
                  (b.currentParticipants ?? []).length - (a.currentParticipants ?? []).length,
              )
              .slice(0, maxItems)
              .map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onRegister={() => handleRegister(activity.id)}
                />
              ))}
          </div>
        </div>
      )}

      {/* Similar View */}
      {viewMode === "similar" && (
        <div className="space-y-4">
          {similarActivities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {similarActivities.map(renderRecommendationCard)}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Join more activities to see what students like you are participating in!</p>
            </div>
          )}
        </div>
      )}

      {/* Category Quick Access */}
      {Object.keys(categoryRecs).length > 0 && (
        <div className="border-t pt-6">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            Browse by Category
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.keys(categoryRecs).slice(0, 6).map(cat => (
              <Button
                key={cat}
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => {
                  // Could navigate to filtered view
                }}
              >
                {cat}
                <span className="ml-1 text-xs text-muted-foreground">
                  ({categoryRecs[cat].length})
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Mini widget for sidebar or header
export function RecommendationWidget() {
  const { user } = useAuth();
  const { activities } = useActivities();
  const [topRec, setTopRec] = useState<RecommendedActivity | null>(null);

  useEffect(() => {
    if (!user || user.role !== "student") return;
    
    const recs = getRecommendations(user.id, activities, 1);
    if (recs.length > 0) {
      setTopRec(recs[0]);
    }
  }, [user, activities]);

  if (!user || user.role !== "student" || !topRec) return null;

  return (
    <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-purple-500" />
        <span className="text-sm font-medium">Top Pick for You</span>
      </div>
      <p className="text-sm font-medium truncate">{topRec.activity?.title ?? "—"}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {topRec.activity?.category ?? "—"} • {topRec.activity?.date ?? "—"}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
          {topRec.score}% Match
        </span>
      </div>
    </div>
  );
}

export default RecommendedActivities;

