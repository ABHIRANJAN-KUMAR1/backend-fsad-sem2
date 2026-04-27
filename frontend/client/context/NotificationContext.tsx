import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Notification, NotificationContextType } from "@/types";
import { useAuth } from "./AuthContext";
import { capArray, getJson, setJson, MAX_STORED_NOTIFICATIONS } from "@/lib/safeStorage";

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Separate keys for user-specific and admin notifications
const USER_NOTIFICATIONS_KEY = "user_notifications";
const ADMIN_NOTIFICATIONS_KEY = "admin_notifications";
const BROADCAST_NOTIFICATIONS_KEY = "broadcast_notifications"; // Shared between all users

const newNotificationId = () => {
  // Date.now() can collide when multiple notifications are created in same ms.
  // Prefer randomUUID when available, with a safe fallback.
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
  return `notif_${Date.now()}_${uuid}`;
};

const dedupeNotifications = (input: Notification[]) => {
  const byKey = new Map<string, Notification>();
  for (const n of input) {
    if (!n) continue;
    const key = n.id || `${n.targetRole ?? "any"}|${n.userId ?? "all"}|${n.title}|${n.message}|${n.createdAt}`;
    if (!byKey.has(key)) {
      byKey.set(key, n);
    }
  }
  return Array.from(byKey.values()).sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    if (!Number.isFinite(ta) || !Number.isFinite(tb)) return 0;
    return tb - ta;
  });
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  const normalizedRole = user?.role?.toLowerCase();

  // Load notifications from localStorage on mount and when user changes
  useEffect(() => {
    const loadNotifications = () => {
      const allNotifications: Notification[] = [];
      let broadcastDirty = false;
      let adminDirty = false;
      let userDirty = false;
      
      const broadcastNotifications = getJson<Notification[]>(BROADCAST_NOTIFICATIONS_KEY, []);
      if (broadcastNotifications.length) {
        allNotifications.push(...broadcastNotifications);
      }

      if (normalizedRole === "admin") {
        const adminNotifications = getJson<Notification[]>(ADMIN_NOTIFICATIONS_KEY, []);
        if (adminNotifications.length) {
          allNotifications.push(...adminNotifications);
        }
      } else if (user) {
        const userNotifications = getJson<Notification[]>(USER_NOTIFICATIONS_KEY, []);
        if (userNotifications.length) {
          allNotifications.push(...userNotifications);
        }
      }

      // Ensure unique IDs (old data may contain collisions from Date.now()).
      const seen = new Set<string>();
      for (const n of allNotifications) {
        if (!n || typeof n !== "object") continue;
        if (!n.id || typeof n.id !== "string") {
          (n as Notification).id = newNotificationId();
          broadcastDirty = true;
          adminDirty = true;
          userDirty = true;
          continue;
        }
        if (seen.has(n.id)) {
          (n as Notification).id = newNotificationId();
          broadcastDirty = true;
          adminDirty = true;
          userDirty = true;
        }
        seen.add((n as Notification).id);
      }

      // Best-effort persist fixed IDs back to storage to prevent repeated warnings.
      if (broadcastDirty) {
        const broadcastOnly = capArray(
          allNotifications.filter((n) => n.targetRole === "student" && n.userId === undefined),
          MAX_STORED_NOTIFICATIONS,
        );
        setJson(BROADCAST_NOTIFICATIONS_KEY, broadcastOnly);
      }
      if (userDirty && normalizedRole !== "admin") {
        const userOnly = capArray(
          allNotifications.filter((n) => n.targetRole !== "admin"),
          MAX_STORED_NOTIFICATIONS,
        );
        setJson(USER_NOTIFICATIONS_KEY, userOnly);
      }
      if (adminDirty && normalizedRole === "admin") {
        const adminOnly = capArray(
          allNotifications.filter((n) => n.targetRole === "admin"),
          MAX_STORED_NOTIFICATIONS,
        );
        setJson(ADMIN_NOTIFICATIONS_KEY, adminOnly);
      }

      setNotifications(dedupeNotifications(allNotifications));
    };
    
    loadNotifications();
  }, [normalizedRole, user]);

  useEffect(() => {
    if (!user) return;
    const scoped = normalizedRole === "admin"
      ? notifications.filter((n) => n.targetRole === "admin")
      : notifications.filter((n) => n.targetRole === "student" && n.userId !== undefined);
    const capped = capArray(dedupeNotifications(scoped), MAX_STORED_NOTIFICATIONS);
    if (normalizedRole === "admin") {
      setJson(ADMIN_NOTIFICATIONS_KEY, capped);
    } else {
      setJson(USER_NOTIFICATIONS_KEY, capped);
    }
  }, [normalizedRole, notifications, user]);

  // Filter notifications based on user role
  const getFilteredNotifications = () => {
    if (!user) return notifications;
    
    // Admin sees: notifications for admin role
    if (normalizedRole === "admin") {
      return notifications.filter(n => n.targetRole === "admin");
    }
    
    // Student sees: notifications for student role
    return notifications.filter(n => n.targetRole === "student");
  };

  const addNotification = (notification: Omit<Notification, "id" | "createdAt" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: newNotificationId(),
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => dedupeNotifications([newNotification, ...prev]));
  };

  // Add notification for all students - when admin creates activity
  const addBroadcastNotification = (title: string, message: string, type: "info" | "success" | "warning" | "error" = "info") => {
    const newNotification: Notification = {
      title,
      message,
      type,
      userId: undefined,
      targetRole: "student",
      id: newNotificationId(),
      createdAt: new Date().toISOString(),
      read: false,
    };
    
    // Save to broadcast storage (shared between all users)
    const broadcastNotifications = getJson<Notification[]>(BROADCAST_NOTIFICATIONS_KEY, []);
    
    // Check if this notification already exists (prevent duplicates)
    const isDuplicate = broadcastNotifications.some(
      (n: Notification) => n.title === title && n.message === message && 
      new Date(n.createdAt).getTime() > Date.now() - 5000 // Within last 5 seconds
    );
    
    if (isDuplicate) {
      console.log("Duplicate notification skipped");
      return;
    }
    
    const updatedBroadcastNotifications = capArray(
      [newNotification, ...broadcastNotifications],
      MAX_STORED_NOTIFICATIONS,
    );
    setJson(BROADCAST_NOTIFICATIONS_KEY, updatedBroadcastNotifications);
    
    // Update state so UI reflects the new notification
    setNotifications((prev) => dedupeNotifications([newNotification, ...prev]));
  };

  // Add notification to admin when student registers
  const notifyAdminOfRegistration = (studentName: string, activityTitle: string) => {
    const message = activityTitle 
      ? `${studentName} has registered for "${activityTitle}"`
      : `${studentName} has registered as a new student`;
      
    const newNotification: Notification = {
      title: "New Student Registration",
      message,
      type: "info",
      userId: undefined,
      targetRole: "admin",
      id: newNotificationId(),
      createdAt: new Date().toISOString(),
      read: false,
    };
    
    // Store directly in admin notifications storage
    const adminNotifications = getJson<Notification[]>(ADMIN_NOTIFICATIONS_KEY, []);
    const updatedAdminNotifications = capArray(
      [newNotification, ...adminNotifications],
      MAX_STORED_NOTIFICATIONS,
    );
    setJson(ADMIN_NOTIFICATIONS_KEY, updatedAdminNotifications);
    
    // Also add to current state if admin is logged in
    setNotifications((prev) => dedupeNotifications([newNotification, ...prev]));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Get filtered notifications based on current user
  const filteredNotifications = getFilteredNotifications();
  const unreadCount = filteredNotifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications: filteredNotifications,
        addNotification,
        addBroadcastNotification,
        notifyAdminOfRegistration,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};
