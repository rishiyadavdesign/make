import { Camera, CalendarDays, LockKeyhole, Mail, MapPin, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { RoleBadge, StatusBadge } from '../components/Badges.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

function fileUrl(file) {
  if (!file?.path) return '';
  if (/^https?:\/\//i.test(file.path)) return file.path;
  const base = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
  return `${base}/${file.path}`;
}

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();
  const [profile, setProfile] = useState({
    fullName: user.fullName || '',
    username: user.username || '',
    email: user.email || '',
    phone: user.phone || '',
    department: user.department || '',
    jobTitle: user.jobTitle || '',
    location: user.location || '',
    bio: user.bio || '',
    emergencyContact: user.emergencyContact || ''
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [error, setError] = useState('');
  const initials = useMemo(() => String(user.fullName || user.username || 'User').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase(), [user]);

  async function saveProfile(e) {
    e.preventDefault();
    setError('');
    setProfileMessage('');
    try {
      const payload = new FormData();
      Object.entries(profile).forEach(([key, value]) => payload.append(key, value || ''));
      if (profilePhoto) payload.append('profilePhoto', profilePhoto);
      await updateProfile(payload);
      setProfilePhoto(null);
      setProfileMessage('Profile updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update profile');
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setError('');
    setPasswordMessage('');
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }
    try {
      await changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMessage('Password updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update password');
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">Profile</h2>
        <p className="page-subtitle">Manage your account details and security.</p>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-green-100">
              {user.profilePhoto?.path ? <img src={fileUrl(user.profilePhoto)} alt={user.fullName} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xl font-black text-brand">{initials || 'U'}</div>}
            </div>
            <div className="min-w-0">
              <h3 className="break-words text-xl font-bold text-slate-950">{user.fullName}</h3>
              <p className="mt-1 text-sm text-slate-500">@{user.username}</p>
              <div className="mt-2 flex flex-wrap gap-2"><RoleBadge role={user.role} /><StatusBadge status={user.status} /></div>
            </div>
          </div>
          <div className="grid gap-2 text-sm text-slate-600 sm:min-w-72">
            <Info icon={Mail} label="Email" value={user.email} />
            <Info icon={Phone} label="Phone" value={user.phone || 'Not added'} />
            <Info icon={ShieldCheck} label="Department" value={user.department || 'Not added'} />
            <Info icon={MapPin} label="Location" value={user.location || 'Not added'} />
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <UserRound size={18} className="text-brand" />
            <h3 className="font-bold">Profile details</h3>
          </div>
          {profileMessage && <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-brand">{profileMessage}</p>}
          <div className="grid gap-3">
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Profile photo
              <div className="grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center">
                <span className="inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-green-100 text-lg font-black text-brand">
                  {profilePhoto ? <img src={URL.createObjectURL(profilePhoto)} alt="Preview" className="h-full w-full object-cover" /> : user.profilePhoto?.path ? <img src={fileUrl(user.profilePhoto)} alt="Profile" className="h-full w-full object-cover" /> : <Camera size={22} />}
                </span>
                <input type="file" accept="image/*,.heic,.heif" onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)} />
              </div>
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">Full name<input value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} required /></label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">Username<input value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} required /></label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">Email<input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} required /></label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">Phone<input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">Department<input value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })} /></label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">Job title<input value={profile.jobTitle} onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })} /></label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">Location<input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} /></label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">Emergency contact<input value={profile.emergencyContact} onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })} /></label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">Bio<textarea value={profile.bio} maxLength={500} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Short profile note" /></label>
            <button className="primary-btn">Save profile</button>
          </div>
        </form>

        <form onSubmit={savePassword} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <LockKeyhole size={18} className="text-brand" />
            <h3 className="font-bold">Security</h3>
          </div>
          {passwordMessage && <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-brand">{passwordMessage}</p>}
          <div className="grid gap-3">
            <label className="space-y-1.5 text-sm font-medium text-slate-700">Current password<input type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} required /></label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">New password<input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} required minLength={6} /></label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">Confirm password<input type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} required minLength={6} /></label>
            <button className="primary-btn">Change password</button>
          </div>
        </form>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays size={18} className="text-brand" />
          <h3 className="font-bold">Assigned events</h3>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {(user.assignedEvents || []).map((event) => (
            <div key={event._id || event} className="rounded-lg bg-slate-50 p-3">
              <p className="font-semibold">{event.eventName || 'Assigned event'}</p>
              {event.date && <p className="mt-1 text-sm text-slate-500">{new Date(event.date).toLocaleDateString()}</p>}
              {event.venue && <p className="text-sm text-slate-500">{event.venue}</p>}
            </div>
          ))}
          {(user.assignedEvents || []).length === 0 && <p className="text-sm text-slate-500">No assigned events yet.</p>}
        </div>
      </section>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon size={16} className="shrink-0 text-slate-500" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-normal text-slate-400">{label}</p>
        <p className="truncate font-medium text-slate-700">{value}</p>
      </div>
    </div>
  );
}
