import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { Activity, ActivityContextType, Category, Comment, Rating, ActivityHistoryEntry } from "@/types";
import { activitiesApi } from "@/lib/api";
import { normaliseActivitiesList, normaliseActivity } from "@/lib/activityData";
import {
  capArrayTail,
  getJson,
  setJson,
  trimActivitiesForLocalStorage,
  MAX_STORED_FAVORITES,
} from "@/lib/safeStorage";

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

const STORAGE_KEY = "activities";
const CATEGORIES_KEY = "categories";
const HISTORY_KEY = "activity_history";
const FAVORITES_KEY = "favorites";

export const ActivityProvider = ({ children }: { children: ReactNode }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    { id: "cat_1", name: "Clubs", createdAt: new Date().toISOString() },
    { id: "cat_2", name: "Sports", createdAt: new Date().toISOString() },
    { id: "cat_3", name: "Events", createdAt: new Date().toISOString() },
  ]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const hasLoadedInitialData = useRef(false);

  // Load data from server with local fallback
  useEffect(() => {
    if (hasLoadedInitialData.current) return;
    hasLoadedInitialData.current = true;

    const loadData = async () => {
      try {
        const serverData = await activitiesApi.getAll();
        const fromServer = normaliseActivitiesList(serverData);
        if (fromServer.length > 0) {
          setActivities(fromServer);
        } else {
          const localData = getJson<unknown>(STORAGE_KEY, []);
          setActivities(normaliseActivitiesList(localData));
        }
      } catch (e) {
        console.error("Server load failed, using local:", e);
        const localData = getJson<unknown>(STORAGE_KEY, []);
        setActivities(normaliseActivitiesList(localData));
      }
    };
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to local on change
  useEffect(() => {
    setJson(STORAGE_KEY, trimActivitiesForLocalStorage(activities));
  }, [activities]);

  // Load favorites from localStorage (UI state)
  useEffect(() => {
    const parsed = getJson<string[]>(FAVORITES_KEY, []);
    setFavorites(Array.isArray(parsed) ? capArrayTail(parsed, MAX_STORED_FAVORITES) : []);
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    setJson(FAVORITES_KEY, capArrayTail(favorites, MAX_STORED_FAVORITES));
  }, [favorites]);

  const addActivity = async (activity: Activity) => {
    const newActivity = normaliseActivity({
      ...activity,
      id:
        activity?.id != null && String(activity.id).trim() !== ""
          ? String(activity.id)
          : `local_${Date.now()}`,
      createdAt: activity.createdAt ?? new Date().toISOString(),
    });
    if (!newActivity) return;

    // Idempotent: replace existing by ID, or prepend new
    setActivities((prev) => {
      const idx = prev.findIndex((a) => a.id === newActivity.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newActivity;
        return next;
      }
      return [newActivity, ...prev];
    });

    try {
      await activitiesApi.create(newActivity);
      const data = await activitiesApi.getAll();
      const list = normaliseActivitiesList(data);
      if (list.length > 0) setActivities(list);
    } catch {
      // Backend unavailable — do NOT revert. The activity is already in state
      // and saved to localStorage via the useEffect. It will sync when backend is available.
      console.warn("Backend unavailable — activity saved locally and will sync later.");
    }
  };

  const updateActivity = async (id: string, updates: Partial<Activity>) => {
    // Optimistic update
    setActivities(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    try {
      await activitiesApi.update(id, updates);
      // Reload to sync
      const data = await activitiesApi.getAll();
      const list = normaliseActivitiesList(data);
      if (list.length > 0) setActivities(list);
    } catch {
      console.warn("Backend unavailable — update saved locally.");
    }
  };

  const deleteActivity = async (id: string) => {
    // Optimistic removal
    setActivities(prev => prev.filter(a => a.id !== id));
    try {
      await activitiesApi.delete(id);
    } catch {
      console.warn("Backend unavailable — delete applied locally.");
    }
  };

  const registerForActivity = async (userId: string, activityId: string) => {
    try {
      await activitiesApi.register(activityId, userId);
      // Reload
      const data = await activitiesApi.getAll();
      setActivities(normaliseActivitiesList(data));
    } catch (e) {
      console.error("Registration failed:", e);
    }
  };

  const unregisterFromActivity = async (userId: string, activityId: string) => {
    try {
      await activitiesApi.unregister(activityId, userId);
      // Reload
      const data = await activitiesApi.getAll();
      setActivities(normaliseActivitiesList(data));
    } catch (e) {
      console.error("Unregister failed:", e);
    }
  };

  const joinWaitlist = (userId: string, activityId: string) => {
    // Local optimistic update
    setActivities((prev) =>
      prev.map((a) => {
        const wl = a.waitlist ?? [];
        if (a.id === activityId && !wl.includes(userId)) {
          return { ...a, waitlist: [...wl, userId] };
        }
        return a;
      }),
    );
  };

  const leaveWaitlist = (userId: string, activityId: string) => {
    // Local optimistic update
    setActivities((prev) =>
      prev.map((a) => {
        if (a.id === activityId) {
          const wl = a.waitlist ?? [];
          return { ...a, waitlist: wl.filter((id) => id !== userId) };
        }
        return a;
      }),
    );
  };

  const getActivity = (id: string) => activities.find((a) => a.id === id);
  const getUserActivities = (userId: string) =>
    activities.filter((a) => (a.currentParticipants ?? []).includes(userId));

  const addComment = async (activityId: string, comment: Comment) => {// No optimistic update for comments, as they are more likely to be edited/deleted by the user shortly after posting, and we want to ensure the ID is correct from the start. Instead, we reload after posting.
    const newComment = { ...comment, createdAt: new Date().toISOString() };
    try {
      await activitiesApi.addComment(activityId, { userId: comment.userId, userName: comment.userName, content: comment.content });
    } catch {}
    // Reload
    const data = await activitiesApi.getAll();
    setActivities(normaliseActivitiesList(data));
  };

  const deleteComment = async (activityId: string, commentId: string) => {
    try {
      await activitiesApi.deleteComment(activityId, commentId);
    } catch {}
    // Reload
    const data = await activitiesApi.getAll();
    setActivities(normaliseActivitiesList(data));
  };

  const addRating = async (activityId: string, rating: Rating) => {
    const newRating = { ...rating, createdAt: new Date().toISOString() };
    
    // Optimistic update
    setActivities(prev => prev.map(activity => 
      activity.id === activityId 
        ? { ...activity, ratings: [...(activity.ratings || []), newRating] }
        : activity
    ));
    
    try {
      await activitiesApi.addRating(activityId, { userId: rating.userId, userName: rating.userName, score: rating.score, review: rating.review });
      // Reload to sync
      const data = await activitiesApi.getAll();
      setActivities(normaliseActivitiesList(data));
    } catch (error) {
      console.error('Rating save failed:', error);
      // Revert optimistic update
      setActivities(prev => prev.map(activity =>
        activity.id === activityId
          ? { ...activity, ratings: (activity.ratings || []).filter(r => r.id !== newRating.id) }
          : activity
      ));
    }
  };

  const getUserActivityHistory = (userId: string): ActivityHistoryEntry[] => [];

  const addCategory = (category: Category) => {
    setCategories(prev => [...prev, category]);
  };

  const deleteCategory = (id: string) => {
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
  };

  const addFavorite = (userId: string, activityId: string) => {
    const key = `${userId}_${activityId}`;
    if (!favorites.includes(key)) {
      setFavorites((prev) => capArrayTail([...prev, key], MAX_STORED_FAVORITES));
    }
  };

  const removeFavorite = (userId: string, activityId: string) => {
    const key = `${userId}_${activityId}`;
    setFavorites(prev => prev.filter(f => f !== key));
  };

  const isFavorite = (userId: string, activityId: string) => favorites.includes(`${userId}_${activityId}`);

  const getFavoriteActivities = (userId: string) => {
    const userFavs = favorites.filter(f => f.startsWith(`${userId}_`));
    return activities.filter(a => userFavs.some(f => f.endsWith(`_${a.id}`)));
  };

  const reloadActivities = async () => {
    try {
      const data = await activitiesApi.getAll();
      const normalised = normaliseActivitiesList(data);
      if (normalised.length > 0) {
        setActivities(normalised);
        setJson(STORAGE_KEY, trimActivitiesForLocalStorage(normalised));
      }
      // If server returns empty, keep current state (don't wipe a freshly added optimistic activity)
    } catch (e) {
      console.error("Reload failed, using localStorage:", e);
      const localData = getJson<unknown>(STORAGE_KEY, []);
      const localNorm = normaliseActivitiesList(localData);
      if (localNorm.length > 0) setActivities(localNorm);
    }
  };

  return (
    <ActivityContext.Provider value={{
      activities, addActivity, updateActivity, deleteActivity, reloadActivities,
      registerForActivity, unregisterFromActivity, joinWaitlist, leaveWaitlist,
      addComment, deleteComment, addRating, getActivity, getUserActivities,
      getUserActivityHistory, categories, addCategory, deleteCategory,
      favorites, addFavorite, removeFavorite, isFavorite, getFavoriteActivities,
    }}>
      {children}
    </ActivityContext.Provider>
  );

};

export const useActivities = () => {
  const context = useContext(ActivityContext);
  if (!context) throw new Error("useActivities must be used within ActivityProvider");
  return context;
};
