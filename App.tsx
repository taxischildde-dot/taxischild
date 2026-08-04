import { Routes, Route, Navigate } from "react-router-dom";
import SetupPage from "./pages/SetupPage";
import DashboardPage from "./pages/DashboardPage";
import TripsPage from "./pages/TripsPage";
import ReportsPage from "./pages/ReportsPage";
import SupportPage from "./pages/SupportPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SetupPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/trips" element={<TripsPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
