import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import SetupPage from "./pages/SetupPage";
import DashboardPage from "./pages/DashboardPage";
import DriverDashboardPage from "./pages/DriverDashboardPage";
import TripsPage from "./pages/TripsPage";
import ReportsPage from "./pages/ReportsPage";
import SupportPage from "./pages/SupportPage";
import AuthPage from "./pages/AuthPage";
import { AccountRole, getActiveUser } from "./lib/auth-storage";

type ProtectedRouteProps = {
  children: JSX.Element;
};

type RoleProtectedRouteProps = {
  children: JSX.Element;
  role: AccountRole | AccountRole[];
};

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    setAuthorized(Boolean(getActiveUser()));
    setReady(true);
  }, []);

  if (!ready) return null;
  return authorized ? children : <Navigate to="/login" replace />;
}

function RoleProtectedRoute({ children, role }: RoleProtectedRouteProps) {
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const user = getActiveUser();
    const allowed = Array.isArray(role) ? role.includes(user?.role ?? "owner") : user?.role === role;
    setAuthorized(Boolean(user) && allowed);
    setReady(true);
  }, [role]);

  if (!ready) return null;
  if (!authorized) {
    const user = getActiveUser();
    return <Navigate to={user?.role === "driver" ? "/driver-dashboard" : "/dashboard"} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/setup" element={<ProtectedRoute><SetupPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<RoleProtectedRoute role="owner"><DashboardPage /></RoleProtectedRoute>} />
      <Route path="/driver-dashboard" element={<RoleProtectedRoute role="driver"><DriverDashboardPage /></RoleProtectedRoute>} />
      <Route path="/trips" element={<RoleProtectedRoute role="owner"><TripsPage /></RoleProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
