import { Activity, UserPreferenceProfile, RecommendedActivity, RecommendationReason, Rating } from "@/types";
import { ApiError, userPreferencesApi } from "@/lib/api";
import { getJson, safeRemoveItem, setJson } from "@/lib/safeStorage";

const PREFERENCES_KEY = "user_preferences";

function activityParticipants(a: Activity): string[] {
  return Array.isArray(a.currentParticipants) ? a.currentParticipants : [];
}

function activityRatings(a: Activity): Rating[] {
  return Array.isArray(a.ratings) ? a.ratings : [];
}

// Cache for preferences - will sync with server
let preferencesCache: Map<string, UserPreferenceProfile> = new Map();
let isInitialized: Map<string, boolean> = new Map();

function getTimeOfDay(startTime?: string): "morning" | "afternoon" | "evening" | "night" {
  if (!startTime) return "afternoon";
  const hour = parseInt(startTime.split(":")[0]);
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function getDayType(date: string): "weekday" | "weekend" {
  const d = new Date(date);
  const day = d.getDay();
  return day === 0 || day === 6 ? "weekend" : "weekday";
}

// Default preferences
function getDefaultPreferences(userId: string): UserPreferenceProfile {
  return {
    userId: userId,
    categoryPreferences: {},
    timePreference: "afternoon",
    venuePreferences: [],
    activityCountByCategory: {},
    totalActivities: 0,
    averageRatingGiven: 0,
    dayPreference: "any",
    updatedAt: new Date().toISOString(),
  };
}

// Fetch preferences from server
async function fetchFromServer(userId: string): Promise<UserPreferenceProfile> {
  try {
    const data = await userPreferencesApi.get(userId);
    if (data) {
      preferencesCache.set(userId, data);
      return data;
    }
  } catch (error) {
    if (error instanceof ApiError) {
      // 404/501 are already handled by api.ts fallbacks; others log here.
      console.error("Failed to fetch preferences from server:", error.message);
    } else {
      console.error("Failed to fetch preferences from server:", error);
    }
  }
  
  // Fallback to localStorage
  const prefs = getJson<UserPreferenceProfile | null>(PREFERENCES_KEY + "_" + userId, null);
  if (prefs && typeof prefs === "object" && prefs.userId) {
    preferencesCache.set(userId, prefs);
    return prefs;
  }
  
  const defaults = getDefaultPreferences(userId);
  preferencesCache.set(userId, defaults);
  return defaults;
}

// Save preferences to server
async function saveToServer(prefs: UserPreferenceProfile): Promise<void> {
  try {
    await userPreferencesApi.update(prefs.userId, prefs);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("Failed to save preferences to server:", error.message);
    } else {
      console.error("Failed to save preferences to server:", error);
    }
  }
  
  // Always save to localStorage as backup
  setJson(PREFERENCES_KEY + "_" + prefs.userId, prefs);
}

// Update preferences on server from activity
async function updatePreferencesOnServer(userId: string, activityData: {
  activityCategory?: string;
  activityVenue?: string;
  activityStartTime?: string;
  activityDate?: string;
  rating?: number;
}): Promise<void> {
  try {
    const updatedPrefs = await userPreferencesApi.updateFromActivity(userId, activityData);
    if (updatedPrefs) {
      preferencesCache.set(userId, updatedPrefs);
      setJson(PREFERENCES_KEY + "_" + userId, updatedPrefs);
    }
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("Failed to update preferences on server:", error.message);
    } else {
      console.error("Failed to update preferences on server:", error);
    }
  }
}

export async function getUserPreferences(userId: string): Promise<UserPreferenceProfile> {
  // If already initialized, return cached
  if (isInitialized.get(userId) && preferencesCache.has(userId)) {
    return preferencesCache.get(userId)!;
  }
  
  // Fetch from server
  const prefs = await fetchFromServer(userId);
  isInitialized.set(userId, true);
  return prefs;
}

// Synchronous version - returns default if not cached
export function getUserPreferencesSync(userId: string): UserPreferenceProfile {
  if (preferencesCache.has(userId)) {
    return preferencesCache.get(userId)!;
  }
  
  // Try localStorage as fallback
  const stored = getJson<UserPreferenceProfile | null>(PREFERENCES_KEY + "_" + userId, null);
  if (stored && typeof stored === "object" && stored.userId) {
    return stored;
  }
  
  return getDefaultPreferences(userId);
}

export async function saveUserPreferences(prefs: UserPreferenceProfile): Promise<void> {
  prefs.updatedAt = new Date().toISOString();
  preferencesCache.set(prefs.userId, prefs);
  await saveToServer(prefs);
}

export async function updatePreferencesFromActivity(
  userId: string,
  activity: Activity,
  rating?: number
): Promise<UserPreferenceProfile> {
  // Try to update via server API first (if implemented).
  await updatePreferencesOnServer(userId, {
    activityCategory: activity.category,
    activityVenue: activity.venue,
    activityStartTime: activity.startTime,
    activityDate: activity.date,
    rating,
  });

  // If server update succeeded, cache may already be updated.
  const cached = preferencesCache.get(userId);
  if (cached) return cached;
  
  // Fallback to local calculation
  const prefs = await getUserPreferences(userId);
  
  const currentCatScore = prefs.categoryPreferences[activity.category] || 0;
  prefs.categoryPreferences[activity.category] = currentCatScore + 10;
  
  const currentCount = prefs.activityCountByCategory[activity.category] || 0;
  prefs.activityCountByCategory[activity.category] = currentCount + 1;
  
  prefs.totalActivities += 1;
  
  const timeOfDayVal = getTimeOfDay(activity.startTime);
  if (prefs.timePreference === "afternoon") {
    prefs.timePreference = timeOfDayVal;
  }
  
  if (!prefs.venuePreferences.includes(activity.venue)) {
    prefs.venuePreferences.push(activity.venue);
    if (prefs.venuePreferences.length > 5) {
      prefs.venuePreferences.shift();
    }
  }
  
  const dayTypeVal = getDayType(activity.date);
  if (prefs.dayPreference === "any") {
    prefs.dayPreference = dayTypeVal;
  }
  
  if (rating !== undefined && prefs.totalActivities > 0) {
    const totalRatings = prefs.totalActivities;
    prefs.averageRatingGiven = ((prefs.averageRatingGiven * (totalRatings - 1)) + rating) / totalRatings;
  }
  
  await saveUserPreferences(prefs);
  return prefs;
}

function calculateActivityScore(
  activity: Activity,
  prefs: UserPreferenceProfile,
  _allActivities: Activity[]
): { score: number; reasons: RecommendationReason[] } {
  let score = 0;
  const reasons: RecommendationReason[] = [];
  
  const categoryKey = activity.category ?? "";
  const categoryScore = prefs.categoryPreferences[categoryKey] || 0;
  if (categoryScore > 0) {
    const normalizedScore = Math.min(categoryScore, 40);
    score += normalizedScore;
    reasons.push({
      type: "category_match",
      message: "Matches your interest in " + categoryKey,
      score: normalizedScore,
    });
  }
  
  const activityTime = getTimeOfDay(activity.startTime);
  if (prefs.timePreference === activityTime) {
    score += 20;
    reasons.push({
      type: "time_match",
      message: "Scheduled during your preferred time (" + activityTime + ")",
      score: 20,
    });
  }
  
  const participants = activityParticipants(activity);
  const popularityScore = Math.min(participants.length * 4, 20);
  if (popularityScore > 0) {
    score += popularityScore;
    reasons.push({
      type: "popular",
      message: participants.length + " students have joined",
      score: popularityScore,
    });
  }

  const ratings = activityRatings(activity);
  if (ratings.length > 0) {
    const avgRating = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
    const ratingScore = Math.round(avgRating * 3);
    if (ratingScore > 0) {
      score += ratingScore;
      reasons.push({
        type: "high_rated",
        message: "Rated " + avgRating.toFixed(1) + " stars by participants",
        score: ratingScore,
      });
    }
  }
  
  const activityDate = new Date(activity.date ?? "");
  const now = new Date();
  const daysUntil = Math.ceil((activityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (Number.isFinite(daysUntil) && daysUntil > 0 && daysUntil <= 7) {
    const newScore = Math.max(10 - daysUntil, 5);
    score += newScore;
    reasons.push({
      type: "new_activity",
      message: "Coming up in " + daysUntil + " day" + (daysUntil > 1 ? "s" : ""),
      score: newScore,
    });
  }
  
  if ((prefs.activityCountByCategory[categoryKey] ?? 0) >= 3) {
    score += 15;
    reasons.push({
      type: "similar_joined",
      message: "Similar to activities you've enjoyed before",
      score: 15,
    });
  }
  
  const venue = activity.venue ?? "";
  if (venue && prefs.venuePreferences.includes(venue)) {
    score += 10;
    reasons.push({
      type: "category_match",
      message: "At your preferred venue: " + venue,
      score: 10,
    });
  }
  
  return { score: score, reasons: reasons };
}

export function getRecommendations(
  userId: string,
  allActivities: Activity[],
  limit: number = 6
): RecommendedActivity[] {
  const prefs = getUserPreferencesSync(userId);
  
  const availableActivities = allActivities.filter((a) => !activityParticipants(a).includes(userId));
  
  if (prefs.totalActivities === 0) {
    return availableActivities
      .sort((a, b) => {
        const aDate = new Date(a.date).getTime();
        const bDate = new Date(b.date).getTime();
        const now = Date.now();
        const aDays = Math.ceil((aDate - now) / (1000 * 60 * 60 * 24));
        const bDays = Math.ceil((bDate - now) / (1000 * 60 * 60 * 24));
        const aScore = activityParticipants(a).length + Math.max(0, 7 - aDays);
        const bScore = activityParticipants(b).length + Math.max(0, 7 - bDays);
        return bScore - aScore;
      })
      .slice(0, limit)
      .map((activity) => ({
        activity: activity,
        score: 50,
        reasons: [{
          type: "new_activity",
          message: "Popular new activity",
          score: 50,
        }],
      }));
  }
  
  const scoredActivities = availableActivities.map((activity) => {
    const result = calculateActivityScore(activity, prefs, allActivities);
    return { activity: activity, score: result.score, reasons: result.reasons };
  });
  
  scoredActivities.sort((a, b) => b.score - a.score);
  
  return scoredActivities.slice(0, limit);
}

export function getSimilarUserRecommendations(
  userId: string,
  allActivities: Activity[],
  limit: number = 4
): RecommendedActivity[] {
  const prefs = getUserPreferencesSync(userId);
  
  const topCategories = Object.entries(prefs.categoryPreferences)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((entry) => entry[0]);
  
  if (topCategories.length === 0) return [];
  
  const similarActivities = allActivities
    .filter(
      (a) =>
        !activityParticipants(a).includes(userId) &&
        topCategories.includes(a.category ?? "") &&
        activityParticipants(a).length > 0
    )
    .slice(0, limit);
  
  return similarActivities.map((activity) => ({
    activity: activity,
    score: 60,
    reasons: [{
      type: "similar_joined",
      message: "Students with similar interests joined this",
      score: 60,
    }],
  }));
}

export function getCategorySuggestions(
  userId: string,
  allActivities: Activity[],
  category: string,
  limit: number = 4
): RecommendedActivity[] {
  const prefs = getUserPreferencesSync(userId);
  
  const categoryActivities = allActivities
    .filter(
      (a) =>
        !activityParticipants(a).includes(userId) &&
        a.category === category
    )
    .sort((a, b) => activityParticipants(b).length - activityParticipants(a).length)
    .slice(0, limit);
  
  return categoryActivities.map((activity) => ({
    activity: activity,
    score: prefs.categoryPreferences[category] || 30,
    reasons: [{
      type: "category_match",
      message: "Popular in " + category,
      score: prefs.categoryPreferences[category] || 30,
    }],
  }));
}

export function refreshRecommendations(userId: string): void {
  safeRemoveItem(PREFERENCES_KEY + "_" + userId);
}

