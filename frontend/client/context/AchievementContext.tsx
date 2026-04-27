import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Achievement, BadgeType, UserAchievement } from "@/types";
import { capArrayTail, getJson, setJson, MAX_STORED_USER_ACHIEVEMENTS } from "@/lib/safeStorage";

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

// All available achievements
const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_activity",
    type: "first_activity",
    name: "First Step",
    description: "Attend your first activity",
    icon: "🎯",
    color: "#3b82f6",
  },
  {
    id: "five_activities",
    type: "five_activities",
    name: "Getting Started",
    description: "Attend 5 activities",
    icon: "⭐",
    color: "#10b981",
  },
  {
    id: "ten_activities",
    type: "ten_activities",
    name: "Regular Participant",
    description: "Attend 10 activities",
    icon: "🌟",
    color: "#f59e0b",
  },
  {
    id: "twenty_activities",
    type: "twenty_activities",
    name: "Activity Enthusiast",
    description: "Attend 20 activities",
    icon: "🏆",
    color: "#8b5cf6",
  },
  {
    id: "category_explorer",
    type: "category_explorer",
    name: "Explorer",
    description: "Participate in activities from 3 different categories",
    icon: "🔍",
    color: "#06b6d4",
  },
  {
    id: "social_butterfly",
    type: "social_butterfly",
    name: "Social Butterfly",
    description: "Comment on 10 different activities",
    icon: "🦋",
    color: "#ec4899",
  },
  {
    id: "early_bird",
    type: "early_bird",
    name: "Early Bird",
    description: "Register for an activity at least 7 days in advance",
    icon: "🐦",
    color: "#f97316",
  },
  {
    id: "consistent",
    type: "consistent",
    name: "Consistent",
    description: "Attend activities for 4 consecutive weeks",
    icon: "📅",
    color: "#14b8a6",
  },
  {
    id: "sports_star",
    type: "sports_star",
    name: "Sports Star",
    description: "Attend 5 Sports category activities",
    icon: "⚽",
    color: "#22c55e",
  },
  {
    id: "culture_vulture",
    type: "culture_vulture",
    name: "Culture Vulture",
    description: "Attend 5 Events or Cultural activities",
    icon: "🎭",
    color: "#a855f7",
  },
];

interface AchievementContextType {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  earnedAchievements: (userId: string) => Achievement[];
  checkAndAwardAchievements: (userId: string, activityCount: number, categories: string[], commentCount: number) => void;
  getAchievementProgress: (userId: string, activityCount: number) => { achieved: number; total: number };
}

const newUserAchievementId = () => {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
  return `ua_${Date.now()}_${uuid}`;
};

export const AchievementProvider = ({ children }: { children: ReactNode }) => {
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);

  // Load user achievements from localStorage
  useEffect(() => {
    const stored = getJson<UserAchievement[]>("userAchievements", []);
    setUserAchievements(Array.isArray(stored) ? capArrayTail(stored, MAX_STORED_USER_ACHIEVEMENTS) : []);
  }, []);

  // Save achievements to localStorage
  useEffect(() => {
    setJson("userAchievements", capArrayTail(userAchievements, MAX_STORED_USER_ACHIEVEMENTS));
  }, [userAchievements]);

  // Get earned achievements for a user
  const earnedAchievements = (userId: string): Achievement[] => {
    const userEarned = userAchievements
      .filter((ua) => ua.userId === userId)
      .map((ua) => ua.achievementType);
    
    return ALL_ACHIEVEMENTS.filter((a) => userEarned.includes(a.type));
  };

  // Check and award new achievements
  const checkAndAwardAchievements = (
    userId: string,
    activityCount: number,
    categories: string[],
    commentCount: number
  ): void => {
    const now = new Date().toISOString();
    setUserAchievements((prev) => {
      const has = (type: BadgeType) =>
        prev.some((ua) => ua.userId === userId && ua.achievementType === type);

      const newAchievements: UserAchievement[] = [];

      if (activityCount >= 1 && !has("first_activity")) {
        newAchievements.push({ id: newUserAchievementId(), userId, achievementType: "first_activity", earnedAt: now });
      }
      if (activityCount >= 5 && !has("five_activities")) {
        newAchievements.push({ id: newUserAchievementId(), userId, achievementType: "five_activities", earnedAt: now });
      }
      if (activityCount >= 10 && !has("ten_activities")) {
        newAchievements.push({ id: newUserAchievementId(), userId, achievementType: "ten_activities", earnedAt: now });
      }
      if (activityCount >= 20 && !has("twenty_activities")) {
        newAchievements.push({ id: newUserAchievementId(), userId, achievementType: "twenty_activities", earnedAt: now });
      }

      const uniqueCategories = [...new Set(categories)];
      if (uniqueCategories.length >= 3 && !has("category_explorer")) {
        newAchievements.push({ id: newUserAchievementId(), userId, achievementType: "category_explorer", earnedAt: now });
      }
      if (commentCount >= 10 && !has("social_butterfly")) {
        newAchievements.push({ id: newUserAchievementId(), userId, achievementType: "social_butterfly", earnedAt: now });
      }

      if (!newAchievements.length) return prev;
      return [...prev, ...newAchievements];
    });
  };

  // Get achievement progress
  const getAchievementProgress = (userId: string, activityCount: number): { achieved: number; total: number } => {
    const userEarned = userAchievements.filter((ua) => ua.userId === userId).length;
    return {
      achieved: userEarned,
      total: ALL_ACHIEVEMENTS.length,
    };
  };

  return (
    <AchievementContext.Provider
      value={{
        achievements: ALL_ACHIEVEMENTS,
        userAchievements,
        earnedAchievements,
        checkAndAwardAchievements,
        getAchievementProgress,
      }}
    >
      {children}
    </AchievementContext.Provider>
  );
};

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error("useAchievements must be used within AchievementProvider");
  }
  return context;
};

