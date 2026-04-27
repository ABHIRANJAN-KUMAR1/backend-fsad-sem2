import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, ArrowLeft, Mail, Lock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { capArray, getJson, setJson, MAX_STORED_PASSWORD_RESET_REQUESTS } from "@/lib/safeStorage";

export default function PasswordReset() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleRequestReset = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    // Local demo + backend ready
    const demoToken = `reset_${Date.now()}`;
    const resetRequests = getJson<{ email: string; token: string; createdAt: string }[]>("passwordResetRequests", []);
    const next = capArray([
      { email: email.toLowerCase().trim(), token: demoToken, createdAt: new Date().toISOString() },
      ...resetRequests
    ], MAX_STORED_PASSWORD_RESET_REQUESTS);
    setJson("passwordResetRequests", next);

    setEmailSent(true);
    toast.success(`Reset link ready! Demo redirect: /new-password?token=${demoToken}`);
    
    // Auto redirect for demo
    setTimeout(() => {
      window.location.href = `/new-password?token=${demoToken}`;
    }, 1500);
    
    setIsLoading(false);
  };


  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl text-foreground">Activity Hub Manager</span>
                <span className="text-xs text-muted-foreground">Activity Management</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Check Your Email
            </h1>
            <p className="text-muted-foreground mb-6">
              We've sent a password reset link to <strong>{email}</strong>
            </p>

            <div className="bg-muted/50 rounded-lg p-4 text-sm text-left space-y-2">
              <p className="text-muted-foreground">
                <strong>Note:</strong> In a real application, you would receive an email with a reset link. 
                For this demo, the reset request has been stored.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <Button asChild className="w-full">
                <Link to="/login">Back to Login</Link>
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
              >
                Try Different Email
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md">
        {/* Back to Login */}
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-foreground">Activity Hub Manager</span>
              <span className="text-xs text-muted-foreground">Activity Management</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Reset Password
            </h1>
            <p className="text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleRequestReset} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 mt-6"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="bg-muted/50 rounded-lg p-3 text-xs">
              <p className="text-muted-foreground">
                <strong>Demo:</strong> Enter any email that was used to register an account, 
                and the reset link will be simulated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
