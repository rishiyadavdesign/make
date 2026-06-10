import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { isBoss } from './utils/roles.js';

const BossMonitoringDashboard = lazy(() => import('./pages/BossMonitoringDashboard.jsx'));
const CalendarPage = lazy(() => import('./pages/CalendarPage.jsx'));
const ChatPage = lazy(() => import('./pages/ChatPage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const EventSelectionPage = lazy(() => import('./pages/EventSelectionPage.jsx'));
const EventWorkspacePage = lazy(() => import('./pages/EventWorkspacePage.jsx'));
const FirstLoginPage = lazy(() => import('./pages/FirstLoginPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const NotesPage = lazy(() => import('./pages/NotesPage.jsx'));
const UserManagementPage = lazy(() => import('./pages/UserManagementPage.jsx'));

function PageLoader() {
  return <div className="p-6 text-sm text-slate-500">Loading page...</div>;
}

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
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/first-login" element={<Protected><FirstLoginPage /></Protected>} />
        <Route element={<Protected><Layout /></Protected>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/events" element={<EventSelectionPage />} />
          <Route path="/events/:id" element={<EventWorkspacePage />} />
          <Route path="/users" element={<Protected bossOnly><UserManagementPage /></Protected>} />
          <Route path="/monitoring" element={<Protected bossOnly><BossMonitoringDashboard /></Protected>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
