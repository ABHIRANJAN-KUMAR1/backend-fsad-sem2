import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useActivities } from "@/context/ActivityContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Star, Send, ThumbsUp, ClipboardList, FileText } from "lucide-react";
import { toast } from "sonner";

export default function Feedback() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getActivity, updateActivity } = useActivities();
  const { user } = useAuth();

  const activity = id ? getActivity(id) : null;

  const [overallRating, setOverallRating] = useState(0);
  const [organizationRating, setOrganizationRating] = useState(0);
  const [contentRating, setContentRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!activity) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-lg font-medium text-foreground mb-4">Activity not found</p>
          <Button onClick={() => navigate("/activities")}>Back to Activities</Button>
        </div>
      </Layout>
    );
  }

  const existingFeedback = activity.feedbacks?.find(f => f.userId === user?.id);

  const handleSubmit = () => {
    if (!user || !activity) return;

    if (overallRating === 0 || organizationRating === 0 || contentRating === 0) {
      toast.error("Please provide all ratings");
      return;
    }

    setIsSubmitting(true);

    const newFeedback = {
      id: `feedback_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      activityId: activity.id,
      overallRating,
      organizationRating,
      contentRating,
      comment: comment.trim(),
      createdAt: new Date().toISOString()
    };

    updateActivity(activity.id, {
      feedbacks: [...(activity.feedbacks || []), newFeedback]
    });

    toast.success("Thank you for your feedback!");
    setIsSubmitting(false);
    navigate(`/activities/${id}`);
  };

  const RatingStars = ({ 
    rating, 
    onRate, 
    label, 
    icon: Icon 
  }: { 
    rating: number; 
    onRate: (rating: number) => void;
    label: string;
    icon: React.ElementType;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRate(star)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star className={`w-6 h-6 ${
                star <= rating 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "text-gray-300 dark:text-gray-600"
              }`}
            />
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {rating > 0 ? `${rating}/5` : "Click to rate"}
      </p>
    </div>
  );

  if (existingFeedback) {
    return (
      <Layout>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => navigate(`/activities/${id}`)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Activity
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Your Feedback Submitted</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <ThumbsUp className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm text-muted-foreground">Overall</p>
                  <p className="text-2xl font-bold">{existingFeedback.overallRating}/5</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <ClipboardList className="w-6 h-6 mx-auto mb-2 text-green-500" />
                  <p className="text-sm text-muted-foreground">Organization</p>
                  <p className="text-2xl font-bold">{existingFeedback.organizationRating}/5</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <FileText className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                  <p className="text-sm text-muted-foreground">Content</p>
                  <p className="text-2xl font-bold">{existingFeedback.contentRating}/5</p>
                </div>
              </div>
              {existingFeedback.comment && (
                <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium mb-2">Your Comment:</p>
                  <p className="text-muted-foreground">{existingFeedback.comment}</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground text-center">
                Submitted on {new Date(existingFeedback.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(`/activities/${id}`)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Activity
        </Button>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Feedback for {activity.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-muted-foreground">
                Please rate your experience at this activity
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <RatingStars rating={overallRating} onRate={setOverallRating} label="Overall Experience" icon={ThumbsUp} />
                <RatingStars rating={organizationRating} onRate={setOrganizationRating} label="Organization" icon={ClipboardList} />
                <RatingStars rating={contentRating} onRate={setContentRating} label="Content Quality" icon={FileText} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Additional Comments (Optional)</label>
                <Textarea placeholder="Share your thoughts about the activity..." value={comment} onChange={(e) => setComment(e.target.value)} rows={4} />
              </div>

              <Button onClick={handleSubmit} disabled={isSubmitting || overallRating === 0 || organizationRating === 0 || contentRating === 0} className="w-full">
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

