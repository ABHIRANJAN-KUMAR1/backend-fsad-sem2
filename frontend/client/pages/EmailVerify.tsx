import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, ArrowLeft, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function EmailVerify() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyEmail, resendVerificationCode } = useAuth();

  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState(searchParams.get("email") || "");

  // Redirect if email context is missing
  useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length !== 6) {
      toast.error("Please enter a valid 6-digit verification code");
      return;
    }

    setIsLoading(true);

    try {
      // ✅ FIX 2: handle async
      const success = await verifyEmail(email, code);

      if (success) {
        toast.success("Email verified successfully!");
        navigate("/login");
      } else {
        toast.error("Invalid verification code. Please try again.");
      }
    } catch (err) {
      toast.error("Verification failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      const success = await resendVerificationCode(email);
      if (success) {
        toast.success("If eligible, a new verification code has been sent.");
      } else {
        toast.error("Unable to resend code right now. Please try again.");
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md">

        {/* Back */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </button>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl">Activity Hub Manager</span>
              <p className="text-xs text-muted-foreground">Activity Management</p>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-8">

          <div className="text-center mb-6">
            <CheckCircle className="w-10 h-10 text-blue-600 mx-auto mb-3" />
            <h1 className="text-2xl font-bold">Verify Your Email</h1>
            <p className="text-muted-foreground">
              Enter the 6-digit code sent to {email}
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="text-center text-lg tracking-widest font-mono"
              maxLength={6}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Verifying..." : "Verify Email"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleResendCode}
              disabled={isResending}
              className="text-blue-600 text-sm flex items-center justify-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isResending ? "animate-spin" : ""}`} />
              {isResending ? "Sending..." : "Resend Code"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}