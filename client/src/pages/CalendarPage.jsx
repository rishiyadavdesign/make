import { ChevronLeft, ChevronRight, Edit3, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { StatusBadge } from '../components/Badges.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { isBoss } from '../utils/roles.js';

const emptyPlan = { title: '', description: '', date: '', startTime: '', endTime: '', category: 'Task', status: 'Planned', visibility: 'Personal' };
const categories = ['Task', 'Meeting', 'Reminder', 'Travel', 'Follow Up', 'Personal'];
const statuses = ['Planned', 'In Progress', 'Done', 'Cancelled'];
const visibilities = ['Personal', 'Shared'];
const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const longPressTimer = useRef(null);

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

  const calendarCells = useMemo(() => {
    const [year, value] = month.split('-').map(Number);
    const firstDay = new Date(year, value - 1, 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const blanks = Array.from({ length: mondayOffset }, (_, index) => ({ key: `blank-start-${index}`, date: null }));
    const activeDays = days.map((date) => ({ key: date, date }));
    const total = blanks.length + activeDays.length;
    const endBlanks = Array.from({ length: (7 - (total % 7)) % 7 }, (_, index) => ({ key: `blank-end-${index}`, date: null }));
    return [...blanks, ...activeDays, ...endBlanks];
  }, [days, month]);

  function resetForm() {
    setEditing(null);
    setIsFormOpen(false);
    setForm({ ...emptyPlan, date: `${month}-01` });
  }

  function openCreate(date = form.date || `${month}-01`) {
    setEditing(null);
    setForm({ ...emptyPlan, date });
    setIsFormOpen(true);
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
    setIsFormOpen(true);
  }

  function startLongPress(date) {
    window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => openCreate(date), 550);
  }

  function clearLongPress() {
    window.clearTimeout(longPressTimer.current);
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

      <div className="flex flex-col gap-2 rounded-lg border border-green-100 bg-green-50 p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-700">Tap a date to select it. Long-press a date to add a plan.</p>
        <button type="button" onClick={() => openCreate(form.date)} className="primary-btn">Add plan</button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="w-full">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {weekdays.map((day) => <div key={day} className="px-1 py-2 text-center text-[9px] font-bold text-slate-500 sm:px-3 sm:text-[11px]">{day}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {calendarCells.map((cell) => {
              const dayPlans = cell.date ? grouped[cell.date] || [] : [];
              const isToday = cell.date === new Date().toISOString().slice(0, 10);
              const isSelected = cell.date === form.date;
              if (!cell.date) return <div key={cell.key} className="min-h-20 border-b border-r border-slate-100 bg-slate-50/60 sm:min-h-32" />;
              const dateObj = new Date(cell.date);
              const dayNumber = dateObj.getDate();
              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, date: cell.date }))}
                  onPointerDown={() => startLongPress(cell.date)}
                  onPointerUp={clearLongPress}
                  onPointerLeave={clearLongPress}
                  onPointerCancel={clearLongPress}
                  onContextMenu={(e) => { e.preventDefault(); openCreate(cell.date); }}
                  className={`min-h-20 touch-manipulation border-b border-r border-slate-100 p-1 text-left align-top hover:bg-green-50/40 sm:min-h-32 sm:p-2 ${isSelected ? 'outline outline-2 -outline-offset-2 outline-brand' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-bold sm:text-sm ${isToday ? 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white sm:h-7 sm:w-7' : 'text-slate-700'}`}>{dayNumber}</span>
                    {dayPlans.length > 0 && <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 sm:px-2 sm:text-[10px]">{dayPlans.length}</span>}
                  </div>
                  <div className="mt-1 space-y-1 sm:mt-2">
                    {dayPlans.slice(0, 2).map((plan) => (
                      <div key={plan._id} className={`rounded px-1 py-0.5 text-[9px] font-semibold leading-3 sm:rounded-md sm:px-2 sm:py-1 sm:text-[11px] sm:leading-4 ${plan.status === 'Done' ? 'bg-green-100 text-green-800' : plan.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                        <p className="truncate">{plan.startTime ? `${plan.startTime} ` : ''}{plan.title}</p>
                      </div>
                    ))}
                    {dayPlans.length > 2 && <p className="text-[9px] font-semibold text-slate-500 sm:text-[11px]">+{dayPlans.length - 2}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-40 flex items-end bg-slate-950/40 p-0 sm:items-center sm:p-4" onClick={resetForm}>
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl sm:mx-auto sm:max-w-3xl sm:rounded-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-950">{editing ? 'Edit plan' : 'Add plan'}</h3>
                <p className="text-sm text-slate-500">{form.date ? new Date(form.date).toLocaleDateString() : 'Select a date'}</p>
              </div>
              <button type="button" onClick={resetForm} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50">Close</button>
            </div>
            <form onSubmit={submit} className="grid gap-3 md:grid-cols-3">
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
                <button type="button" onClick={resetForm} className="secondary-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-normal text-slate-500">Plan details</h3>
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
      </div>
      {plans.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">No plans for this month yet.</p>}
    </div>
  );
}
