import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/components/contexts/auth-provider";

export default function ProtectedRoute() {
  const { user } = useAuth();
  const location = useLocation();

  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}
