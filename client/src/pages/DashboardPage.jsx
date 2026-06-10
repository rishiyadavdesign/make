import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { EventCard } from '../components/Cards.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { isBoss, isManager } from '../utils/roles.js';

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const canPin = isBoss(user) || isManager(user);
  const pinnedEvent = summary?.pinnedEvent;
  const activeEvents = events.filter((event) => event.status === 'Active');
  function load() {
    Promise.all([api.get('/dashboard'), api.get('/events')]).then(([dash, ev]) => {
      setSummary(dash.data);
      setEvents(ev.data);
    });
  }
  useEffect(() => {
    load();
  }, []);
  async function pinEvent(event) {
    if (!canPin) return;
    await api.patch(`/events/${event._id}/pin`, { pinned: !event.isPinnedForMe });
    load();
  }
  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Dashboard</h2>
        <p className="page-subtitle">Welcome back, {user.fullName}.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Metric label="Events" value={summary?.events ?? 0} />
        <Metric label="Submissions" value={summary?.submissions ?? 0} />
        <Metric label="Task states" value={summary?.tasks?.reduce((a, b) => a + b.count, 0) ?? 0} />
        <Metric label="Expenses" value={`Rs ${summary?.expenses?.reduce((a, b) => a + (b.amount || 0), 0) ?? 0}`} />
      </div>
      {(pinnedEvent || activeEvents.length > 0) && (
        <section className="rounded-lg border border-green-100 bg-white p-3 shadow-sm sm:p-4">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Main event</h3>
              <p className="text-sm text-slate-500">{pinnedEvent ? 'Pinned for quick access' : 'Active event suggestion'}</p>
            </div>
            {pinnedEvent && <Link to={`/events/${pinnedEvent._id}`} className="primary-btn">Open workspace</Link>}
          </div>
          {pinnedEvent ? (
            <EventCard event={{ ...pinnedEvent, isPinnedForMe: true }} onPin={pinEvent} canPin={canPin} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{activeEvents.slice(0, 3).map((event) => <EventCard key={event._id} event={event} onPin={pinEvent} canPin={canPin} />)}</div>
          )}
        </section>
      )}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Assigned events</h3>
          <Link to="/events" className="text-sm font-semibold text-brand">View all</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{events.slice(0, 4).map((event) => <EventCard key={event._id} event={event} onPin={pinEvent} canPin={canPin} />)}</div>
      </section>
    </div>
  );
}

function Metric({ label, value }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4"><p className="text-xs font-medium text-slate-500 sm:text-sm">{label}</p><p className="mt-2 break-words text-2xl font-bold sm:text-3xl">{value}</p></div>;
}
