import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin has access to everything except maybe guest-only routes? 
  // For now, let's say Admin is "Superuser" but allowedRoles explicit check is safer.
  // Actually, let's just check if user.role is in allowedRoles.
  // OR if user is ADMIN, they might get pass.
  
  const hasAccess = allowedRoles.includes(user.role) || user.role === 'ADMIN';

  if (!hasAccess) {
    return <div style={{ padding: 20, color: "white" }}>Access Denied. Required Role: {allowedRoles.join(", ")}</div>;
  }

  return <Outlet />;
};

export default ProtectedRoute;
