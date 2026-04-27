import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useActivities } from "@/context/ActivityContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Users, Star, Clock, MessageSquare, Download, Heart, ClipboardList, Share2, CalendarPlus, Award } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Rating } from "@/components/Rating";
import { exportActivityToPDF } from "@/lib/pdfExport";
import { downloadICalEvent, generateGoogleCalendarUrl, generateOutlookCalendarUrl, copyActivityLink } from "@/lib/calendarExport";
import { generateCertificatePDF } from "@/lib/certificate";
import { PhotoGallery } from "@/components/PhotoGallery";
import { ActivityPhoto } from "@/types";

export default function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getActivity, registerForActivity, unregisterFromActivity, joinWaitlist, leaveWaitlist, addRating, addComment, addFavorite, removeFavorite, isFavorite, updateActivity } = useActivities();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [selectedRating, setSelectedRating] = useState(0);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const activity = id ? getActivity(id) : null;
  const isUserFavorite = user && activity ? isFavorite(user.id, activity.id) : false;

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

  const isRegistered = user ? activity.currentParticipants.includes(user.id) : false;
  const isOnWaitlist = user ? activity.waitlist.includes(user.id) : false;
  const capacityPercentage = (activity.currentParticipants.length / activity.maxParticipants) * 100;
  const spotsAvailable = activity.maxParticipants - activity.currentParticipants.length;
  const isUpcoming = new Date(activity.date) > new Date();
  const isFull = spotsAvailable <= 0;
  
  const userRating = user ? activity.ratings.find(r => r.userId === user.id) : null;
  const canRate = !isUpcoming && (isRegistered || isOnWaitlist) && !userRating;

  const averageRating = activity.ratings.length > 0
    ? (activity.ratings.reduce((sum, r) => sum + r.score, 0) / activity.ratings.length).toFixed(1)
    : null;

  const handleRegister = () => {
    if (user) {
      if (spotsAvailable <= 0) {
        toast.error("This activity is full");
        return;
      }
      registerForActivity(user.id, activity.id);
      toast.success("Successfully registered for the activity!");
    }
  };

  const handleUnregister = () => {
    if (user) {
      unregisterFromActivity(user.id, activity.id);
      toast.success("Unregistered from the activity");
    }
  };

  const handleJoinWaitlist = () => {
    if (user) {
      joinWaitlist(user.id, activity.id);
      toast.success("Added to waitlist!");
    }
  };

  const handleLeaveWaitlist = () => {
    if (user) {
      leaveWaitlist(user.id, activity.id);
      toast.success("Removed from waitlist");
    }
  };

  const handleSubmitRating = (rating: number) => {
    if (user) {
      addRating(activity.id, {
        id: `rating_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        score: rating,
        review: "",
        createdAt: new Date().toISOString()
      });
      setSelectedRating(rating);
      toast.success("Thank you for your rating!");
    }
  };

  const handleSubmitComment = () => {
    if (user && commentText.trim()) {
      addComment(activity.id, {
        id: `comment_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        content: commentText.trim(),
        createdAt: new Date().toISOString()
      });
      setCommentText("");
      toast.success("Comment added!");
    }
  };

  const handleToggleFavorite = () => {
    if (user && activity) {
      if (isUserFavorite) {
        removeFavorite(user.id, activity.id);
        toast.success("Removed from favorites");
      } else {
        addFavorite(user.id, activity.id);
        toast.success("Added to favorites!");
      }
    }
  };

  const handleExportPDF = () => {
    if (activity) {
      exportActivityToPDF(activity);
      toast.success("PDF exported successfully!");
    }
  };

  // Calendar export handlers
  const handleAddToICal = () => {
    if (activity) {
      downloadICalEvent(activity);
      toast.success("Added to calendar!");
      setShowCalendarMenu(false);
    }
  };

  const handleAddToGoogleCalendar = () => {
    if (activity) {
      const url = generateGoogleCalendarUrl(activity);
      window.open(url, "_blank");
      setShowCalendarMenu(false);
    }
  };

  const handleAddToOutlook = () => {
    if (activity) {
      const url = generateOutlookCalendarUrl(activity);
      window.open(url, "_blank");
      setShowCalendarMenu(false);
    }
  };

  // Share handlers
  const handleShareLink = async () => {
    if (activity) {
      const success = await copyActivityLink(activity.id);
      if (success) {
        toast.success("Link copied to clipboard!");
      } else {
        toast.error("Failed to copy link");
      }
      setShowShareMenu(false);
    }
  };

  // Certificate handler
  const handleDownloadCertificate = () => {
    if (activity && user) {
      generateCertificatePDF(activity, user.name);
      toast.success("Certificate downloaded!");
    }
  };

  // Photo handlers
  const handleAddPhoto = (url: string, caption?: string) => {
    if (activity && user) {
      const newPhoto: ActivityPhoto = {
        id: `photo_${Date.now()}`,
        activityId: activity.id,
        url,
        caption,
        uploadedBy: user.id,
        uploadedAt: new Date().toISOString()
      };
      const currentPhotos = activity.photos || [];
      updateActivity(activity.id, { photos: [...currentPhotos, newPhoto] });
      toast.success("Photo added!");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/activities")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Activities
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {activity.title}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{activity.category}</Badge>
                    {isUpcoming && <Badge className="bg-green-500">Upcoming</Badge>}
                    {!isUpcoming && <Badge className="bg-gray-500">Completed</Badge>}
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground text-lg mb-6">
                {activity.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium text-foreground">
                      {formatDate(new Date(activity.date))}
                    </p>
                  </div>
                </div>

                {/* Time Display */}
                {(activity.startTime || activity.endTime) && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="font-medium text-foreground">
                        {activity.startTime && activity.endTime 
                          ? `${activity.startTime} - ${activity.endTime}`
                          : activity.startTime 
                            ? `${activity.startTime}`
                            : `${activity.endTime}`
                        }
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Venue</p>
                    <p className="font-medium text-foreground">{activity.venue}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Participants</p>
                    <p className="font-medium text-foreground">
                      {activity.currentParticipants.length} / {activity.maxParticipants}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Capacity</h2>
              <div className="space-y-3">
                <Progress value={capacityPercentage} className="h-3" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {activity.currentParticipants.length} of {activity.maxParticipants} spots filled
                  </span>
                  <span className={`font-medium ${spotsAvailable > 0 ? "text-green-600" : "text-red-600"}`}>
                    {spotsAvailable > 0 ? `${spotsAvailable} spots available` : "Activity full"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">About This Activity</h2>
              <p className="text-muted-foreground leading-relaxed">
                {activity.description}
              </p>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Category:</span> {activity.category}
                </p>
              </div>
            </div>

            {/* Photo Gallery Section */}
            <div className="bg-card border border-border rounded-lg p-6">
              <PhotoGallery 
                photos={activity.photos || []} 
                onAddPhoto={user?.role === "admin" ? handleAddPhoto : undefined}
                isAdmin={user?.role === "admin"}
              />
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Star className="w-5 h-5" />
                Ratings & Reviews
              </h2>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl font-bold text-foreground">
                  {averageRating || "N/A"}
                </div>
                <div>
                  <Rating rating={Math.round(Number(averageRating) || 0)} readonly size="lg" />
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on {activity.ratings.length} {activity.ratings.length === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </div>

              {canRate && (
                <div className="border-t border-border pt-4 mb-4">
                  <p className="text-sm font-medium text-foreground mb-2">Rate this activity</p>
                  <Rating rating={selectedRating} onRate={handleSubmitRating} size="lg" />
                </div>
              )}

              <div className="border-t border-border pt-4">
                <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Comments ({activity.comments.length})
                </h3>
                
                {user && (
                  <div className="mb-4">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full p-3 border border-border rounded-lg bg-background text-foreground resize-none"
                      rows={3}
                    />
                    <Button 
                      onClick={handleSubmitComment} 
                      className="mt-2"
                      disabled={!commentText.trim()}
                    >
                      Add Comment
                    </Button>
                  </div>
                )}

                <div className="space-y-3">
                  {activity.comments.length > 0 ? (
                    activity.comments.map((comment) => (
                      <div key={comment.id} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-foreground">{comment.userName}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No comments yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-6 space-y-4">
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-2">Registration Status</p>
                {isRegistered ? (
                  <Badge className="bg-green-500">✓ Registered</Badge>
                ) : (
                  <Badge variant="outline">Not Registered</Badge>
                )}
              </div>

              {user?.role === "student" && (
                <>
                  {isRegistered ? (
                    <Button
                      onClick={handleUnregister}
                      variant="destructive"
                      className="w-full"
                    >
                      Unregister
                    </Button>
                  ) : isFull ? (
                    <>
                      {isOnWaitlist ? (
                        <Button
                          onClick={handleLeaveWaitlist}
                          variant="outline"
                          className="w-full"
                        >
                          Leave Waitlist
                        </Button>
                      ) : (
                        <Button
                          onClick={handleJoinWaitlist}
                          className="w-full bg-orange-500 hover:bg-orange-600"
                        >
                          Join Waitlist
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      onClick={handleRegister}
                      className="w-full"
                    >
                      Register Now
                    </Button>
                  )}
                  
                  {!isUpcoming && isRegistered && (
                    <Button
                      onClick={() => navigate(`/feedback/${activity.id}`)}
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <ClipboardList className="w-4 h-4" />
                      Give Feedback
                    </Button>
                  )}
                </>
              )}

              {user?.role === "admin" && (
                <>
                  <Button
                    onClick={() => navigate(`/activities/${activity.id}/edit`)}
                    className="w-full"
                  >
                    Edit Activity
                  </Button>
                  <Button
                    onClick={handleExportPDF}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </Button>
                  
                  {/* Calendar Integration */}
                  <div className="relative">
                    <Button
                      onClick={() => setShowCalendarMenu(!showCalendarMenu)}
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <CalendarPlus className="w-4 h-4" />
                      Add to Calendar
                    </Button>
                    {showCalendarMenu && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-10">
                        <button
                          onClick={handleAddToICal}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-muted rounded-t-md"
                        >
                          📅 iCal / Apple Calendar
                        </button>
                        <button
                          onClick={handleAddToGoogleCalendar}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
                        >
                          🔵 Google Calendar
                        </button>
                        <button
                          onClick={handleAddToOutlook}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-muted rounded-b-md"
                        >
                          🟠 Outlook
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Share Button */}
                  <div className="relative">
                    <Button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                    {showShareMenu && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-10">
                        <button
                          onClick={handleShareLink}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-muted rounded-md"
                        >
                          🔗 Copy Link
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {user?.role === "student" && (
                <>
                  <Button
                    onClick={handleToggleFavorite}
                    variant={isUserFavorite ? "default" : "outline"}
                    className={`w-full gap-2 ${isUserFavorite ? "bg-red-500 hover:bg-red-600" : ""}`}
                  >
                    <Heart className={`w-4 h-4 ${isUserFavorite ? "fill-current" : ""}`} />
                    {isUserFavorite ? "Remove from Favorites" : "Add to Favorites"}
                  </Button>
                  
                  {/* Calendar Integration for Students */}
                  <div className="relative">
                    <Button
                      onClick={() => setShowCalendarMenu(!showCalendarMenu)}
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <CalendarPlus className="w-4 h-4" />
                      Add to Calendar
                    </Button>
                    {showCalendarMenu && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-10">
                        <button
                          onClick={handleAddToICal}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-muted rounded-t-md"
                        >
                          📅 iCal / Apple Calendar
                        </button>
                        <button
                          onClick={handleAddToGoogleCalendar}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
                        >
                          🔵 Google Calendar
                        </button>
                        <button
                          onClick={handleAddToOutlook}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-muted rounded-b-md"
                        >
                          🟠 Outlook
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Share Button for Students */}
                  <div className="relative">
                    <Button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                    {showShareMenu && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-10">
                        <button
                          onClick={handleShareLink}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-muted rounded-md"
                        >
                          🔗 Copy Link
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Certificate Button - only for completed activities where user was registered */}
                  {!isUpcoming && isRegistered && (
                    <Button
                      onClick={handleDownloadCertificate}
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <Award className="w-4 h-4" />
                      Download Certificate
                    </Button>
                  )}
                </>
              )}

              <div className="pt-4 border-t border-border space-y-3">
                <h3 className="font-semibold text-foreground text-sm">Activity Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium">
                      {isUpcoming ? "Upcoming" : "Completed"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Spots Left</span>
                    <span className="font-medium">{spotsAvailable}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Occupancy</span>
                    <span className="font-medium">{Math.round(capacityPercentage)}%</span>
                  </div>
                  {activity.waitlist.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Waitlist
                      </span>
                      <span className="font-medium">{activity.waitlist.length}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
