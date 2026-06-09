import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { EventCard } from '../components/Cards.jsx';
import { EventForm } from '../components/Forms.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { isBoss, isManager } from '../utils/roles.js';

export default function EventSelectionPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const canPin = isBoss(user) || isManager(user);
  const load = () => api.get('/events').then((res) => setEvents(res.data));
  useEffect(() => {
    load();
    if (isBoss(user)) api.get('/users').then((res) => setUsers(res.data));
  }, [user]);
  async function createEvent(payload) {
    await api.post('/events', payload);
    setShowForm(false);
    load();
  }
  async function pinEvent(event) {
    if (!canPin) return;
    await api.patch(`/events/${event._id}/pin`, { pinned: !event.isPinnedForMe });
    load();
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-2xl font-bold">Select Event</h2><p className="text-sm text-slate-500">Open an event workspace to manage delivery.</p></div>
        {isBoss(user) && <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">New event</button>}
      </div>
      {showForm && <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><EventForm users={users} onSubmit={createEvent} /></div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{events.map((event) => <EventCard key={event._id} event={event} onPin={pinEvent} canPin={canPin} />)}</div>
    </div>
  );
}
