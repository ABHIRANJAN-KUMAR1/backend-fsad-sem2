import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Users,
  BookOpen,
  Zap,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { useEffect } from "react";

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Navigation Header */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-foreground">Activity Hub Manager</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Login
            </Button>
            <Button onClick={() => navigate("/register")}>Register</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
            Discover & Join Extracurricular{" "}
            <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
              Activities
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with your community, discover new interests, and make the most of
            your college experience. Browse clubs, sports, and events all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/register")} className="gap-2">
              Get Started
              <Zap className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
            <BookOpen className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Browse Activities
            </h3>
            <p className="text-muted-foreground text-sm">
              Discover clubs, sports, and events tailored to your interests with
              powerful search and filtering.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
            <Users className="w-8 h-8 text-green-500 mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Join Community
            </h3>
            <p className="text-muted-foreground text-sm">
              Connect with like-minded students and build lasting friendships through
              shared interests.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
            <BarChart3 className="w-8 h-8 text-purple-500 mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Track Progress
            </h3>
            <p className="text-muted-foreground text-sm">
              Monitor your activity participation and earn badges for your involvement.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-card border border-border rounded-lg p-8 md:p-12 mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Register</h3>
              <p className="text-muted-foreground text-sm">
                Create your student account in seconds
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-bold text-green-600 dark:text-green-400">2</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Browse</h3>
              <p className="text-muted-foreground text-sm">
                Explore activities by category and find what interests you
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">3</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Join</h3>
              <p className="text-muted-foreground text-sm">
                Register for activities and start your journey
              </p>
            </div>
          </div>
        </div>

        {/* For Admins */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg p-8 md:p-12 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">For Administrators</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Manage all activities, track registrations, and get insights with our powerful
            admin dashboard.
          </p>
          <Button
            onClick={() => navigate("/login")}
            variant="outline"
            className="gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Admin Login
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-foreground">Activity Hub Manager</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Activity Hub Manager. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
