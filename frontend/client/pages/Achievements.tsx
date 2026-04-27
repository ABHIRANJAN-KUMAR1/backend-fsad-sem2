import { Layout } from "@/components/Layout";
import { useAchievements } from "@/context/AchievementContext";
import { useActivities } from "@/context/ActivityContext";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Star, Target, Award, Lock } from "lucide-react";

export default function Achievements() {
  const { user } = useAuth();
  const { achievements, earnedAchievements, getAchievementProgress } = useAchievements();
  const { activities } = useActivities();

  if (!user) return null;

  // Get user's activities
  const userActivities = activities.filter(a => a.currentParticipants.includes(user.id));
  const userCategories = [...new Set(userActivities.map(a => a.category))];
  
  // Get user's comments count (approximation)
  const userComments = activities.reduce((count, a) => 
    count + a.comments.filter(c => c.userId === user.id).length, 0
  );

  const earned = earnedAchievements(user.id);
  const earnedTypes = earned.map(e => e.type);
  const progress = getAchievementProgress(user.id, userActivities.length);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Achievements
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your progress and earn badges by participating in activities
          </p>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground">Achievements Earned</span>
                <span className="font-bold text-foreground">{progress.achieved} / {progress.total}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-yellow-500 h-3 rounded-full transition-all"
                  style={{ width: `${(progress.achieved / progress.total) * 100}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center pt-4">
                <div>
                  <p className="text-2xl font-bold text-foreground">{userActivities.length}</p>
                  <p className="text-sm text-muted-foreground">Activities</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{userCategories.length}</p>
                  <p className="text-sm text-muted-foreground">Categories</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{userComments}</p>
                  <p className="text-sm text-muted-foreground">Comments</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earned Achievements */}
        {earned.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Earned Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {earned.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex flex-col items-center p-4 bg-muted/30 rounded-lg text-center"
                  >
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-2"
                      style={{ backgroundColor: `${achievement.color}20` }}
                    >
                      {achievement.icon}
                    </div>
                    <h3 className="font-semibold text-foreground text-sm">{achievement.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                    {achievement.earnedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Earned {new Date(achievement.earnedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              All Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {achievements.map((achievement) => {
                const isEarned = earnedTypes.includes(achievement.type);
                
                return (
                  <div
                    key={achievement.id}
                    className={`flex flex-col items-center p-4 rounded-lg text-center ${
                      isEarned 
                        ? "bg-muted/30" 
                        : "bg-muted/10 opacity-60"
                    }`}
                  >
                    <div 
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-2 ${
                        isEarned ? "" : "grayscale"
                      }`}
                      style={{ 
                        backgroundColor: isEarned ? `${achievement.color}20` : '#f3f4f6' 
                      }}
                    >
                      {achievement.icon}
                    </div>
                    <h3 className={`font-semibold text-sm ${isEarned ? "text-foreground" : "text-muted-foreground"}`}>
                      {achievement.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {achievement.description}
                    </p>
                    {!isEarned && (
                      <Lock className="w-4 h-4 text-muted-foreground mt-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

