import { BarChart3, CalendarDays, LayoutDashboard, LogOut, Menu, MessageCircle, NotebookText, Pin, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isBoss } from '../utils/roles.js';
import { RoleBadge } from './Badges.jsx';
import NotificationPanel from './NotificationPanel.jsx';

function links(user) {
  const base = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/events', label: 'Events', icon: CalendarDays },
    { to: '/notes', label: 'Notes', icon: NotebookText },
    { to: '/chat', label: 'Chat', icon: MessageCircle }
  ];
  if (isBoss(user)) {
    base.push({ to: '/users', label: 'Users', icon: Users }, { to: '/monitoring', label: 'Monitoring', icon: BarChart3 });
  }
  return base;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [pinnedEvent, setPinnedEvent] = useState(null);

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setPinnedEvent(res.data.pinnedEvent || null))
      .catch(() => setPinnedEvent(null));
  }, [location.pathname]);

  const nav = (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white p-4">
      <div className="mb-6">
        <Link to="/dashboard" onClick={() => setOpen(false)} className="block">
          <h1 className="text-lg font-bold leading-5">BPS Event Portal</h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Event Management Portal</p>
        </Link>
        <div className="mt-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold leading-5">{user.fullName}</p>
            <p className="text-xs text-slate-500">{user.department || 'BPS Team'}</p>
          </div>
          <RoleBadge role={user.role} />
        </div>
      </div>
      <nav className="space-y-1">
        {links(user).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-green-50 text-brand' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>
      {pinnedEvent && (
        <Link to={`/events/${pinnedEvent._id}`} onClick={() => setOpen(false)} className="mt-5 block rounded-lg border border-green-100 bg-green-50 p-3 hover:bg-green-100">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-brand">
            <Pin size={14} /> Pinned Event
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">{pinnedEvent.eventName}</p>
          <p className="mt-1 line-clamp-2 text-xs text-slate-600">{pinnedEvent.venue}</p>
        </Link>
      )}
      <button onClick={logout} className="mt-auto flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
        <LogOut size={18} /> Logout
      </button>
    </aside>
  );
  return (
    <div className="min-h-screen lg:flex">
      <div className="hidden lg:block">{nav}</div>
      {open && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setOpen(false)}><div className="h-full" onClick={(e) => e.stopPropagation()}>{nav}</div></div>}
      <main className="min-w-0 flex-1 pb-28 lg:pb-0">
        <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur lg:px-6 lg:py-3">
          <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={21} /></button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800 lg:hidden">{user.fullName}</p>
            <div className="hidden text-sm font-semibold text-slate-600 lg:block">Operations workspace</div>
          </div>
          <NotificationPanel />
        </header>
        <div className="p-3 pb-8 sm:p-4 lg:p-6"><Outlet /></div>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-4 gap-1">
          {links(user).slice(0, 4).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-semibold ${isActive ? 'bg-green-50 text-brand' : 'text-slate-500'}`}>
              <Icon size={19} />
              <span className="max-w-full truncate">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
