import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  BookOpen,
  Settings,
  Users,
  LogOut,
  Activity,
  Menu,
  ArrowRightLeft,
  Folder,
  User,
  BarChart3,
  Calendar,
  Bell,
  Heart,
  ClipboardCheck,
  Tags,
  BellRing,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  const menuItems = isAdmin
    ? [
        {
          name: "Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          name: "Activities",
          path: "/activities",
          icon: BookOpen,
        },
        {
          name: "Calendar",
          path: "/activities/calendar",
          icon: Calendar,
        },
        {
          name: "Categories",
          path: "/categories",
          icon: Folder,
        },
        {
          name: "Students",
          path: "/students",
          icon: Users,
        },
        {
          name: "Redirect",
          path: "/redirect",
          icon: ArrowRightLeft,
        },
        {
          name: "Broadcast",
          path: "/broadcast",
          icon: Bell,
        },
        {
          name: "Check-In",
          path: "/check-in",
          icon: ClipboardCheck,
        },
        {
          name: "Tags",
          path: "/tags",
          icon: Tags,
        },
        {
          name: "Analytics",
          path: "/analytics",
          icon: BarChart3,
        },
      ]
    : [
        {
          name: "Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          name: "Activities",
          path: "/activities",
          icon: Activity,
        },
        {
          name: "My Activities",
          path: "/my-activities",
          icon: BookOpen,
        },
        {
          name: "Calendar",
          path: "/activities/calendar",
          icon: Calendar,
        },
        {
          name: "Favorites",
          path: "/favorites",
          icon: Heart,
        },
        {
          name: "Achievements",
          path: "/achievements",
          icon: Trophy,
        },
        {
          name: "Profile",
          path: "/profile",
          icon: User,
        },
        {
          name: "Notifications",
          path: "/notification-settings",
          icon: BellRing,
        },
      ];

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="h-10 w-10"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:static w-64 h-screen bg-sidebar border-r border-sidebar-border transition-transform duration-300 z-40 flex flex-col`}
      >
        <div className="p-6 border-b border-sidebar-border">
            <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-foreground">Activity Hub Manager</span>
              <span className="text-xs text-muted-foreground">
                Organizing and Managing Student Extracurricular Activities
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-2">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </Link>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
