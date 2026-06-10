import { ChevronLeft, ChevronRight, Edit3, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { StatusBadge } from '../components/Badges.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { isBoss } from '../utils/roles.js';

const emptyPlan = { title: '', description: '', date: '', startTime: '', endTime: '', category: 'Task', status: 'Planned', visibility: 'Personal' };
const categories = ['Task', 'Meeting', 'Reminder', 'Travel', 'Follow Up', 'Personal'];
const statuses = ['Planned', 'In Progress', 'Done', 'Cancelled'];
const visibilities = ['Personal', 'Shared'];

function monthValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(month, amount) {
  const [year, value] = month.split('-').map(Number);
  return monthValue(new Date(year, value - 1 + amount, 1));
}

function dayKey(date) {
  return String(date || '').slice(0, 10);
}

export default function CalendarPage() {
  const { user } = useAuth();
  const [month, setMonth] = useState(monthValue());
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ ...emptyPlan, date: new Date().toISOString().slice(0, 10) });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await api.get(`/calendar-plans?month=${month}`);
    setPlans(data);
  }

  useEffect(() => { load(); }, [month]);

  const grouped = useMemo(() => {
    return plans.reduce((acc, plan) => {
      const key = dayKey(plan.date);
      acc[key] = acc[key] || [];
      acc[key].push(plan);
      return acc;
    }, {});
  }, [plans]);

  const days = useMemo(() => {
    const [year, value] = month.split('-').map(Number);
    const last = new Date(year, value, 0).getDate();
    return Array.from({ length: last }, (_, index) => {
      const day = index + 1;
      return `${year}-${String(value).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    });
  }, [month]);

  function resetForm() {
    setEditing(null);
    setForm({ ...emptyPlan, date: `${month}-01` });
  }

  function startEdit(plan) {
    setEditing(plan);
    setForm({
      title: plan.title,
      description: plan.description || '',
      date: dayKey(plan.date),
      startTime: plan.startTime || '',
      endTime: plan.endTime || '',
      category: plan.category,
      status: plan.status,
      visibility: plan.visibility
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/calendar-plans/${editing._id}`, form);
      else await api.post('/calendar-plans', form);
      resetForm();
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(plan, status) {
    await api.put(`/calendar-plans/${plan._id}`, { status });
    await load();
  }

  async function remove(plan) {
    await api.delete(`/calendar-plans/${plan._id}`);
    await load();
  }

  function canModify(plan) {
    return isBoss(user) || String(plan.createdBy?._id || plan.createdBy) === String(user._id);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="page-title">Calendar</h2>
          <p className="page-subtitle">Plan monthly tasks, reminders, meetings, and personal work.</p>
        </div>
        <div className="grid grid-cols-[auto_1fr_auto] gap-2 sm:w-72">
          <button onClick={() => setMonth(shiftMonth(month, -1))} className="secondary-btn px-3" aria-label="Previous month"><ChevronLeft size={17} /></button>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          <button onClick={() => setMonth(shiftMonth(month, 1))} className="secondary-btn px-3" aria-label="Next month"><ChevronRight size={17} /></button>
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-3 md:p-4">
        <input placeholder="Plan title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
        <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
        <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
        <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>{visibilities.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{statuses.map((item) => <option key={item}>{item}</option>)}</select>
        <textarea className="md:col-span-2" placeholder="Plan details" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-2 md:flex md:items-start">
          <button className="primary-btn" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update plan' : 'Add plan'}</button>
          {editing && <button type="button" onClick={resetForm} className="secondary-btn">Cancel</button>}
        </div>
      </form>

      <div className="grid gap-3 xl:grid-cols-2">
        {days.map((day) => {
          const dayPlans = grouped[day] || [];
          if (!dayPlans.length) return null;
          return (
            <section key={day} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-3">
                <h3 className="font-semibold">{new Date(day).toLocaleDateString(undefined, { day: 'numeric', month: 'short', weekday: 'short' })}</h3>
                <p className="text-xs font-semibold text-slate-500">{dayPlans.length} plan{dayPlans.length === 1 ? '' : 's'}</p>
              </div>
              <div className="mt-3 space-y-3">
                {dayPlans.map((plan) => (
                  <article key={plan._id} className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-1.5">
                          <StatusBadge status={plan.status} />
                          <span className="inline-flex w-fit rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-brand">{plan.category}</span>
                          <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${plan.visibility === 'Shared' ? 'bg-black text-white' : 'bg-slate-100 text-slate-700'}`}>{plan.visibility}</span>
                        </div>
                        <h4 className="mt-2 break-words font-semibold">{plan.title}</h4>
                        {(plan.startTime || plan.endTime) && <p className="mt-1 text-sm text-slate-500">{plan.startTime || 'Any time'}{plan.endTime ? ` - ${plan.endTime}` : ''}</p>}
                      </div>
                      {canModify(plan) && (
                        <div className="flex shrink-0 gap-1">
                          <button onClick={() => startEdit(plan)} className="rounded-lg p-2 text-slate-500 hover:bg-white" title="Edit plan"><Edit3 size={16} /></button>
                          <button onClick={() => remove(plan)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" title="Delete plan"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </div>
                    {plan.description && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{plan.description}</p>}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-slate-500">By {plan.createdBy?.fullName || 'Team'}</p>
                      {canModify(plan) && (
                        <select value={plan.status} onChange={(e) => updateStatus(plan, e.target.value)} className="w-auto min-w-32 py-1.5 text-xs">
                          {statuses.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      {plans.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">No plans for this month yet.</p>}
    </div>
  );
}
