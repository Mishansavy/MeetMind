import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requiredRole }) {
    const { token, user, loading } = useAuth();

    if (loading) return null;
    if (!token) return <Navigate to="/login" replace />;

    if (requiredRole && user?.role !== requiredRole) {
        return <Navigate to={user?.role === "admin" ? "/admin" : "/dashboard"} replace />;
    }

    return children;
}
