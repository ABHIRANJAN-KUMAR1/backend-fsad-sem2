import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, ArrowLeft, Lock, CheckCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { getJson, setJson } from "@/lib/safeStorage";

export default function NewPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      return;
    }

    // Verify token exists in reset requests
    const resetRequests = getJson<{ email: string; token: string; createdAt: string }[]>(
      "passwordResetRequests",
      [],
    );
    const validRequest = resetRequests.find((r) => r.token === token);
    
    if (validRequest) {
      // Check if token is not expired (24 hours)
      const tokenAge = Date.now() - new Date(validRequest.createdAt).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (tokenAge < maxAge) {
        setIsValidToken(true);
      } else {
        setIsValidToken(false);
        toast.error("Reset link has expired. Please request a new one.");
      }
    } else {
      setIsValidToken(false);
    }
  }, [token]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      // Demo localStorage fallback if backend not ready
      if (!token) throw new Error("No reset token");
      
      const resetRequests = getJson<{ email: string; token: string; createdAt: string }[]>(
        "passwordResetRequests",
        [],
      );
      const validRequest = resetRequests.find((r) => r.token === token);
      
      if (validRequest) {
        const users = getJson<Record<string, unknown>[]>("users", []);
        const userIndex = users.findIndex((u) => (u as any).email === validRequest.email);
        
        if (userIndex !== -1) {
          users[userIndex] = {
            ...users[userIndex],
            password,
            updatedAt: new Date().toISOString(),
          };
          setJson("users", users);
          
          const updatedRequests = resetRequests.filter((r) => r.token !== token);
          setJson("passwordResetRequests", updatedRequests);
          
          toast.success("Password reset successfully!");
          navigate("/login");
        } else {
          toast.error("User not found for this reset link");
        }
      } else {
        toast.error("Invalid or expired reset link");
      }
    } catch (error: any) {
      toast.error(error.message || "Reset failed. Token expired?");
    } finally {
      setIsLoading(false);
    }
  };


  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
        <div className="w-full max-w-md text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (isValidToken === false) {
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
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl text-foreground">Activity Hub Manager</span>
                <span className="text-xs text-muted-foreground">Activity Management</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Invalid Reset Link
            </h1>
            <p className="text-muted-foreground mb-6">
              This reset link is invalid or has expired. Please request a new password reset.
            </p>

            <Button asChild className="w-full">
              <Link to="/password-reset">Request New Reset Link</Link>
            </Button>
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
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Set New Password
            </h1>
            <p className="text-muted-foreground">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* New Password Input */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Confirm New Password
              </label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 mt-6"
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="bg-muted/50 rounded-lg p-3 text-xs">
              <p className="text-muted-foreground">
                <strong>Requirements:</strong> Password must be at least 6 characters long.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
