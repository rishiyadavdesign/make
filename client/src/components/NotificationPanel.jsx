import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

export default function NotificationPanel() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const load = () => api.get('/notifications').then((res) => setItems(res.data.slice(0, 8))).catch(() => {});
  useEffect(() => {
    load();
    const timer = window.setInterval(() => {
      if (!document.hidden) load();
    }, 10000);
    return () => window.clearInterval(timer);
  }, []);
  async function markRead(item) {
    if (item.isRead) return;
    await api.put(`/notifications/${item._id}`, { isRead: true });
    setItems((current) => current.map((entry) => entry._id === item._id ? { ...entry, isRead: true } : entry));
  }
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative rounded-lg p-2 hover:bg-slate-100" title="Notifications">
        <Bell size={19} />
        {items.some((item) => !item.isRead) && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />}
      </button>
      {open && (
        <div className="fixed left-3 right-3 top-14 z-40 rounded-lg border border-slate-200 bg-white p-3 shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80">
          <h3 className="mb-2 text-sm font-semibold">Notifications</h3>
          <div className="space-y-2">
            {items.length === 0 && <p className="text-sm text-slate-500">No notifications</p>}
            {items.map((item) => (
              <div key={item._id} className={`rounded-lg p-2 ${item.isRead ? 'bg-slate-50' : 'bg-green-50'}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{item.title}</p>
                  {!item.isRead && <button onClick={() => markRead(item)} className="text-xs font-semibold text-brand">Read</button>}
                </div>
                <p className="text-xs text-slate-500">{item.message}</p>
                {item.type === 'Chat' && <Link onClick={() => { markRead(item); setOpen(false); }} to="/chat" className="mt-1 block text-xs font-semibold text-brand">Open chat</Link>}
                {item.type !== 'Chat' && item.eventId?._id && <Link onClick={() => { markRead(item); setOpen(false); }} to={`/events/${item.eventId._id}`} className="mt-1 block text-xs font-semibold text-brand">Open event</Link>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
