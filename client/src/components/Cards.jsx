import { Calendar, MapPin, Pin, Trash2, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from './Badges.jsx';

export function EventCard({ event, onPin, canPin = false }) {
  return (
    <article className={`rounded-lg border bg-white p-4 shadow-sm ${event.isPinnedForMe ? 'border-brand ring-2 ring-green-100' : 'border-slate-200'}`}>
      <Link to={`/events/${event._id}`} className="block hover:text-brand">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold">{event.eventName}</h3>
          <div className="flex flex-wrap justify-end gap-2">
            {event.isPinnedForMe && <StatusBadge status="Pinned" />}
            <StatusBadge status={event.status} />
          </div>
        </div>
        <p className="mt-1 text-sm text-slate-500">{event.clientName}</p>
        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <p className="flex items-center gap-2"><Calendar size={16} /> {new Date(event.date).toLocaleDateString()}</p>
          <p className="flex items-center gap-2"><MapPin size={16} /> {event.venue}</p>
          <p className="flex items-center gap-2"><UserRound size={16} /> {event.assignedManager?.fullName || 'Unassigned'}</p>
        </div>
      </Link>
      {canPin && <div className="mt-4 border-t border-slate-100 pt-3">
        <button onClick={() => onPin?.(event)} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">
          <Pin size={14} /> {event.isPinnedForMe ? 'Unpin main event' : 'Pin main event'}
        </button>
      </div>}
    </article>
  );
}

export function TaskCard({ task, onUpdate, onDelete, canManage, team = [] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{task.title}</h3>
          <p className="text-sm text-slate-500">{task.assignedTo?.fullName}</p>
        </div>
        <div className="flex gap-2"><StatusBadge status={task.priority} /><StatusBadge status={task.status} /></div>
      </div>
      <p className="mt-3 text-sm text-slate-600">{task.description}</p>
      {canManage && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <select value={task.assignedTo?._id || task.assignedTo || ''} onChange={(e) => onUpdate(task._id, { assignedTo: e.target.value })}>
            {team.map((person) => <option key={person._id} value={person._id}>{person.fullName}</option>)}
          </select>
          <select value={task.priority} onChange={(e) => onUpdate(task._id, { priority: e.target.value })}>
            {['Low', 'Medium', 'High', 'Urgent'].map((priority) => <option key={priority}>{priority}</option>)}
          </select>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {['Pending', 'In Progress', 'Submitted', 'Approved', 'Revision Required'].map((status) => (
          <button key={status} onClick={() => onUpdate(task._id, { status })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">{status}</button>
        ))}
        {canManage && <button onClick={() => onDelete?.(task._id)} className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"><Trash2 size={13} /> Delete</button>}
      </div>
    </div>
  );
}

export function EquipmentCard({ item, onUpdate, onDelete, canManage, team = [] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-sm text-slate-500">Qty {item.quantity} - {item.responsiblePerson?.fullName}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <p className="mt-3 text-sm text-slate-600">{item.notes}</p>
      {canManage && (
        <div className="mt-3">
          <select value={item.responsiblePerson?._id || item.responsiblePerson || ''} onChange={(e) => onUpdate(item._id, { responsiblePerson: e.target.value })}>
            {team.map((person) => <option key={person._id} value={person._id}>{person.fullName}</option>)}
          </select>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {['Assigned', 'Packed', 'Brought to Event', 'Missing', 'Returned'].map((status) => (
          <button key={status} onClick={() => onUpdate(item._id, { status })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">{status}</button>
        ))}
        {canManage && <button onClick={() => onDelete?.(item._id)} className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"><Trash2 size={13} /> Delete</button>}
      </div>
    </div>
  );
}
