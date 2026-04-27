import "./global.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";

// 👇 FIX imports if needed
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ActivityProvider } from "./context/ActivityContext";
import { AchievementProvider } from "./context/AchievementContext";

import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";

const queryClient = new QueryClient();

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error?: Error }
> {
  state: { error?: Error } = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Unhandled render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 16, fontFamily: "ui-sans-serif, system-ui" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            App crashed on startup
          </h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{this.state.error.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found. Check frontend/index.html.");
}

createRoot(rootEl).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <ActivityProvider>
              <AchievementProvider>
                <QueryClientProvider client={queryClient}>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <App />
                    </BrowserRouter>
                  </TooltipProvider>
                </QueryClientProvider>
              </AchievementProvider>
            </ActivityProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);