const roleClass = {
  'Boss/Admin': 'bg-black text-white',
  'Project Manager': 'bg-green-100 text-green-800',
  'Team Member': 'bg-green-50 text-green-700'
};

const statusClass = {
  Active: 'bg-green-100 text-green-800',
  Inactive: 'bg-slate-100 text-slate-700',
  Suspended: 'bg-rose-100 text-rose-700',
  Pinned: 'bg-black text-white',
  Planning: 'bg-green-50 text-green-700',
  Completed: 'bg-slate-100 text-slate-700',
  Pending: 'bg-slate-100 text-slate-700',
  'In Progress': 'bg-green-100 text-green-800',
  Submitted: 'bg-amber-100 text-amber-700',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-rose-100 text-rose-700',
  Paid: 'bg-black text-white',
  'Revision Required': 'bg-rose-100 text-rose-700',
  Urgent: 'bg-rose-100 text-rose-700',
  High: 'bg-orange-100 text-orange-700',
  Packed: 'bg-green-50 text-green-700',
  Missing: 'bg-rose-100 text-rose-700'
};

export function RoleBadge({ role }) {
  return <span className={`inline-flex w-fit max-w-full items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-4 ${roleClass[role] || 'bg-slate-100 text-slate-700'}`}>{role}</span>;
}

export function StatusBadge({ status }) {
  return <span className={`inline-flex w-fit max-w-full items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-4 ${statusClass[status] || 'bg-slate-100 text-slate-700'}`}>{status}</span>;
}
