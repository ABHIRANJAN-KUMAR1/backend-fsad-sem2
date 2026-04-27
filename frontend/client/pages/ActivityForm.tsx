import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useActivities } from "@/context/ActivityContext";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { Activity, ActivityCategory } from "@/types";
import { getJson } from "@/lib/safeStorage";

export default function ActivityForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { getActivity, addActivity, updateActivity, categories } = useActivities();
  const { user } = useAuth();
  const { addBroadcastNotification } = useNotifications();

  // Get tags from server API
  const [availableTags, setAvailableTags] = useState<{id: string; name: string; color: string}[]>([]);
useEffect(() => {
    const loadTags = async () => {
      try {
        const { tagsApi } = await import("@/lib/api");
        const data = await tagsApi.getAll();
        setAvailableTags(data);
      } catch (e) {
        console.error("Tags load failed:", e);
        setAvailableTags([]); 
      }
    };
    loadTags();
  }, []);

  const isEditing = !!id;
  const activity = id ? getActivity(id) : null;

  if (user?.role !== "admin") {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-lg font-medium text-foreground mb-4">
            Only admins can create or edit activities
          </p>
          <Button onClick={() => navigate("/activities")}>Back to Activities</Button>
        </div>
      </Layout>
    );
  }

  const [formData, setFormData] = useState({
    title: activity?.title || "",
    description: activity?.description || "",
    category: (activity?.category || "Clubs") as ActivityCategory,
    date: activity?.date || "",
    startTime: activity?.startTime || "",
    endTime: activity?.endTime || "",
    venue: activity?.venue || "",
    maxParticipants: activity?.maxParticipants || 50,
    tags: activity?.tags || [] as string[],
  });

  const [venueConflict, setVenueConflict] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const categoryOptions = categories.length > 0 
    ? categories.map(c => c.name as ActivityCategory)
    : ["Clubs", "Sports", "Events", "Workshops", "Seminar", "Cultural"] as ActivityCategory[];
  
  // Ensure we have at least some default options if categories is empty
  const displayCategories = categoryOptions.length > 0 
    ? categoryOptions 
    : ["Clubs", "Sports", "Events", "Workshops", "Seminar", "Cultural"] as ActivityCategory[];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "maxParticipants" ? parseInt(value) || 0 : value,
    }));
    
    // Check for venue conflict when date, venue, startTime, or endTime changes
    if (name === "date" || name === "venue" || name === "startTime" || name === "endTime") {
      checkVenueConflict(
        name === "date" ? value : formData.date,
        name === "venue" ? value : formData.venue,
        name === "startTime" ? value : formData.startTime,
        name === "endTime" ? value : formData.endTime
      );
    }
  };

  // Check for venue conflicts with existing activities
  const checkVenueConflict = (date: string, venue: string, startTime: string, endTime: string) => {
    if (!date || !venue) {
      setVenueConflict(null);
      return;
    }

    const allActivities = getJson<Activity[]>("activities", []);
    const existingOnDate = allActivities.filter(
      (a: Activity) =>
        a.date === date && (a.venue ?? "").toLowerCase() === venue.toLowerCase(),
    );

    if (existingOnDate.length === 0) {
      setVenueConflict(null);
      return;
    }

    // If times are specified, check for overlap
    if (startTime && endTime) {
      for (const existing of existingOnDate) {
        // Skip current editing activity
        if (isEditing && existing.id === activity?.id) continue;

        const existingStart = existing.startTime;
        const existingEnd = existing.endTime;

        if (existingStart && existingEnd) {
          // Check if times overlap
          // Overlap occurs when: (start1 < end2) and (end1 > start2)
          if (startTime < existingEnd && endTime > existingStart) {
            const timeStr = existingStart && existingEnd 
              ? ` "${existing.title}" is scheduled from ${existingStart} to ${existingEnd}` 
              : ` "${existing.title}" is already booked`;
            setVenueConflict(timeStr);
            return;
          }
        }
      }
    }
    
    // If no times specified but activities exist on that date/venue
    const hasUntimedActivity = existingOnDate.some((a: Activity) => !a.startTime && !a.endTime);
    if (hasUntimedActivity) {
      setVenueConflict(` Another activity is already scheduled at this venue on this date`);
      return;
    }

    setVenueConflict(null);
  };

  const handleTagToggle = (tagId: string) => {
    setFormData((prev) => {
      const currentTags = prev.tags || [];
      if (currentTags.includes(tagId)) {
        return { ...prev, tags: currentTags.filter(t => t !== tagId) };
      } else {
        return { ...prev, tags: [...currentTags, tagId] };
      }
    });
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!formData.title || !formData.description || !formData.date || !formData.venue || formData.maxParticipants < 1) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (venueConflict) {
      toast.error("Please resolve the venue conflict before saving");
      return;
    }

    setIsLoading(true);
    
    try {
      if (isEditing && activity) {
        await updateActivity(activity.id, formData);
        toast.success("Activity updated successfully!");
      } else {
        const newActivity: Activity = {
          id: `activity_${Date.now()}`,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          venue: formData.venue,
          maxParticipants: formData.maxParticipants,
          tags: formData.tags,
          currentParticipants: [],
          waitlist: [],
          comments: [],
          ratings: [],
          createdBy: user?.id || "admin",
          createdAt: new Date().toISOString(),
        };
        await addActivity(newActivity);
        addBroadcastNotification(
          "New Activity Available!",
          `A new activity "${formData.title}" has been created. Check it out!`,
          "info"
        );
        toast.success("Activity created successfully!");
      }

      // Navigate back to activities list so user sees the new activity
      setTimeout(() => {
        navigate("/activities");
      }, 200);
    } catch (error) {
      toast.error("Failed to save activity");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/activities")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Activities
        </Button>

        <div className="bg-card border border-border rounded-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              {isEditing ? "Edit Activity" : "Create New Activity"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isEditing ? "Update the activity details below" : "Fill in the details to create a new activity"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Activity Title <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Basketball Tournament 2024"
                className="h-11"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Category <span className="text-red-500">*</span>
              </label>
<select
                name="category"
                aria-label="Select activity category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 h-11"
              >
                {displayCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Tags Selection */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Tags <span className="text-muted-foreground">(Optional)</span>
              </label>
              {availableTags.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-3 border border-border rounded-lg bg-muted/30">
                  {availableTags.map((tag) => {
                    const isSelected = formData.tags?.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagToggle(tag.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          isSelected ? "ring-2 ring-offset-1" : "opacity-60 hover:opacity-100"
                        }`}
                        style={{ 
                          backgroundColor: tag.color,
                          color: "white",
                        }}
                      >
                        {tag.name}
                        {isSelected && <X className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 border border-dashed border-border rounded-lg text-center">
                  <Tag className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No tags available.{" "}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-blue-500"
                      onClick={() => navigate("/tags")}
                    >
                      Create tags here
                    </Button>
                  </p>
                </div>
              )}
              {formData.tags && formData.tags.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {formData.tags.length} tag(s) selected
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Description <span className="text-red-500">*</span>
              </label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the activity..."
                rows={5}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Event Date <span className="text-red-500">*</span>
                </label>
                <Input type="date" name="date" value={formData.date} onChange={handleChange} className="h-11" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Venue <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  placeholder="e.g., Sports Complex"
                  className="h-11"
                />
              </div>
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Start Time <span className="text-muted-foreground">(Optional)</span>
                </label>
                <Input 
                  type="time" 
                  name="startTime" 
                  value={formData.startTime} 
                  onChange={handleChange} 
                  className="h-11" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  End Time <span className="text-muted-foreground">(Optional)</span>
                </label>
                <Input 
                  type="time" 
                  name="endTime" 
                  value={formData.endTime} 
                  onChange={handleChange} 
                  className="h-11" 
                />
              </div>
            </div>

            {/* Venue Conflict Warning */}
            {venueConflict && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  ⚠️ Venue Conflict: {venueConflict}
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Max Participants <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleChange}
                min="1"
                max="10000"
                className="h-11"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button type="submit" disabled={isLoading} className="flex-1 h-12 text-base">
                {isLoading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Activity" : "Create Activity")}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/activities")} className="h-12 px-6">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

