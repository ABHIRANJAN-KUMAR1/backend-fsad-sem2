import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

export const ProtectedRoute = ({
  children,
  requiredRole,
}: ProtectedRouteProps) => {
  const location = useLocation();
  const { isAuthenticated, user, loading } = useAuth(); // ✅ added loading

  // ✅ Prevent flicker / wrong redirect
  if (loading) {
    return <div>Loading...</div>;
  }

  // ✅ Not logged in
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // ✅ Safe role check
  if (
    requiredRole &&
    user.role?.toLowerCase() !== requiredRole.toLowerCase()
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};