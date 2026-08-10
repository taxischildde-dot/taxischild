import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import SetupPage from "./pages/SetupPage";
import DashboardPage from "./pages/DashboardPage";
import TripsPage from "./pages/TripsPage";
import ReportsPage from "./pages/ReportsPage";
import SupportPage from "./pages/SupportPage";
import AuthPage from "./pages/AuthPage";
import DriverDashboardPage from "./pages/DriverDashboardPage";
import { getActiveUser } from "./lib/auth-storage";

type ProtectedRouteProps = { children: JSX.Element; allowedRole?: "owner" | "driver" };

function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [userRole, setUserRole] = useState<"owner" | "driver" | null>(null);

  useEffect(() => {
    const user = getActiveUser();
    setAuthorized(Boolean(user));
    setUserRole(user?.role ?? null);
    setReady(true);
  }, []);

  if (!ready) return null;
  if (!authorized) return <Navigate to="/login" replace />;
  if (allowedRole && userRole !== allowedRole) {
    if (userRole === "driver") return <Navigate to="/driver" replace />;
    if (userRole === "owner") return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/dashboard" element={<ProtectedRoute allowedRole="owner"><DashboardPage /></ProtectedRoute>} />
      <Route path="/driver" element={<ProtectedRoute allowedRole="driver"><DriverDashboardPage /></ProtectedRoute>} />
      <Route path="/fahrten" element={<ProtectedRoute><TripsPage /></ProtectedRoute>} />
      <Route path="/berichte" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
