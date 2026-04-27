import type { Activity } from "@/types";

/** Trim unbounded client caches so localStorage stays under typical ~5MB limits. */
export const MAX_STORED_NOTIFICATIONS = 120;
export const MAX_STORED_LOCAL_USERS = 250;
export const MAX_STORED_ACTIVITIES_CACHE = 100;
export const MAX_ACTIVITY_COMMENTS_RATINGS_EACH = 40;
export const MAX_STORED_USER_ACHIEVEMENTS = 800;
export const MAX_STORED_PASSWORD_RESET_REQUESTS = 100;
export const MAX_STORED_FAVORITES = 500;
export const MAX_STORED_CERTIFICATES = 200;

export type LocalUserPreview = {
  id: string;
  name: string;
  email: string;
  role: string;
};

/**
 * Keys removed in order (least critical for app boot) when quota is exceeded.
 * Never include auth token or theme unless nothing else works.
 */
const EVICTABLE_KEYS_IN_ORDER = [
  "activities",
  "broadcast_notifications",
  "user_notifications",
  "admin_notifications",
  "certificates",
  "userAchievements",
  "users",
  "passwordResetRequests",
  "favorites",
  "activity_history",
  "categories",
] as const;

const isQuotaError = (e: unknown): boolean =>
  e instanceof DOMException &&
  (e.code === 22 ||
    e.code === 1014 ||
    e.name === "QuotaExceededError" ||
    e.name === "NS_ERROR_DOM_QUOTA_REACHED");

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // private mode / disabled storage
  }
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (!isQuotaError(e)) return false;
    return evictOthersAndRetrySet(key, value);
  }
}

function evictOthersAndRetrySet(key: string, value: string): boolean {
  for (const k of EVICTABLE_KEYS_IN_ORDER) {
    if (k === key) continue;
    safeRemoveItem(k);
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      // keep evicting
    }
  }
  return false;
}

export function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (raw == null || raw === "") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getJson<T>(key: string, fallback: T): T {
  return safeParseJson(safeGetItem(key), fallback);
}

export function setJson(key: string, value: unknown): boolean {
  try {
    return safeSetItem(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

/** Keep newest-first lists bounded. */
export function capArray<T>(arr: T[] | undefined | null, maxLen: number): T[] {
  if (!Array.isArray(arr) || maxLen <= 0) return [];
  return arr.slice(0, maxLen);
}

/** Keep the most recently appended items when trimming (e.g. favorites). */
export function capArrayTail<T>(arr: T[] | undefined | null, maxLen: number): T[] {
  if (!Array.isArray(arr) || maxLen <= 0) return [];
  if (arr.length <= maxLen) return arr;
  return arr.slice(arr.length - maxLen);
}

export function upsertUserPreview(list: LocalUserPreview[], user: LocalUserPreview): LocalUserPreview[] {
  const idx = list.findIndex((u) => u.email === user.email || u.id === user.id);
  const next = [...list];
  if (idx >= 0) next[idx] = { ...next[idx], ...user };
  else next.unshift({ ...user });
  return capArray(next, MAX_STORED_LOCAL_USERS);
}

export function trimActivitiesForLocalStorage(activities: Activity[]): Activity[] {
  const capped = capArray(activities, MAX_STORED_ACTIVITIES_CACHE);
  return capped.map((a) => ({
    ...a,
    comments: capArray(a.comments || [], MAX_ACTIVITY_COMMENTS_RATINGS_EACH),
    ratings: capArray(a.ratings || [], MAX_ACTIVITY_COMMENTS_RATINGS_EACH),
  }));
}
