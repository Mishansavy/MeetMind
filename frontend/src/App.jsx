import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import PendingApproval from "./pages/PendingApproval";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UserDashboard from "./pages/user/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminMembers from "./pages/admin/Members";
import MeetingNotes from "./pages/user/MeetingNotes";
import Tasks from "./pages/user/Tasks";
import Analytics from "./pages/user/Analytics";
import JoinMeeting from "./pages/user/JoinMeeting";
import MeetingRoom from "./pages/user/MeetingRoom";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="user">
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/notes"
            element={
              <ProtectedRoute requiredRole="user">
                <MeetingNotes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tasks"
            element={
              <ProtectedRoute requiredRole="user">
                <Tasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/analytics"
            element={
              <ProtectedRoute requiredRole="user">
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/join"
            element={
              <ProtectedRoute>
                <JoinMeeting />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/room"
            element={
              <ProtectedRoute>
                <MeetingRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/members"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminMembers />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
