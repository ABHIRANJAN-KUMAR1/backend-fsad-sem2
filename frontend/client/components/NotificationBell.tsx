import { useState } from "react";
import { Bell, X } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { ScrollArea } from "@/components/ui/scroll-area";

export function NotificationBell() {
  const { notifications, markAsRead, markAllAsRead, deleteNotification, unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const recentNotifications = notifications.slice(0, 10);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-muted transition-colors"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Mark all read
                </button>
              )}
            </div>

            <ScrollArea className="max-h-80">
              {recentNotifications.length > 0 ? (
                <div className="divide-y divide-border">
                  {recentNotifications.map((notification) => (
                    <div
                      key={notification?.id ?? `${notification?.createdAt ?? "unknown"}_${notification?.title ?? "notif"}`}
                      className={`p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                        !notification.read ? "bg-blue-50 dark:bg-blue-950/20" : ""
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          notification.type === "success" ? "bg-green-500" :
                          notification.type === "warning" ? "bg-yellow-500" :
                          notification.type === "error" ? "bg-red-500" :
                          "bg-blue-500"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <X className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}
