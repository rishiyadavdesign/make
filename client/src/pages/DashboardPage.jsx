import { CalendarDays, ClipboardList, IndianRupee, MapPin, MessageCircle, NotebookText, Pin, Send, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { EventCard } from '../components/Cards.jsx';
import { StatusBadge } from '../components/Badges.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { isBoss, isManager } from '../utils/roles.js';

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const canPin = isBoss(user) || isManager(user);
  const pinnedEvent = summary?.pinnedEvent;
  const activeEvents = events.filter((event) => event.status === 'Active');
  const taskCount = summary?.tasks?.reduce((a, b) => a + b.count, 0) ?? 0;
  const expenseAmount = summary?.expenses?.reduce((a, b) => a + (b.amount || 0), 0) ?? 0;
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
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-lg border border-green-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}</p>
            <h2 className="mt-1 text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">Dashboard</h2>
            <p className="mt-1 text-sm text-slate-500">Welcome back, {user.fullName}.</p>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap">
            <QuickLink to="/events" icon={CalendarDays} label="Events" />
            <QuickLink to="/calendar" icon={CalendarDays} label="Calendar" />
            <QuickLink to="/chat" icon={MessageCircle} label="Chat" />
            <QuickLink to="/notes" icon={NotebookText} label="Notes" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        <Metric label="Events" value={summary?.events ?? 0} icon={CalendarDays} />
        <Metric label="Submissions" value={summary?.submissions ?? 0} icon={Send} />
        <Metric label="Tasks" value={taskCount} icon={ClipboardList} />
        <Metric label="Expenses" value={`Rs ${expenseAmount}`} icon={IndianRupee} />
      </div>
      {(pinnedEvent || activeEvents.length > 0) && (
        <section className="rounded-lg border border-green-100 bg-green-50/50 p-3 shadow-sm sm:p-4">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-950">Main event</h3>
              <p className="text-sm text-slate-500">{pinnedEvent ? 'Pinned for quick access' : 'Active event suggestion'}</p>
            </div>
            {pinnedEvent && <Link to={`/events/${pinnedEvent._id}`} className="primary-btn">Open workspace</Link>}
          </div>
          {pinnedEvent ? (
            <PinnedEventCard event={{ ...pinnedEvent, isPinnedForMe: true }} onPin={pinEvent} canPin={canPin} />
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
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{events.slice(0, 4).map((event) => <CompactEventCard key={event._id} event={event} onPin={pinEvent} canPin={canPin} />)}</div>
      </section>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
      <Icon size={16} /> <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-500 sm:text-sm">{label}</p>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-brand"><Icon size={17} /></span>
      </div>
      <p className="mt-3 break-words text-2xl font-bold leading-none sm:text-3xl">{value}</p>
    </div>
  );
}

function PinnedEventCard({ event, onPin, canPin }) {
  return (
    <article className="rounded-lg border border-brand bg-white p-3 shadow-sm ring-2 ring-green-100 sm:p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <Link to={`/events/${event._id}`} className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status="Pinned" />
            <StatusBadge status={event.status} />
          </div>
          <h4 className="mt-3 break-words text-xl font-bold leading-tight text-slate-950">{event.eventName}</h4>
          <p className="mt-1 text-sm text-slate-500">{event.clientName}</p>
          <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
            <Info icon={CalendarDays} text={new Date(event.date).toLocaleDateString()} />
            <Info icon={MapPin} text={event.venue} />
            <Info icon={UserRound} text={event.assignedManager?.fullName || 'Unassigned'} />
          </div>
        </Link>
        <div className="grid grid-cols-2 gap-2 sm:flex lg:flex-col">
          <Link to={`/events/${event._id}`} className="primary-btn">Open</Link>
          {canPin && <button onClick={() => onPin?.(event)} className="secondary-btn"><Pin size={15} /> Unpin</button>}
        </div>
      </div>
    </article>
  );
}

function CompactEventCard({ event, onPin, canPin }) {
  return (
    <article className={`rounded-lg border bg-white p-3 shadow-sm ${event.isPinnedForMe ? 'border-brand ring-2 ring-green-100' : 'border-slate-200'}`}>
      <Link to={`/events/${event._id}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <h4 className="min-w-0 break-words text-base font-bold leading-5 text-slate-950">{event.eventName}</h4>
          <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
            {event.isPinnedForMe && <StatusBadge status="Pinned" />}
            <StatusBadge status={event.status} />
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-500">{event.clientName}</p>
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          <Info icon={CalendarDays} text={new Date(event.date).toLocaleDateString()} />
          <Info icon={MapPin} text={event.venue} />
        </div>
      </Link>
      {canPin && <button onClick={() => onPin?.(event)} className="secondary-btn mt-3 w-full"><Pin size={14} /> {event.isPinnedForMe ? 'Unpin' : 'Pin main'}</button>}
    </article>
  );
}

function Info({ icon: Icon, text }) {
  return <p className="flex min-w-0 items-center gap-2"><Icon className="shrink-0 text-slate-500" size={16} /> <span className="min-w-0 truncate">{text}</span></p>;
}
