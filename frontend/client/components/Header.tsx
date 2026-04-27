import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "./NotificationBell";

export const Header = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 md:px-8 py-4">
        <div className="flex-1">

          <p className="text-sm text-muted-foreground">
            Welcome back, <span className="font-semibold text-foreground">{user?.name || user?.email || 'User'}</span>
          </p>

        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-lg"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};
