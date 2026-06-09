import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function FirstLoginPage() {
  const { user, completeFirstLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', fullName: user.fullName || '', phone: user.phone || '', department: user.department || '' });
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    await completeFirstLogin(form);
    navigate('/dashboard');
  }
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">Complete your profile</h1>
        <div className="mt-5 grid gap-3">
          <input type="password" placeholder="Create new password" value={form.password} onChange={set('password')} required />
          <input placeholder="Full name" value={form.fullName} onChange={set('fullName')} required />
          <input placeholder="Phone" value={form.phone} onChange={set('phone')} />
          <input placeholder="Department" value={form.department} onChange={set('department')} />
          <button className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white">Continue</button>
        </div>
      </form>
    </div>
  );
}
