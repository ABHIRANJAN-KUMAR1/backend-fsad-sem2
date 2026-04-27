import type { Activity, ActivityCategory, CheckIn, Comment, Feedback, ActivityPhoto, Rating } from "@/types";

/**
 * Coerce unknown / partial API or cached payloads into a safe Activity, or drop invalid rows.
 */
export function normaliseActivity(raw: unknown): Activity | null {
  if (raw == null || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.id == null || String(r.id).trim() === "") return null;

  const str = (v: unknown, fallback: string) =>
    v != null && String(v).trim() !== "" ? String(v) : fallback;

  const strArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x) => x != null).map((x) => String(x)) : [];

  const maxN = Number(r.maxParticipants);
  const maxParticipants = Number.isFinite(maxN) && maxN > 0 ? Math.floor(maxN) : 50;

  const comments: Comment[] = Array.isArray(r.comments) ? (r.comments as Comment[]) : [];
  const ratings: Rating[] = Array.isArray(r.ratings) ? (r.ratings as Rating[]) : [];

  return {
    id: String(r.id),
    title: str(r.title, "Untitled"),
    description: str(r.description, ""),
    category: str(r.category, "Clubs") as ActivityCategory,
    date: str(r.date, new Date().toISOString().slice(0, 10)),
    startTime: r.startTime != null ? String(r.startTime) : undefined,
    endTime: r.endTime != null ? String(r.endTime) : undefined,
    venue: str(r.venue, "TBA"),
    maxParticipants,
    currentParticipants: strArr(r.currentParticipants),
    waitlist: strArr(r.waitlist),
    comments,
    ratings,
    createdBy: str(r.createdBy, ""),
    createdAt: str(r.createdAt, new Date().toISOString()),
    reminderSent: typeof r.reminderSent === "boolean" ? r.reminderSent : undefined,
    tags: strArr(r.tags),
    requiresApproval: typeof r.requiresApproval === "boolean" ? r.requiresApproval : undefined,
    approvedParticipants: strArr(r.approvedParticipants),
    pendingParticipants: strArr(r.pendingParticipants),
    rejectedParticipants: strArr(r.rejectedParticipants),
    checkIns: Array.isArray(r.checkIns) ? (r.checkIns as CheckIn[]) : undefined,
    feedbacks: Array.isArray(r.feedbacks) ? (r.feedbacks as Feedback[]) : undefined,
    photos: Array.isArray(r.photos) ? (r.photos as ActivityPhoto[]) : undefined,
  };
}

export function normaliseActivitiesList(data: unknown): Activity[] {
  if (!Array.isArray(data)) return [];
  return data.map(normaliseActivity).filter((a): a is Activity => a != null);
}
