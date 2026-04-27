import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, AuthContextType } from "@/types";
import { authEvents, authApi, usersApi, ApiError } from "@/lib/api";
import {
  setJson,
  safeSetItem,
  safeRemoveItem,
  safeGetItem,
} from "@/lib/safeStorage";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = (safeGetItem("token") || "").trim();
      const isValidLookingToken =
        token.length > 0 && token !== "null" && token !== "undefined";

      if (!isValidLookingToken) {
        safeRemoveItem("token");
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setError(null);
        const userData = await usersApi.getMe();
        setUser(userData);
        setIsAuthenticated(true);
      } catch {
        setUser(null);
        setIsAuthenticated(false);
        safeRemoveItem("token");
        setError("Session expired. Please login again.");
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    // Auto logout when API layer detects 401/invalid token.
    return authEvents.onLogout(() => {
      safeRemoveItem("token");
      safeRemoveItem("currentUser");
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      setError("Session expired. Please login again.");
      // We are outside Router context; use hard redirect.
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    });
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const response = await authApi.login({ email: normalizedEmail, password });
      const { user: userData, token } = response;
      safeSetItem("token", token);
      safeRemoveItem("pendingVerificationEmail");
      setUser(userData);
      setIsAuthenticated(true);
      setError(null);
      return userData;
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Invalid credentials or backend unavailable";
      setError(message);
      throw new Error(message);
    }
  };

  const logout = () => {
    safeRemoveItem("token");
    safeRemoveItem("currentUser");
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  const register = async (
    email: string,
    name: string,
    password: string,
    role?: string,
  ): Promise<{ email: string; message: string }> => {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const response = await authApi.register({ email: normalizedEmail, name, password, role });
      const payload = {
        email: normalizedEmail,
        message: response?.message || "Registration successful. Please verify your email.",
      };
      safeSetItem("pendingVerificationEmail", normalizedEmail);
      setError(null);
      return payload;
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Registration failed. Please check backend server and try again.";
      setError(message);
      throw new Error(message);
    }
  };

  const verifyEmail = async (email: string, otp: string): Promise<boolean> => {
    try {
      await authApi.verifyOtp({ email: email.toLowerCase().trim(), otp });
      safeRemoveItem("pendingVerificationEmail");
      return true;
    } catch {
      return false;
    }
  };

  const resendVerificationCode = async (email: string): Promise<boolean> => {
    try {
      await authApi.resendOtp({ email: email.toLowerCase().trim() });
      return true;
    } catch {
      return false;
    }
  };

  const updateProfile = async (data: { name?: string; email?: string }) => {
    const updatedUser = { ...user!, ...data };
    setUser(updatedUser);
    setJson("currentUser", updatedUser);
    return updatedUser;
  };

  const changePassword = async () => {
    // Implemented for demo
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, register, verifyEmail, resendVerificationCode, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

