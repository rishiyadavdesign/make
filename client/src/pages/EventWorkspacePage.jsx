import { CheckSquare, ClipboardList, FileUp, IndianRupee, Info, NotebookText, PenLine, Pin, ShieldCheck, Trash2, Wrench } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { StatusBadge } from '../components/Badges.jsx';
import { EquipmentCard, TaskCard } from '../components/Cards.jsx';
import { EquipmentForm, EventForm, TaskForm } from '../components/Forms.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { isBoss, isManager, isMember } from '../utils/roles.js';

const tabs = [
  ['overview', 'Overview', Info],
  ['tasks', 'Tasks', ClipboardList],
  ['equipment', 'Equipment', Wrench],
  ['responsibilities', 'Responsibilities', ShieldCheck],
  ['checklist', 'Checklist', CheckSquare],
  ['notes', 'Notes', NotebookText],
  ['submissions', 'Submissions', FileUp],
  ['expenses', 'Expenses', IndianRupee]
];

function toPayload(payload) {
  if (!payload?.files?.length) {
    const clean = { ...payload };
    if (typeof clean.referenceLinks === 'string') {
      clean.referenceLinks = clean.referenceLinks.split('\n').map((link) => link.trim()).filter(Boolean);
    }
    delete clean.files;
    return clean;
  }
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'files') {
      value.forEach((file) => formData.append('files', file));
      return;
    }
    if (key === 'referenceLinks' && typeof value === 'string') {
      value.split('\n').map((link) => link.trim()).filter(Boolean).forEach((link) => formData.append('referenceLinks', link));
      return;
    }
    if (Array.isArray(value)) value.forEach((item) => formData.append(key, item));
    else if (value !== undefined && value !== null) formData.append(key, value);
  });
  return formData;
}

function fileUrl(file) {
  if (/^https?:\/\//i.test(file.path)) return file.path;
  const base = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
  return `${base}/${file.path}`;
}

export default function EventWorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [editingEvent, setEditingEvent] = useState(false);
  const [event, setEvent] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [data, setData] = useState({ tasks: [], equipment: [], responsibilities: [], checklist: [], notes: [], submissions: [], expenses: [] });
  const team = useMemo(() => event ? [event.assignedManager, ...(event.teamMembers || [])].filter(Boolean) : [], [event]);
  const eventMembers = useMemo(() => event?.teamMembers || [], [event]);
  const canManage = !isMember(user);
  const canPin = isBoss(user) || isManager(user);

  async function load() {
    const [ev, tasks, equipment, responsibilities, checklist, notes, submissions, expenses] = await Promise.all([
      api.get(`/events/${id}`),
      api.get(`/tasks?eventId=${id}`),
      api.get(`/equipment?eventId=${id}`),
      api.get(`/responsibilities?eventId=${id}`),
      api.get(`/checklist?eventId=${id}`),
      api.get(`/notes?eventId=${id}`),
      api.get(`/submissions?eventId=${id}`),
      api.get(`/expenses?eventId=${id}`)
    ]);
    setEvent(ev.data);
    setData({ tasks: tasks.data, equipment: equipment.data, responsibilities: responsibilities.data, checklist: checklist.data, notes: notes.data, submissions: submissions.data, expenses: expenses.data });
    if (isBoss(user)) {
      api.get('/users').then((res) => setAllUsers(res.data)).catch(() => setAllUsers([]));
    }
  }
  useEffect(() => { load(); }, [id]);

  const create = (resource) => async (payload) => {
    await api.post(`/${resource}`, toPayload(payload));
    load();
  };
  const update = (resource) => async (itemId, payload) => {
    await api.put(`/${resource}/${itemId}`, payload);
    load();
  };
  const remove = (resource) => async (itemId) => {
    await api.delete(`/${resource}/${itemId}`);
    load();
  };
  async function saveEvent(payload) {
    const {
      eventName,
      clientName,
      date,
      venue,
      reportingTime,
      description,
      status,
      assignedManager,
      teamMembers,
      importantInstructions
    } = payload;
    await api.put(`/events/${id}`, { eventName, clientName, date, venue, reportingTime, description, status, assignedManager, teamMembers, importantInstructions });
    setEditingEvent(false);
    load();
  }
  async function deleteEvent() {
    await api.delete(`/events/${id}`);
    navigate('/events');
  }
  async function pinEvent() {
    if (!canPin) return;
    await api.patch(`/events/${id}/pin`, { pinned: !event.isPinnedForMe });
    load();
  }

  if (!event) return <div className="text-sm text-slate-500">Loading event workspace...</div>;
  return (
    <div className="space-y-3 pb-4 sm:space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 className="break-words text-[1.35rem] font-bold leading-tight text-slate-950 sm:text-2xl">{event.eventName}</h2>
            <p className="mt-1 break-words text-sm leading-5 text-slate-500">{event.clientName} - {event.venue}</p>
          </div>
          <div className="space-y-2 lg:flex lg:flex-wrap lg:items-center lg:justify-end lg:gap-2 lg:space-y-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={event.status} />
              {event.isPinnedForMe && <StatusBadge status="Pinned" />}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {canPin && <button onClick={pinEvent} className="secondary-btn min-h-11"><Pin size={16} /> {event.isPinnedForMe ? 'Unpin' : 'Pin main'}</button>}
              {canManage && <button onClick={() => setEditingEvent(!editingEvent)} className="secondary-btn">Edit</button>}
              {isBoss(user) && <button onClick={deleteEvent} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white">Delete</button>}
            </div>
          </div>
        </div>
        <div className="hide-scrollbar -mx-3 mt-4 flex snap-x gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
          {tabs.map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)} className={`flex min-h-10 min-w-[6.6rem] shrink-0 snap-start items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${tab === key ? 'bg-green-50 text-brand' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
      </div>

      {editingEvent && <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><EventForm users={isBoss(user) ? allUsers : team} initial={{ ...event, assignedManager: event.assignedManager?._id || '', teamMembers: (event.teamMembers || []).map((u) => u._id) }} onSubmit={saveEvent} /></div>}
      {tab === 'overview' && <Overview event={event} team={team} canManage={isBoss(user)} reload={load} />}
      {tab === 'tasks' && <Tasks tasks={data.tasks} team={eventMembers} user={user} canManage={canManage} eventId={id} create={create('tasks')} update={update('tasks')} remove={remove('tasks')} onManageTeam={() => setEditingEvent(true)} />}
      {tab === 'equipment' && <Equipment items={data.equipment} team={eventMembers} canManage={canManage} eventId={id} create={create('equipment')} update={update('equipment')} remove={remove('equipment')} onManageTeam={() => setEditingEvent(true)} />}
      {tab === 'responsibilities' && <SimpleManager title="Responsibilities" resource="responsibilities" items={data.responsibilities} team={eventMembers} eventId={id} canManage={canManage} reload={load} onManageTeam={() => setEditingEvent(true)} />}
      {tab === 'checklist' && <Checklist items={data.checklist} team={eventMembers} eventId={id} canManage={canManage} reload={load} onManageTeam={() => setEditingEvent(true)} />}
      {tab === 'notes' && <Notes items={data.notes} eventId={id} canManage={canManage} reload={load} />}
      {tab === 'submissions' && <Submissions items={data.submissions} tasks={data.tasks} eventId={id} user={user} canReview={canManage || isBoss(user)} canManage={canManage} reload={load} />}
      {tab === 'expenses' && <Expenses items={data.expenses} eventId={id} user={user} canReview={isBoss(user)} reload={load} />}
    </div>
  );
}

function Expenses({ items, eventId, user, canReview, reload }) {
  const empty = { eventId, title: '', category: 'Travel', amount: '', spentOn: '', paymentMode: 'Cash', description: '', files: [] };
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const totalSubmitted = items.filter((item) => ['Submitted', 'Revision Required'].includes(item.status)).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalApproved = items.filter((item) => ['Approved', 'Paid'].includes(item.status)).reduce((sum, item) => sum + Number(item.amount || 0), 0);

  function startEdit(item) {
    setEditing(item);
    setForm({
      eventId,
      title: item.title,
      category: item.category,
      amount: item.amount,
      spentOn: String(item.spentOn || '').slice(0, 10),
      paymentMode: item.paymentMode,
      description: item.description || '',
      files: []
    });
  }

  async function submit(e) {
    e.preventDefault();
    const payload = toPayload(form);
    if (editing) await api.put(`/expenses/${editing._id}`, payload);
    else await api.post('/expenses', payload);
    setEditing(null);
    setForm(empty);
    e.currentTarget.reset();
    reload();
  }

  async function review(item, status) {
    const feedback = window.prompt(`${status} feedback`, status === 'Approved' ? 'Approved for reimbursement.' : status === 'Paid' ? 'Paid.' : 'Please update bill/details.');
    if (feedback === null) return;
    await api.patch(`/expenses/${item._id}/review`, { status, feedback });
    reload();
  }

  async function remove(item) {
    await api.delete(`/expenses/${item._id}`);
    reload();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4"><p className="text-sm text-slate-500">Pending / revision amount</p><p className="mt-2 text-2xl font-bold">Rs {totalSubmitted}</p></div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4"><p className="text-sm text-slate-500">Approved / paid amount</p><p className="mt-2 text-2xl font-bold">Rs {totalApproved}</p></div>
      </div>
      {!canReview && (
        <form onSubmit={submit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-3 md:p-4">
          <input placeholder="Expense title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{['Travel', 'Food', 'Accommodation', 'Equipment', 'Vendor', 'Fuel', 'Other'].map((item) => <option key={item}>{item}</option>)}</select>
          <input type="number" min="0" step="0.01" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <input type="date" value={form.spentOn} onChange={(e) => setForm({ ...form, spentOn: e.target.value })} required />
          <select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}>{['Cash', 'UPI', 'Card', 'Bank Transfer', 'Other'].map((item) => <option key={item}>{item}</option>)}</select>
          <input type="file" multiple onChange={(e) => setForm({ ...form, files: [...e.target.files] })} />
          <textarea className="md:col-span-2" placeholder="Description / bill details" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-2 md:flex">
            <button className="primary-btn">{editing ? 'Update expense' : 'Submit expense'}</button>
            {editing && <button type="button" onClick={() => { setEditing(null); setForm(empty); }} className="secondary-btn">Cancel</button>}
          </div>
        </form>
      )}
      <div className="grid gap-3 lg:grid-cols-2">
        {items.map((item) => (
          <div key={item._id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.submittedBy?.fullName} - {item.category} - {item.paymentMode}</p>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <p className="mt-3 text-2xl font-bold">Rs {item.amount}</p>
            <p className="mt-1 text-sm text-slate-600">{item.description}</p>
            {item.receipts?.length > 0 && <div className="mt-2 text-sm">{item.receipts.map((file) => <a key={file.path} href={fileUrl(file)} target="_blank" rel="noreferrer" className="block text-brand hover:underline">{file.filename}</a>)}</div>}
            {item.feedback && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-sm text-slate-600">{item.feedback}</p>}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {!canReview && String(item.submittedBy?._id || item.submittedBy) === String(user._id) && ['Draft', 'Submitted', 'Revision Required', 'Rejected'].includes(item.status) && <button onClick={() => startEdit(item)} className="secondary-btn text-brand">Edit</button>}
              {!canReview && String(item.submittedBy?._id || item.submittedBy) === String(user._id) && ['Draft', 'Submitted', 'Revision Required', 'Rejected'].includes(item.status) && <button onClick={() => remove(item)} className="secondary-btn border-rose-200 text-rose-600">Delete</button>}
              {canReview && <button onClick={() => review(item, 'Approved')} className="primary-btn">Approve</button>}
              {canReview && <button onClick={() => review(item, 'Revision Required')} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white">Revision</button>}
              {canReview && <button onClick={() => review(item, 'Rejected')} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white">Reject</button>}
              {canReview && ['Approved'].includes(item.status) && <button onClick={() => review(item, 'Paid')} className="primary-btn">Mark paid</button>}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-500">No expenses submitted yet.</p>}
      </div>
    </div>
  );
}

function Overview({ event, team, canManage, reload }) {
  const emptyDetail = { category: 'Travel', title: '', dateTime: '', location: '', assignedTo: '', description: '' };
  const emptyTrialRow = { center: '', venue: '', locationUrl: '', dcaRep: '', contactNumber: '', trialDates: '', trialCodes: '', days: '' };
  const [form, setForm] = useState(emptyDetail);
  const [trialForm, setTrialForm] = useState(emptyTrialRow);
  const [editingDetailId, setEditingDetailId] = useState(null);
  const [editingTrialId, setEditingTrialId] = useState(null);
  const [saving, setSaving] = useState(false);
  const details = event.overviewDetails || [];
  const trialDetails = event.trialDetails || [];

  function cleanDetails(items) {
    return items.map((item) => ({
      _id: item._id,
      category: item.category || 'Travel',
      title: item.title,
      dateTime: item.dateTime || '',
      location: item.location || '',
      assignedTo: item.assignedTo?._id || item.assignedTo || undefined,
      description: item.description || ''
    }));
  }

  async function saveDetails(nextDetails) {
    setSaving(true);
    try {
      await api.put(`/events/${event._id}`, { overviewDetails: cleanDetails(nextDetails) });
      await reload();
    } finally {
      setSaving(false);
    }
  }

  function cleanTrialRows(items) {
    return items.map((item) => ({
      _id: item._id,
      center: item.center,
      venue: item.venue || '',
      locationUrl: item.locationUrl || '',
      dcaRep: item.dcaRep || '',
      contactNumber: item.contactNumber || '',
      trialDates: item.trialDates || '',
      trialCodes: item.trialCodes || '',
      days: item.days || ''
    }));
  }

  async function saveTrialRows(nextRows) {
    setSaving(true);
    try {
      await api.put(`/events/${event._id}`, { trialDetails: cleanTrialRows(nextRows) });
      await reload();
    } finally {
      setSaving(false);
    }
  }

  async function submitDetail(e) {
    e.preventDefault();
    const next = {
      ...form,
      title: form.title.trim(),
      location: form.location.trim(),
      description: form.description.trim()
    };
    if (!next.title) return;
    if (editingDetailId) {
      await saveDetails(details.map((detail) => String(detail._id) === String(editingDetailId) ? { ...detail, ...next, _id: detail._id } : detail));
      setEditingDetailId(null);
    } else {
      await saveDetails([...details, next]);
    }
    setForm(emptyDetail);
  }

  function editDetail(detail) {
    setEditingDetailId(detail._id);
    setForm({
      category: detail.category || 'Travel',
      title: detail.title || '',
      dateTime: detail.dateTime || '',
      location: detail.location || '',
      assignedTo: detail.assignedTo?._id || detail.assignedTo || '',
      description: detail.description || ''
    });
  }

  function cancelEdit() {
    setEditingDetailId(null);
    setForm(emptyDetail);
  }

  async function removeDetail(detailId) {
    if (String(editingDetailId) === String(detailId)) cancelEdit();
    await saveDetails(details.filter((detail) => String(detail._id) !== String(detailId)));
  }

  async function submitTrialRow(e) {
    e.preventDefault();
    const next = Object.fromEntries(Object.entries(trialForm).map(([key, value]) => [key, String(value || '').trim()]));
    if (!next.center) return;
    if (editingTrialId) {
      await saveTrialRows(trialDetails.map((row) => String(row._id) === String(editingTrialId) ? { ...row, ...next, _id: row._id } : row));
      setEditingTrialId(null);
    } else {
      await saveTrialRows([...trialDetails, next]);
    }
    setTrialForm(emptyTrialRow);
  }

  function editTrialRow(row) {
    setEditingTrialId(row._id);
    setTrialForm({
      center: row.center || '',
      venue: row.venue || '',
      locationUrl: row.locationUrl || '',
      dcaRep: row.dcaRep || '',
      contactNumber: row.contactNumber || '',
      trialDates: row.trialDates || '',
      trialCodes: row.trialCodes || '',
      days: row.days || ''
    });
  }

  function cancelTrialEdit() {
    setEditingTrialId(null);
    setTrialForm(emptyTrialRow);
  }

  async function removeTrialRow(rowId) {
    if (String(editingTrialId) === String(rowId)) cancelTrialEdit();
    await saveTrialRows(trialDetails.filter((row) => String(row._id) !== String(rowId)));
  }

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4 lg:col-span-2">
        <h3 className="font-semibold">Event details</h3>
        <p className="mt-3 text-sm text-slate-600">{event.description}</p>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <InfoRow label="Date" value={new Date(event.date).toLocaleDateString()} />
          <InfoRow label="Reporting time" value={event.reportingTime || 'Not set'} />
          <InfoRow label="Venue" value={event.venue} />
          <InfoRow label="Instructions" value={event.importantInstructions || 'No instructions'} />
        </dl>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <h3 className="font-semibold">Team</h3>
        <div className="mt-3 space-y-3">
          {event.assignedManager && (
            <div className="rounded-lg border border-green-100 bg-green-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-normal text-brand">Project Manager</p>
              <p className="mt-1 text-sm font-semibold">{event.assignedManager.fullName}</p>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">Team Members</p>
            {(event.teamMembers || []).map((person) => (
              <div key={person._id} className="rounded-lg bg-slate-50 p-3">
                <p className="text-sm font-medium">{person.fullName}</p>
                <p className="text-xs text-slate-500">{person.department || person.role}</p>
              </div>
            ))}
            {(event.teamMembers || []).length === 0 && <p className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500">No team members assigned.</p>}
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4 lg:col-span-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Overview cards</h3>
            <p className="text-sm text-slate-500">Travel, reporting, parking, vendor, and other event details.</p>
          </div>
        </div>

        {canManage && (
          <form onSubmit={submitDetail} className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-3">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {['Travel', 'Hotel', 'Reporting', 'Vendor', 'Contact', 'Parking', 'Other'].map((item) => <option key={item}>{item}</option>)}
            </select>
            <input placeholder="Title, e.g. Team bus pickup" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <input placeholder="Time / date, e.g. 6:30 AM" value={form.dateTime} onChange={(e) => setForm({ ...form, dateTime: e.target.value })} />
            <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
              <option value="">No assigned person</option>
              {team.map((person) => <option key={person._id} value={person._id}>{person.fullName}</option>)}
            </select>
            <textarea className="md:col-span-2" placeholder="Details / instructions" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-2 md:flex md:self-start">
              <button className="primary-btn" disabled={saving}>{saving ? 'Saving...' : editingDetailId ? 'Update card' : 'Add card'}</button>
              {editingDetailId && <button type="button" onClick={cancelEdit} className="secondary-btn">Cancel</button>}
            </div>
          </form>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {details.map((detail) => (
            <div key={detail._id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-brand">{detail.category}</span>
                  <h4 className="mt-2 break-words font-semibold text-slate-950">{detail.title}</h4>
                </div>
                {canManage && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => editDetail(detail)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-50" title="Edit card"><PenLine size={16} /></button>
                    <button onClick={() => removeDetail(detail._id)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" title="Remove card"><Trash2 size={16} /></button>
                  </div>
                )}
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                {detail.dateTime && <InfoRow label="Time" value={detail.dateTime} />}
                {detail.location && <InfoRow label="Location" value={detail.location} />}
                {detail.assignedTo && <InfoRow label="Assigned to" value={detail.assignedTo.fullName || 'Assigned'} />}
              </dl>
              {detail.description && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{detail.description}</p>}
            </div>
          ))}
          {details.length === 0 && <p className="text-sm text-slate-500">No extra overview cards yet.</p>}
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4 lg:col-span-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Trial dates venue code initials</h3>
            <p className="text-sm text-slate-500">Center-wise venue, map, contact, trial dates, codes, and days.</p>
          </div>
        </div>

        {canManage && (
          <form onSubmit={submitTrialRow} className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-4">
            <input placeholder="Center" value={trialForm.center} onChange={(e) => setTrialForm({ ...trialForm, center: e.target.value })} required />
            <input placeholder="Venue" value={trialForm.venue} onChange={(e) => setTrialForm({ ...trialForm, venue: e.target.value })} />
            <input placeholder="Google map / location link" value={trialForm.locationUrl} onChange={(e) => setTrialForm({ ...trialForm, locationUrl: e.target.value })} />
            <input placeholder="DCA rep" value={trialForm.dcaRep} onChange={(e) => setTrialForm({ ...trialForm, dcaRep: e.target.value })} />
            <input placeholder="Contact number" value={trialForm.contactNumber} onChange={(e) => setTrialForm({ ...trialForm, contactNumber: e.target.value })} />
            <input placeholder="Trial dates, e.g. 14 - 15 June" value={trialForm.trialDates} onChange={(e) => setTrialForm({ ...trialForm, trialDates: e.target.value })} />
            <input placeholder="Trial codes, e.g. GZ-01, GZ-02" value={trialForm.trialCodes} onChange={(e) => setTrialForm({ ...trialForm, trialCodes: e.target.value })} />
            <input placeholder="Days" value={trialForm.days} onChange={(e) => setTrialForm({ ...trialForm, days: e.target.value })} />
            <div className="grid grid-cols-2 gap-2 md:col-span-4 md:flex">
              <button className="primary-btn" disabled={saving}>{saving ? 'Saving...' : editingTrialId ? 'Update row' : 'Add row'}</button>
              {editingTrialId && <button type="button" onClick={cancelTrialEdit} className="secondary-btn">Cancel</button>}
            </div>
          </form>
        )}

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full border-collapse bg-white text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="border-b border-slate-200 px-3 py-3">Center</th>
                  <th className="border-b border-slate-200 px-3 py-3">Venue</th>
                  <th className="border-b border-slate-200 px-3 py-3">Location</th>
                  <th className="border-b border-slate-200 px-3 py-3">DCA Rep</th>
                  <th className="border-b border-slate-200 px-3 py-3">Contact Number</th>
                  <th className="border-b border-slate-200 px-3 py-3">Trial Dates</th>
                  <th className="border-b border-slate-200 px-3 py-3">Trial Codes</th>
                  <th className="border-b border-slate-200 px-3 py-3">Days</th>
                  {canManage && <th className="border-b border-slate-200 px-3 py-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody>
                {trialDetails.map((row) => (
                  <tr key={row._id} className="align-top odd:bg-white even:bg-slate-50/40">
                    <td className="border-b border-slate-100 px-3 py-3 font-semibold text-slate-950">{row.center}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-slate-700">{row.venue || '-'}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{row.locationUrl ? <a href={row.locationUrl} target="_blank" rel="noreferrer" className="break-all text-brand hover:underline">Open map</a> : <span className="text-slate-400">-</span>}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-slate-700">{row.dcaRep || '-'}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-slate-700">{row.contactNumber || '-'}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-slate-700">{row.trialDates || '-'}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-slate-700">{row.trialCodes || '-'}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-center font-bold text-slate-950">{row.days || '-'}</td>
                    {canManage && <td className="border-b border-slate-100 px-3 py-3"><div className="flex justify-end gap-1"><button onClick={() => editTrialRow(row)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" title="Edit row"><PenLine size={16} /></button><button onClick={() => removeTrialRow(row._id)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" title="Delete row"><Trash2 size={16} /></button></div></td>}
                  </tr>
                ))}
                {trialDetails.length === 0 && <tr><td colSpan={canManage ? 9 : 8} className="px-3 py-6 text-center text-sm text-slate-500">No trial detail rows added yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return <div className="min-w-0"><dt className="text-slate-500">{label}</dt><dd className="break-words font-medium">{value}</dd></div>;
}

function AssignmentGate({ title = 'Assign team members first', onManageTeam }) {
  return (
    <div className="rounded-lg border border-dashed border-green-200 bg-green-50 p-4">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">Add team members to this event first. After that, you can assign tasks, equipment, responsibilities, and checklist items to a particular member.</p>
      <button type="button" onClick={onManageTeam} className="primary-btn mt-3">Add team members</button>
    </div>
  );
}

function Tasks({ tasks, team, user, canManage, eventId, create, update, remove, onManageTeam }) {
  const needsTeam = canManage && team.length === 0;
  return <div className="space-y-4">{needsTeam ? <AssignmentGate onManageTeam={onManageTeam} /> : canManage && <TaskForm eventId={eventId} users={team} onSubmit={create} />}<div className="grid gap-4 lg:grid-cols-2">{tasks.map((task) => <div key={task._id} className="space-y-2"><TaskCard task={task} team={team} canManage={canManage && team.length > 0} onUpdate={update} onDelete={remove} /><TaskDetails task={task} user={user} onUpdate={update} /></div>)}</div></div>;
}

function TaskDetails({ task, user, onUpdate }) {
  const [comment, setComment] = useState('');
  const links = task.referenceLinks || [];
  const attachments = task.attachments || [];
  const comments = task.comments || [];
  async function addComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    await onUpdate(task._id, { comments: [...comments, { user: user._id, message: comment.trim() }] });
    setComment('');
  }
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm sm:p-4">
      {task.deliverables && <p><span className="font-semibold">Deliverables:</span> {task.deliverables}</p>}
      {task.approvalCriteria && <p className="mt-2"><span className="font-semibold">Approval:</span> {task.approvalCriteria}</p>}
      {links.length > 0 && <div className="mt-2"><p className="font-semibold">References</p>{links.map((link) => <a key={link} href={link} target="_blank" rel="noreferrer" className="block text-brand hover:underline">{link}</a>)}</div>}
      {attachments.length > 0 && <div className="mt-2"><p className="font-semibold">Attachments</p>{attachments.map((file) => <a key={file.path} href={fileUrl(file)} target="_blank" rel="noreferrer" className="block text-brand hover:underline">{file.filename}</a>)}</div>}
      <div className="mt-3 border-t border-slate-100 pt-3">
        <p className="font-semibold">Comments</p>
        <div className="mt-2 space-y-2">{comments.map((entry) => <div key={`${entry._id || entry.createdAt || entry.message}`} className="rounded-lg bg-slate-50 p-2"><p className="text-xs font-semibold text-slate-600">{entry.user?.fullName || 'Team'}</p><p>{entry.message}</p></div>)}</div>
        <form onSubmit={addComment} className="mt-3 grid gap-2 sm:flex"><input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add task comment" /><button className="primary-btn sm:min-w-20">Add</button></form>
      </div>
    </div>
  );
}

function Equipment({ items, team, canManage, eventId, create, update, remove, onManageTeam }) {
  const needsTeam = canManage && team.length === 0;
  return <div className="space-y-4">{needsTeam ? <AssignmentGate onManageTeam={onManageTeam} /> : canManage && <EquipmentForm eventId={eventId} users={team} onSubmit={create} />}<div className="grid gap-4 lg:grid-cols-2">{items.map((item) => <EquipmentCard key={item._id} item={item} team={team} canManage={canManage && team.length > 0} onUpdate={update} onDelete={remove} />)}</div></div>;
}

function SimpleManager({ title, resource, items, team, eventId, canManage, reload, onManageTeam }) {
  const [form, setForm] = useState({ eventId, title: '', assignedTo: '', description: '' });
  async function submit(e) {
    e.preventDefault();
    await api.post(`/${resource}`, form);
    setForm({ ...form, title: '', description: '' });
    reload();
  }
  async function remove(id) {
    await api.delete(`/${resource}/${id}`);
    reload();
  }
  const needsTeam = canManage && team.length === 0;
  return (
    <div className="space-y-4">
      {needsTeam ? <AssignmentGate title={`Assign team members before adding ${title.toLowerCase()}`} onManageTeam={onManageTeam} /> : canManage && <form onSubmit={submit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-2 md:p-4"><input placeholder={`${title} title`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /><select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} required><option value="">Assign to</option>{team.map((u) => <option key={u._id} value={u._id}>{u.fullName}</option>)}</select><textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /><button className="primary-btn">Add</button></form>}
      <div className="grid gap-3 lg:grid-cols-2">{items.map((item) => <div key={item._id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-semibold">{item.title}</h3><p className="text-sm text-slate-500">{item.assignedTo?.fullName}</p></div>{canManage && <button onClick={() => remove(item._id)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" title="Delete"><Trash2 size={16} /></button>}</div><p className="mt-2 text-sm text-slate-600">{item.description}</p></div>)}</div>
    </div>
  );
}

function Checklist({ items, team, eventId, canManage, reload, onManageTeam }) {
  const [form, setForm] = useState({ eventId, section: 'Before Event', title: '', assignedTo: '' });
  async function submit(e) {
    e.preventDefault();
    await api.post('/checklist', form);
    reload();
  }
  async function toggle(item) {
    await api.put(`/checklist/${item._id}`, { completed: !item.completed });
    reload();
  }
  async function remove(id) {
    await api.delete(`/checklist/${id}`);
    reload();
  }
  const needsTeam = canManage && team.length === 0;
  return (
    <div className="space-y-4">
      {needsTeam ? <AssignmentGate title="Assign team members before adding checklist items" onManageTeam={onManageTeam} /> : canManage && <form onSubmit={submit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-4 md:p-4"><select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>{['Before Event', 'During Event', 'After Event'].map((s) => <option key={s}>{s}</option>)}</select><input placeholder="Checklist item" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /><select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} required><option value="">Assign to</option>{team.map((u) => <option key={u._id} value={u._id}>{u.fullName}</option>)}</select><button className="primary-btn">Add item</button></form>}
      <div className="grid gap-3 lg:grid-cols-3">{items.map((item) => <div key={item._id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4"><button onClick={() => toggle(item)} className="block min-h-16 w-full text-left hover:text-brand"><p className="text-xs font-semibold text-slate-500">{item.section}</p><p className={`mt-1 text-sm font-medium ${item.completed ? 'line-through text-slate-400' : ''}`}>{item.title}</p><p className="text-xs text-slate-500">{item.assignedTo?.fullName}</p></button>{canManage && <button onClick={() => remove(item._id)} className="mt-3 flex min-h-9 items-center gap-1 text-xs font-semibold text-rose-600"><Trash2 size={13} /> Delete</button>}</div>)}</div>
    </div>
  );
}

function Notes({ items, eventId, canManage, reload }) {
  const [form, setForm] = useState({ eventId, title: '', description: '', type: 'General' });
  async function submit(e) {
    e.preventDefault();
    await api.post('/notes', form);
    setForm({ ...form, title: '', description: '' });
    reload();
  }
  async function remove(id) {
    await api.delete(`/notes/${id}`);
    reload();
  }
  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-2 md:p-4"><input placeholder="Note title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{['General', 'Entry Gate', 'Parking', 'Emergency', 'Schedule Change'].map((t) => <option key={t}>{t}</option>)}</select><textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /><button className="primary-btn">Add note</button></form>
      <div className="grid gap-3 lg:grid-cols-2">{items.map((note) => <div key={note._id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4"><div className="flex items-start justify-between gap-3"><h3 className="min-w-0 font-semibold">{note.title}</h3><div className="flex shrink-0 items-center gap-2"><StatusBadge status={note.type} />{canManage && <button onClick={() => remove(note._id)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" title="Delete"><Trash2 size={16} /></button>}</div></div><p className="mt-2 text-sm text-slate-600">{note.description}</p><p className="mt-2 text-xs text-slate-500">By {note.createdBy?.fullName}</p></div>)}</div>
    </div>
  );
}

function Submissions({ items, tasks, eventId, user, canReview, canManage, reload }) {
  const [form, setForm] = useState({ taskId: '', eventId, message: '', files: [] });
  async function submit(e) {
    e.preventDefault();
    await api.post('/submissions', toPayload({ ...form, submittedBy: user._id }));
    setForm({ ...form, taskId: '', message: '', files: [] });
    e.currentTarget.reset();
    reload();
  }
  async function review(id, status) {
    await api.patch(`/submissions/${id}/review`, { status, feedback: status === 'Approved' ? 'Approved for delivery.' : 'Please revise and resubmit.' });
    reload();
  }
  async function remove(id) {
    await api.delete(`/submissions/${id}`);
    reload();
  }
  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-4 md:p-4"><select value={form.taskId} onChange={(e) => setForm({ ...form, taskId: e.target.value })} required><option value="">Select task</option>{tasks.map((task) => <option key={task._id} value={task._id}>{task.title}</option>)}</select><input placeholder="Submission note" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /><input type="file" multiple onChange={(e) => setForm({ ...form, files: [...e.target.files] })} /><button className="primary-btn">Submit work</button></form>
      <div className="grid gap-3 lg:grid-cols-2">{items.map((item) => <div key={item._id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4"><div className="flex items-start justify-between gap-3"><h3 className="min-w-0 font-semibold">{item.taskId?.title}</h3><StatusBadge status={item.status} /></div><p className="mt-2 text-sm text-slate-600">{item.message}</p>{item.files?.length > 0 && <div className="mt-2 text-sm">{item.files.map((file) => <a key={file.path} href={fileUrl(file)} target="_blank" rel="noreferrer" className="block break-all text-brand hover:underline">{file.filename}</a>)}</div>}<p className="text-xs text-slate-500">By {item.submittedBy?.fullName}</p>{canReview && <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"><button onClick={() => review(item._id, 'Approved')} className="primary-btn">Approve</button><button onClick={() => review(item._id, 'Revision Required')} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white">Reject</button>{canManage && <button onClick={() => remove(item._id)} className="secondary-btn border-rose-200 text-rose-600"><Trash2 size={13} /> Delete</button>}</div>}</div>)}</div>
    </div>
  );
}
