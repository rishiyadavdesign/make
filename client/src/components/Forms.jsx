import { useState } from 'react';

const roles = ['Boss/Admin', 'Project Manager', 'Team Member'];
const priorities = ['Low', 'Medium', 'High', 'Urgent'];

function Field({ label, children }) {
  return <label className="space-y-1.5 text-sm font-medium text-slate-700"><span>{label}</span>{children}</label>;
}

export function UserForm({ onSubmit, initial = {}, saving = false }) {
  const [form, setForm] = useState({ fullName: '', username: '', email: '', phone: '', password: '', accessCode: '', role: 'Team Member', department: '', status: 'Active', ...initial });
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const generateCode = () => {
    const prefix = form.role === 'Project Manager' ? 'BPS-MANAGER' : form.role === 'Boss/Admin' ? 'BPS-BOSS' : 'BPS-MEMBER';
    setForm({ ...form, accessCode: `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}` });
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="grid gap-3 md:grid-cols-2">
      <Field label="Full name"><input value={form.fullName} onChange={set('fullName')} required /></Field>
      <Field label="Username"><input value={form.username} onChange={set('username')} required /></Field>
      <Field label="Email"><input type="email" value={form.email} onChange={set('email')} required /></Field>
      <Field label="Phone"><input value={form.phone} onChange={set('phone')} /></Field>
      <Field label="Temporary password"><input type="password" value={form.password} onChange={set('password')} placeholder={initial._id ? 'Leave blank to keep' : 'Required for new user'} required={!initial._id} /></Field>
      <Field label="Access code">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input value={form.accessCode} onChange={set('accessCode')} required />
          <button type="button" onClick={generateCode} className="secondary-btn px-3">Generate</button>
        </div>
      </Field>
      <Field label="Role"><select value={form.role} onChange={set('role')}>{roles.map((r) => <option key={r}>{r}</option>)}</select></Field>
      <Field label="Department"><input value={form.department} onChange={set('department')} /></Field>
      <Field label="Status"><select value={form.status} onChange={set('status')}>{['Active', 'Inactive', 'Suspended'].map((item) => <option key={item}>{item}</option>)}</select></Field>
      <button disabled={saving} className="primary-btn disabled:cursor-not-allowed disabled:bg-slate-300 md:col-span-2">{saving ? 'Saving...' : 'Save user'}</button>
    </form>
  );
}

export function EventForm({ onSubmit, users = [], initial = {} }) {
  const [form, setForm] = useState({ eventName: '', clientName: '', date: '', venue: '', reportingTime: '', description: '', status: 'Planning', assignedManager: '', teamMembers: [], importantInstructions: '', ...initial });
  const managers = users.filter((u) => u.role === 'Project Manager');
  const members = users.filter((u) => u.role === 'Team Member');
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="grid gap-3 md:grid-cols-2">
      <Field label="Event name"><input value={form.eventName} onChange={set('eventName')} required /></Field>
      <Field label="Client"><input value={form.clientName} onChange={set('clientName')} required /></Field>
      <Field label="Date"><input type="date" value={String(form.date || '').slice(0, 10)} onChange={set('date')} required /></Field>
      <Field label="Venue"><input value={form.venue} onChange={set('venue')} required /></Field>
      <Field label="Reporting time"><input value={form.reportingTime} onChange={set('reportingTime')} /></Field>
      <Field label="Status"><select value={form.status} onChange={set('status')}>{['Planning', 'Active', 'Completed', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}</select></Field>
      <Field label="Manager"><select value={form.assignedManager} onChange={set('assignedManager')}><option value="">Select</option>{managers.map((u) => <option key={u._id} value={u._id}>{u.fullName}</option>)}</select></Field>
      <Field label="Team members"><select multiple value={form.teamMembers} onChange={(e) => setForm({ ...form, teamMembers: [...e.target.selectedOptions].map((o) => o.value) })}>{members.map((u) => <option key={u._id} value={u._id}>{u.fullName}</option>)}</select></Field>
      <Field label="Description"><textarea value={form.description} onChange={set('description')} /></Field>
      <Field label="Instructions"><textarea value={form.importantInstructions} onChange={set('importantInstructions')} /></Field>
      <button className="primary-btn md:col-span-2">Save event</button>
    </form>
  );
}

export function TaskForm({ eventId, users, onSubmit }) {
  const [form, setForm] = useState({ eventId, title: '', assignedTo: '', priority: 'Medium', deadline: '', description: '', deliverables: '', referenceLinks: '', approvalCriteria: '', files: [] });
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); setForm({ ...form, title: '', description: '', deliverables: '', referenceLinks: '', approvalCriteria: '', files: [] }); e.currentTarget.reset(); }} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-2 md:p-4">
      <Field label="Task title"><input value={form.title} onChange={set('title')} required /></Field>
      <Field label="Assign to"><select value={form.assignedTo} onChange={set('assignedTo')} required><option value="">Select</option>{users.map((u) => <option key={u._id} value={u._id}>{u.fullName}</option>)}</select></Field>
      <Field label="Priority"><select value={form.priority} onChange={set('priority')}>{priorities.map((p) => <option key={p}>{p}</option>)}</select></Field>
      <Field label="Deadline"><input type="date" value={form.deadline} onChange={set('deadline')} /></Field>
      <Field label="Deliverables"><textarea value={form.deliverables} onChange={set('deliverables')} /></Field>
      <Field label="Reference links"><textarea value={form.referenceLinks} onChange={set('referenceLinks')} placeholder="One link per line" /></Field>
      <Field label="Description"><textarea value={form.description} onChange={set('description')} /></Field>
      <Field label="Approval criteria"><textarea value={form.approvalCriteria} onChange={set('approvalCriteria')} /></Field>
      <Field label="Attachments"><input type="file" multiple onChange={(e) => setForm({ ...form, files: [...e.target.files] })} /></Field>
      <button className="primary-btn md:col-span-2">Create task</button>
    </form>
  );
}

export function EquipmentForm({ eventId, users, onSubmit }) {
  const [form, setForm] = useState({ eventId, name: '', quantity: 1, responsiblePerson: '', status: 'Required', notes: '' });
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-2 md:p-4">
      <Field label="Equipment"><input value={form.name} onChange={set('name')} required /></Field>
      <Field label="Quantity"><input type="number" min="1" value={form.quantity} onChange={set('quantity')} /></Field>
      <Field label="Responsible person"><select value={form.responsiblePerson} onChange={set('responsiblePerson')} required><option value="">Select</option>{users.map((u) => <option key={u._id} value={u._id}>{u.fullName}</option>)}</select></Field>
      <Field label="Status"><select value={form.status} onChange={set('status')}>{['Required', 'Assigned', 'Packed', 'Brought to Event', 'Missing', 'Returned'].map((s) => <option key={s}>{s}</option>)}</select></Field>
      <Field label="Notes"><textarea value={form.notes} onChange={set('notes')} /></Field>
      <button className="primary-btn md:col-span-2">Save equipment</button>
    </form>
  );
}
