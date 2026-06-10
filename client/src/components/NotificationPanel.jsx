import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

export default function NotificationPanel() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const unreadCount = items.filter((item) => !item.isRead).length;
  const load = () => api.get('/notifications?limit=30').then((res) => setItems(res.data)).catch(() => {});
  useEffect(() => {
    load();
    const timer = window.setInterval(() => {
      if (!document.hidden) load();
    }, 6000);
    return () => window.clearInterval(timer);
  }, []);

  async function markRead(item) {
    if (item.isRead) return;
    await api.put(`/notifications/${item._id}`, { isRead: true });
    setItems((current) => current.map((entry) => entry._id === item._id ? { ...entry, isRead: true } : entry));
  }

  async function markAllRead() {
    await api.patch('/notifications/read-all');
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
  }

  async function remove(item) {
    await api.delete(`/notifications/${item._id}`);
    setItems((current) => current.filter((entry) => entry._id !== item._id));
  }

  function linkFor(item) {
    if (item.type === 'Chat') return { to: '/chat', label: 'Open chat' };
    if (item.type === 'Calendar') return { to: '/calendar', label: 'Open calendar' };
    if (item.type === 'Note') return { to: '/notes', label: 'Open notes' };
    if (item.eventId?._id) return { to: `/events/${item.eventId._id}`, label: 'Open event' };
    return null;
  }

  function timeAgo(date) {
    const seconds = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative rounded-lg p-2 hover:bg-slate-100" title="Notifications">
        <Bell size={19} />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {open && (
        <div className="fixed left-3 right-3 top-14 z-40 rounded-lg border border-slate-200 bg-white p-3 shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Notifications</h3>
              <p className="text-xs text-slate-500">{unreadCount} unread</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={load} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Refresh</button>
              {unreadCount > 0 && <button onClick={markAllRead} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand hover:bg-green-50"><CheckCheck size={14} /> Read all</button>}
            </div>
          </div>
          <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
            {items.length === 0 && <p className="text-sm text-slate-500">No notifications</p>}
            {items.map((item) => {
              const action = linkFor(item);
              return (
                <div key={item._id} className={`rounded-lg border p-2.5 ${item.isRead ? 'border-slate-100 bg-slate-50' : 'border-green-100 bg-green-50'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold">{item.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{timeAgo(item.createdAt)} · {item.type || 'Info'}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {!item.isRead && <button onClick={() => markRead(item)} className="rounded-lg px-2 py-1 text-xs font-semibold text-brand hover:bg-white">Read</button>}
                      <button onClick={() => remove(item)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-rose-600" title="Delete notification"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{item.message}</p>
                  {action && <Link onClick={() => { markRead(item); setOpen(false); }} to={action.to} className="mt-2 inline-flex text-xs font-semibold text-brand">{action.label}</Link>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
