import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { useAuth } from './context/AuthContext.jsx';
import BossMonitoringDashboard from './pages/BossMonitoringDashboard.jsx';
import ChatPage from './pages/ChatPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import EventSelectionPage from './pages/EventSelectionPage.jsx';
import EventWorkspacePage from './pages/EventWorkspacePage.jsx';
import FirstLoginPage from './pages/FirstLoginPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import UserManagementPage from './pages/UserManagementPage.jsx';
import { isBoss } from './utils/roles.js';

function Protected({ children, bossOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="p-6 text-sm text-slate-500">Loading portal...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if ((user.isFirstLogin || !user.profileCompleted) && location.pathname !== '/first-login') {
    return <Navigate to="/first-login" replace />;
  }
  if (bossOnly && !isBoss(user)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/first-login" element={<Protected><FirstLoginPage /></Protected>} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/events" element={<EventSelectionPage />} />
        <Route path="/events/:id" element={<EventWorkspacePage />} />
        <Route path="/users" element={<Protected bossOnly><UserManagementPage /></Protected>} />
        <Route path="/monitoring" element={<Protected bossOnly><BossMonitoringDashboard /></Protected>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
