import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { RoleBadge, StatusBadge } from '../components/Badges.jsx';
import { UserForm } from '../components/Forms.jsx';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('All');
  const [status, setStatus] = useState('All');
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const load = () => api.get('/users').then((res) => setUsers(res.data));
  useEffect(() => { load(); }, []);
  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch = !needle || [u.fullName, u.username, u.email, u.phone, u.department, u.accessCode].some((value) => String(value || '').toLowerCase().includes(needle));
      const matchesRole = role === 'All' || u.role === role;
      const matchesStatus = status === 'All' || u.status === status;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, query, role, status]);
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.status === 'Active').length,
    managers: users.filter((u) => u.role === 'Project Manager').length,
    members: users.filter((u) => u.role === 'Team Member').length
  }), [users]);
  async function createUser(payload) {
    setError('');
    setSaving(true);
    try {
      const { fullName, username, email, phone, password, accessCode, role, department, status } = payload;
      const cleanPayload = { fullName, username, email, phone, password, accessCode, role, department, status };
      if (editing) await api.put(`/users/${editing._id}`, cleanPayload);
      else await api.post('/users', cleanPayload);
      setNotice({
        title: editing ? 'User updated' : 'User created',
        lines: [`Name: ${fullName}`, `Username: ${username}`, `Access code: ${accessCode}`]
      });
      setShowForm(false);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save user. Check all required fields and try again.');
    } finally {
      setSaving(false);
    }
  }
  async function setUserStatus(user, nextStatus) {
    await api.put(`/users/${user._id}`, { ...user, status: nextStatus, assignedEvents: undefined });
    load();
  }
  async function resetPassword(user) {
    const password = window.prompt(`Temporary password for ${user.fullName}`, `${user.username}@123`);
    if (!password) return;
    const { data } = await api.patch(`/users/${user._id}/reset-password`, { password });
    setNotice({
      title: 'Password reset',
      lines: [
        `Name: ${user.fullName}`,
        `Username: ${user.username}`,
        `Email: ${user.email}`,
        `Temporary password: ${data.temporaryPassword}`,
        `Access code: ${user.accessCode}`
      ]
    });
    load();
  }
  async function regenerateAccessCode(user) {
    const { data } = await api.patch(`/users/${user._id}/access-code`);
    setNotice({
      title: 'New access code generated',
      lines: [
        `Name: ${user.fullName}`,
        `Username: ${user.username}`,
        `Email: ${user.email}`,
        `Access code: ${data.accessCode}`
      ]
    });
    load();
  }
  async function disableUser(user) {
    if (!window.confirm(`Disable ${user.fullName}? They will not be able to log in.`)) return;
    await api.delete(`/users/${user._id}`);
    load();
  }
  async function removeUser(user) {
    if (!window.confirm(`Permanently remove ${user.fullName}? This removes the account from User Management.`)) return;
    await api.delete(`/users/${user._id}/remove`);
    setNotice({ title: 'User removed', lines: [`${user.fullName} was removed permanently.`] });
    load();
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="page-title">User Management</h2>
          <p className="page-subtitle">Create staff, give login credentials, reset passwords, and control access.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(!showForm); }} className="primary-btn sm:min-w-32">Create user</button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Metric label="Total users" value={stats.total} />
        <Metric label="Active" value={stats.active} />
        <Metric label="Managers" value={stats.managers} />
        <Metric label="Team members" value={stats.members} />
      </div>
      {notice && (
        <div className="rounded-lg border border-green-100 bg-green-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-green-900">{notice.title}</h3>
              <div className="mt-2 space-y-1 text-sm text-green-800">{notice.lines.map((line) => <p key={line}>{line}</p>)}</div>
            </div>
            <button onClick={() => setNotice(null)} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-brand">Close</button>
          </div>
        </div>
      )}
      {showForm && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          {error && <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <UserForm initial={editing || {}} onSubmit={createUser} saving={saving} />
        </div>
      )}
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-3 md:p-4">
        <input placeholder="Search name, username, email, phone, department, access code" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          {['All', 'Boss/Admin', 'Project Manager', 'Team Member'].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {['All', 'Active', 'Inactive', 'Suspended'].map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <div className="grid gap-3 lg:hidden">
        {filteredUsers.map((u) => (
          <article key={u._id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold leading-5">{u.fullName}</h3>
                <p className="mt-0.5 text-xs text-slate-500">{u.department || 'No department'}</p>
              </div>
              <StatusBadge status={u.status} />
            </div>
            <div className="mt-3 grid gap-2 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-800">Login:</span> {u.username}</p>
              <p className="break-all"><span className="font-semibold text-slate-800">Email:</span> {u.email}</p>
              <p><span className="font-semibold text-slate-800">Code:</span> {u.accessCode}</p>
              <div><RoleBadge role={u.role} /></div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => { setEditing(u); setShowForm(true); }} className="secondary-btn text-brand">Edit</button>
              <button onClick={() => resetPassword(u)} className="secondary-btn text-brand">Reset</button>
              <button onClick={() => regenerateAccessCode(u)} className="secondary-btn text-brand">New code</button>
              {u.status !== 'Active' && <button onClick={() => setUserStatus(u, 'Active')} className="secondary-btn border-green-200 text-green-700">Activate</button>}
              {u.status !== 'Suspended' && <button onClick={() => setUserStatus(u, 'Suspended')} className="secondary-btn border-rose-200 text-rose-600">Suspend</button>}
              {u.status !== 'Inactive' && <button onClick={() => disableUser(u)} className="secondary-btn text-slate-600">Disable</button>}
              <button onClick={() => removeUser(u)} className="secondary-btn border-rose-200 text-rose-600">Remove</button>
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Name</th><th>Login</th><th>Contact</th><th>Role</th><th>Status</th><th>Events</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u._id} className="border-t border-slate-100">
                  <td className="p-3"><p className="font-medium">{u.fullName}</p><p className="text-xs text-slate-500">{u.department || 'No department'}</p></td>
                  <td><p className="font-medium">{u.username}</p><p className="text-xs text-slate-500">{u.accessCode}</p></td>
                  <td><p>{u.email}</p><p className="text-xs text-slate-500">{u.phone || 'No phone'}</p></td>
                  <td><RoleBadge role={u.role} /></td>
                  <td><StatusBadge status={u.status} /></td>
                  <td className="text-xs text-slate-600">{u.assignedEvents?.length || 0} assigned</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => { setEditing(u); setShowForm(true); }} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-brand">Edit</button>
                      <button onClick={() => resetPassword(u)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-brand">Reset password</button>
                      <button onClick={() => regenerateAccessCode(u)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-brand">New code</button>
                      {u.status !== 'Active' && <button onClick={() => setUserStatus(u, 'Active')} className="rounded-lg border border-green-200 px-2 py-1 text-xs font-semibold text-green-700">Activate</button>}
                      {u.status !== 'Suspended' && <button onClick={() => setUserStatus(u, 'Suspended')} className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600">Suspend</button>}
                      {u.status !== 'Inactive' && <button onClick={() => disableUser(u)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">Disable</button>}
                      <button onClick={() => removeUser(u)} className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4"><p className="text-xs font-medium text-slate-500 sm:text-sm">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>;
}
