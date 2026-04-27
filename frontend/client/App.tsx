import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminRegister from "./pages/AdminRegister";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Activities from "./pages/Activities";
import ActivityDetail from "./pages/ActivityDetail";
import ActivityForm from "./pages/ActivityForm";
import MyActivities from "./pages/MyActivities";
import Settings from "./pages/Settings";
import Students from "./pages/Students";
import PasswordReset from "./pages/PasswordReset";
import NewPassword from "./pages/NewPassword";
import EmailVerify from "./pages/EmailVerify";
import CategoryManagement from "./pages/CategoryManagement";
import Profile from "./pages/Profile";
import Analytics from "./pages/Analytics";
import ActivitiesCalendar from "./pages/ActivitiesCalendar";
import Broadcast from "./pages/Broadcast";
import Favorites from "./pages/Favorites";
import CheckIn from "./pages/CheckIn";
import Feedback from "./pages/Feedback";
import TagsManagement from "./pages/TagsManagement";
import NotificationSettings from "./pages/NotificationSettings";
import Achievements from "./pages/Achievements";
import AdminRedirect from "./pages/AdminRedirect";
import NotFound from "./pages/NotFound";

// ✅ Safe Dashboard Router
const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (user?.role?.toLowerCase() === "admin") {
    return <AdminDashboard />;
  }

  return <StudentDashboard />;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  return (
    <Routes>
      {/* ✅ Root: redirect if logged in */}
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" /> : <Index />}
      />

      {/* Public Routes */}
      <Route path="/login" element={!loading && user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin-register" element={<AdminRegister />} />
      <Route path="/password-reset" element={<PasswordReset />} />
      <Route path="/new-password" element={<NewPassword />} />
      <Route path="/email-verify" element={<EmailVerify />} />

      {/* Admin Routes */}
      <Route
        path="/categories"
        element={
          <ProtectedRoute requiredRole="admin">
            <CategoryManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute requiredRole="admin">
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/broadcast"
        element={
          <ProtectedRoute requiredRole="admin">
            <Broadcast />
          </ProtectedRoute>
        }
      />
      <Route
        path="/check-in"
        element={
          <ProtectedRoute requiredRole="admin">
            <CheckIn />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tags"
        element={
          <ProtectedRoute requiredRole="admin">
            <TagsManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/students"
        element={
          <ProtectedRoute requiredRole="admin">
            <Students />
          </ProtectedRoute>
        }
      />
      <Route
        path="/redirect"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminRedirect />
          </ProtectedRoute>
        }
      />

      {/* ✅ FIX: Admin route protected */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <Navigate to="/dashboard" />
          </ProtectedRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/feedback/:id"
        element={
          <ProtectedRoute requiredRole="student">
            <Feedback />
          </ProtectedRoute>
        }
      />
      <Route
        path="/achievements"
        element={
          <ProtectedRoute requiredRole="student">
            <Achievements />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-activities"
        element={
          <ProtectedRoute requiredRole="student">
            <MyActivities />
          </ProtectedRoute>
        }
      />
      <Route
        path="/favorites"
        element={
          <ProtectedRoute requiredRole="student">
            <Favorites />
          </ProtectedRoute>
        }
      />

      {/* Shared */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notification-settings"
        element={
          <ProtectedRoute>
            <NotificationSettings />
          </ProtectedRoute>
        }
      />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        }
      />

      {/* Activities */}
      <Route
        path="/activities"
        element={
          <ProtectedRoute>
            <Activities />
          </ProtectedRoute>
        }
      />
      <Route
        path="/activities/calendar"
        element={
          <ProtectedRoute>
            <ActivitiesCalendar />
          </ProtectedRoute>
        }
      />
      <Route
        path="/activities/new"
        element={
          <ProtectedRoute requiredRole="admin">
            <ActivityForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/activities/:id"
        element={
          <ProtectedRoute>
            <ActivityDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/activities/:id/edit"
        element={
          <ProtectedRoute requiredRole="admin">
            <ActivityForm />
          </ProtectedRoute>
        }
      />

      {/* ✅ Better fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => <AppRoutes />;

export default App;