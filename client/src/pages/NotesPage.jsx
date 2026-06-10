import { Edit3, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isBoss } from '../utils/roles.js';

const emptyNote = { title: '', description: '', category: 'General', visibility: 'Personal' };
const categories = ['General', 'Idea', 'Reminder', 'Meeting', 'Issue', 'Important'];
const visibilities = ['Personal', 'Shared'];

export default function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState(emptyNote);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const { data } = await api.get('/app-notes');
    setNotes(data);
  }

  useEffect(() => { load(); }, []);

  const filteredNotes = useMemo(() => {
    const text = query.trim().toLowerCase();
    return notes.filter((note) => {
      const matchesText = !text || [note.title, note.description, note.category, note.createdBy?.fullName].join(' ').toLowerCase().includes(text);
      const matchesFilter = filter === 'All' || note.visibility === filter || note.category === filter;
      return matchesText && matchesFilter;
    });
  }, [notes, query, filter]);

  function startEdit(note) {
    setEditing(note);
    setForm({
      title: note.title,
      description: note.description || '',
      category: note.category,
      visibility: note.visibility
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditing(null);
    setForm(emptyNote);
    setError('');
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) await api.put(`/app-notes/${editing._id}`, form);
      else await api.post('/app-notes', form);
      resetForm();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save note');
    } finally {
      setSaving(false);
    }
  }

  async function remove(note) {
    await api.delete(`/app-notes/${note._id}`);
    await load();
  }

  function canModify(note) {
    return isBoss(user) || String(note.createdBy?._id || note.createdBy) === String(user._id);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">Notes</h2>
        <p className="page-subtitle">Take personal notes or share important notes with the team.</p>
      </div>

      <form onSubmit={submit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-2 md:p-4">
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 md:col-span-2">{error}</p>}
        <input placeholder="Note title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
          {visibilities.map((item) => <option key={item}>{item}</option>)}
        </select>
        <textarea className="md:col-span-2" placeholder="Write details..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-2 md:flex md:items-center">
          <button className="primary-btn" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update note' : 'Add note'}</button>
          {editing && <button type="button" onClick={resetForm} className="secondary-btn">Cancel</button>}
        </div>
      </form>

      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input className="pl-10" placeholder="Search notes" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="md:w-44">
            {['All', 'Personal', 'Shared', ...categories].map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredNotes.map((note) => (
          <article key={note._id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex w-fit rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-brand">{note.category}</span>
                  <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${note.visibility === 'Shared' ? 'bg-black text-white' : 'bg-slate-100 text-slate-700'}`}>{note.visibility}</span>
                </div>
                <h3 className="mt-2 break-words font-semibold text-slate-950">{note.title}</h3>
              </div>
              {canModify(note) && (
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => startEdit(note)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50" title="Edit note"><Edit3 size={16} /></button>
                  <button onClick={() => remove(note)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" title="Delete note"><Trash2 size={16} /></button>
                </div>
              )}
            </div>
            {note.description && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{note.description}</p>}
            <p className="mt-4 text-xs text-slate-500">By {note.createdBy?.fullName || 'Team'} · {new Date(note.updatedAt).toLocaleDateString()}</p>
          </article>
        ))}
        {filteredNotes.length === 0 && <p className="text-sm text-slate-500">No notes found.</p>}
      </div>
    </div>
  );
}
