export type UserRole = "ADMIN" | "STUDENT" | "admin" | "student";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  isVerified?: boolean;
  verificationCode?: string;
}

export type ActivityCategory = string;

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

// Feedback interface
export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  activityId: string;
  overallRating: number;
  organizationRating: number;
  contentRating: number;
  comment?: string;
  createdAt: string;
}

// Check-in interface
export interface CheckIn {
  id: string;
  userId: string;
  userName: string;
  activityId: string;
  checkedInAt: string;
  checkedInBy: string;
}

// User Notification Settings
export interface NotificationSettings {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  activityReminders: boolean;
  broadcastMessages: boolean;
  registrationUpdates: boolean;
}

// Activity Tag
export interface ActivityTag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  date: string;
  startTime?: string; // e.g., "10:00"
  endTime?: string;   // e.g., "12:00"
  venue: string;
  maxParticipants: number;
  currentParticipants: string[]; // Array of user IDs
  waitlist: string[]; // Array of user IDs on waitlist
  comments: Comment[]; // Comments on activity
  ratings: Rating[]; // Ratings for activity
  createdBy: string; // Admin user ID
  createdAt: string;
  reminderSent?: boolean; // Whether reminder has been sent
  // New fields
  tags?: string[]; // Custom tags for activities
  requiresApproval?: boolean; // Admin needs to approve registrations
  approvedParticipants?: string[]; // Approved user IDs
  pendingParticipants?: string[]; // Pending approval user IDs
  rejectedParticipants?: string[]; // Rejected user IDs
  checkIns?: CheckIn[]; // Check-in records
  feedbacks?: Feedback[]; // Feedback submissions
  photos?: ActivityPhoto[]; // Photo gallery
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface Rating {
  id: string;
  userId: string;
  userName: string;
  score: number; // 1-5
  review?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId?: string;
  targetRole?: "admin" | "student";
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  isBroadcast?: boolean; // For broadcast messages
}

// Activity Reminder
export interface Reminder {
  id: string;
  activityId: string;
  userId: string;
  reminderTime: string; // When to send reminder
  sent: boolean;
  createdAt: string;
}

// Favorite Activity
export interface FavoriteActivity {
  id: string;
  activityId: string;
  userId: string;
  addedAt: string;
}

// Activity Photo
export interface ActivityPhoto {
  id: string;
  activityId: string;
  url: string;
  caption?: string;
  uploadedBy: string;
  uploadedAt: string;
}

// Achievement/Badge Types
export type BadgeType = 
  | "first_activity"
  | "five_activities"
  | "ten_activities"
  | "twenty_activities"
  | "category_explorer"
  | "social_butterfly"
  | "early_bird"
  | "consistent"
  | "sports_star"
  | "culture_vulture";

export interface Achievement {
  id: string;
  type: BadgeType;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt?: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementType: BadgeType;
  earnedAt: string;
}

// Certificate
export interface Certificate {
  id: string;
  activityId: string;
  activityTitle: string;
  userId: string;
  userName: string;
  issueDate: string;
  activityDate: string;
}

// Broadcast Message
export interface BroadcastMessage {
  id: string;
  title: string;
  message: string;
  targetRole: "all" | "admin" | "student" | "coordinator";
  type: "info" | "success" | "warning" | "error";
  sendEmail: boolean;
  status: "DRAFT" | "SENT" | "PARTIAL" | "FAILED";
  recipientCount: number;
  emailSentCount: number;
  emailFailedCount: number;
  failureReason?: string;
  createdBy: string;
  createdAt: string;
  sentAt?: string;
}

// User Activity History Entry
export interface ActivityHistoryEntry {
  id: string;
  activityId: string;
  activityTitle: string;
  userId: string;
  status: "registered" | "waitlisted" | "attended" | "cancelled";
  registeredAt: string;
  cancelledAt?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  register: (email: string, name: string, password: string, role?: string) => Promise<{ email: string; message: string }>;
  verifyEmail: (email: string, otp: string) => Promise<boolean>;
  resendVerificationCode: (email: string) => Promise<boolean>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export interface ActivityContextType {
  activities: Activity[];
  addActivity: (activity: Activity) => Promise<void>;
  updateActivity: (id: string, activity: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  reloadActivities: () => Promise<void>;
  registerForActivity: (userId: string, activityId: string) => Promise<void>;
  unregisterFromActivity: (userId: string, activityId: string) => Promise<void>;
  joinWaitlist: (userId: string, activityId: string) => void;
  leaveWaitlist: (userId: string, activityId: string) => void;
  addComment: (activityId: string, comment: Comment) => Promise<void>;
  deleteComment: (activityId: string, commentId: string) => Promise<void>;
  addRating: (activityId: string, rating: Rating) => Promise<void>;
  getActivity: (id: string) => Activity | undefined;
  getUserActivities: (userId: string) => Activity[];
  getUserActivityHistory: (userId: string) => ActivityHistoryEntry[];
  categories: Category[];
  addCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  // New features
  favorites: string[];
  addFavorite: (userId: string, activityId: string) => void;
  removeFavorite: (userId: string, activityId: string) => void;
  isFavorite: (userId: string, activityId: string) => boolean;
  getFavoriteActivities: (userId: string) => Activity[];
}

export interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id" | "createdAt" | "read">) => void;
  addBroadcastNotification: (title: string, message: string, type?: "info" | "success" | "warning" | "error") => void;
  notifyAdminOfRegistration: (studentName: string, activityTitle: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  unreadCount: number;
}

// ==================== RECOMMENDATION SYSTEM TYPES ====================

// User preference profile for recommendations
export interface UserPreferenceProfile {
  userId: string;
  categoryPreferences: Record<string, number>;
  timePreference: "morning" | "afternoon" | "evening" | "night";
  venuePreferences: string[];
  activityCountByCategory: Record<string, number>;
  totalActivities: number;
  averageRatingGiven: number;
  dayPreference: "weekday" | "weekend" | "any";
  updatedAt: string;
}

// Recommendation reason
export interface RecommendationReason {
  type: "category_match" | "popular" | "similar_joined" | "new_activity" | "high_rated" | "time_match";
  message: string;
  score: number;
}

// Recommended activity with reason
export interface RecommendedActivity {
  activity: Activity;
  score: number;
  reasons: RecommendationReason[];
}
