import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login, accessCodeLogin } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('account');
  const [form, setForm] = useState({ identifier: '', password: '', accessCode: '' });
  const [error, setError] = useState('');
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = mode === 'account'
        ? await login({ identifier: form.identifier, password: form.password })
        : await accessCodeLogin({ accessCode: form.accessCode });
      navigate(user.isFirstLogin || !user.profileCompleted ? '/first-login' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  }
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg bg-white p-6 shadow-sm">
        <div>
          <img src="/bps-logo.svg" alt="Black Pepper Salt" className="h-auto w-56 max-w-full rounded-lg bg-black" />
          <h1 className="mt-5 text-2xl font-bold leading-7 text-slate-950">BPS Event Management Portal</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Use credentials or access code provided by Boss/Admin.</p>
        </div>
        <div className="mt-5 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
          <button type="button" onClick={() => setMode('account')} className={`rounded-md px-3 py-2 text-sm font-semibold ${mode === 'account' ? 'bg-white text-brand shadow-sm' : 'text-slate-600'}`}>Login + Password</button>
          <button type="button" onClick={() => setMode('access')} className={`rounded-md px-3 py-2 text-sm font-semibold ${mode === 'access' ? 'bg-white text-brand shadow-sm' : 'text-slate-600'}`}>Access Code</button>
        </div>
        {error && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <div className="mt-6 space-y-4">
          {mode === 'account' ? (
            <input placeholder="Username or email given by Boss" value={form.identifier} onChange={set('identifier')} required />
          ) : (
            <input placeholder="Access Code / Employee ID given by Boss" value={form.accessCode} onChange={set('accessCode')} required />
          )}
          {mode === 'account' && <input type="password" placeholder="Password" value={form.password} onChange={set('password')} required />}
          <button className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white">
            {mode === 'account' ? 'Login' : 'Fast login'}
          </button>
        </div>
      </form>
    </div>
  );
}
