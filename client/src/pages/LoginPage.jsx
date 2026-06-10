import { LockKeyhole, UserRound, KeyRound } from 'lucide-react';
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
    <div className="relative min-h-screen overflow-hidden bg-[#061fbd] px-4 py-8 text-white sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(35,91,255,0.75),transparent_35%),linear-gradient(135deg,#07169d_0%,#0627d1_48%,#06108f_100%)]" />
      <div className="absolute -left-20 top-0 h-80 w-28 rotate-[-34deg] bg-yellow-300/90 blur-[1px]" />
      <div className="absolute left-8 top-0 h-96 w-10 rotate-[-34deg] bg-white/20" />
      <div className="absolute right-[-70px] top-20 h-96 w-20 rotate-[30deg] bg-yellow-300/85" />
      <div className="absolute bottom-[-80px] left-[-40px] h-96 w-20 rotate-[30deg] bg-yellow-300/85" />
      <div className="absolute bottom-0 right-8 h-72 w-8 rotate-[-35deg] bg-yellow-300/85" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-[radial-gradient(circle_at_50%_100%,rgba(0,0,0,0.25),transparent_55%)]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <header className="mb-8 text-center sm:mb-10">
          <div className="mx-auto inline-block text-left italic tracking-tight drop-shadow-[0_6px_0_rgba(0,0,0,0.16)]">
            <div className="text-6xl font-black uppercase leading-[0.82] text-yellow-300 sm:text-7xl">BPS</div>
            <div className="text-5xl font-black uppercase leading-[0.9] text-white sm:text-6xl">Event</div>
            <div className="mt-2 text-2xl font-black uppercase leading-none text-yellow-300 sm:text-3xl">Management Portal</div>
          </div>
          <div className="mx-auto mt-5 flex max-w-xs items-center justify-center gap-2 rounded-md bg-yellow-300 px-4 py-2 text-xs font-black uppercase tracking-wide text-[#07106f] shadow-lg">
            <span className="text-lg leading-none">&gt;&gt;&gt;</span>
            Manage. Coordinate. Deliver.
          </div>
        </header>

        <form onSubmit={submit} className="rounded-[1.6rem] bg-white p-6 text-[#07106f] shadow-2xl shadow-blue-950/40 sm:p-7">
          <div>
            <h1 className="text-3xl font-black leading-9">BPS Event Management Portal</h1>
            <p className="mt-3 text-base leading-7 text-slate-500">Use credentials or access code provided by Boss/Admin.</p>
          </div>
          <div className="mt-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1.5">
            <button type="button" onClick={() => setMode('account')} className={`min-h-14 rounded-lg px-3 py-2 text-sm font-black ${mode === 'account' ? 'bg-yellow-300 text-[#07106f] shadow-sm' : 'text-[#07106f]'}`}>Login +<br />Password</button>
            <button type="button" onClick={() => setMode('access')} className={`min-h-14 rounded-lg px-3 py-2 text-sm font-black ${mode === 'access' ? 'bg-yellow-300 text-[#07106f] shadow-sm' : 'text-[#07106f]'}`}>Access Code</button>
          </div>
          {error && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <div className="mt-6 space-y-4">
            {mode === 'account' ? (
              <InputWithIcon icon={UserRound} placeholder="Username or email given by Boss" value={form.identifier} onChange={set('identifier')} required />
            ) : (
              <InputWithIcon icon={KeyRound} placeholder="Access Code / Employee ID given by Boss" value={form.accessCode} onChange={set('accessCode')} required />
            )}
            {mode === 'account' && <InputWithIcon icon={LockKeyhole} type="password" placeholder="Password" value={form.password} onChange={set('password')} required />}
            <button className="min-h-14 w-full rounded-xl bg-yellow-300 px-4 py-3 text-base font-black text-[#07106f] shadow-sm hover:bg-yellow-200">
              {mode === 'account' ? 'Login' : 'Fast login'}
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm font-black uppercase tracking-wide">
          Swipe to <span className="text-yellow-300">know more</span> &gt;&gt;&gt;
        </p>
      </div>
    </div>
  );
}

function InputWithIcon({ icon: Icon, ...props }) {
  return (
    <label className="relative block">
      <Icon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#061fbd]" size={24} />
      <input
        {...props}
        className="min-h-14 rounded-xl border-slate-200 bg-white pl-14 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[#061fbd] focus:ring-blue-100"
      />
    </label>
  );
}
