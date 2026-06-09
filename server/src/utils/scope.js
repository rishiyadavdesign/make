import Event from '../models/Event.js';
import { isBoss, isManager } from '../middleware/auth.js';

export async function eventScopeQuery(user) {
  if (isBoss(user)) return {};
  if (isManager(user)) return { assignedManager: user._id };
  return { teamMembers: user._id };
}

export async function eventIdsForUser(user) {
  if (isBoss(user)) return null;
  const events = await Event.find(await eventScopeQuery(user)).select('_id');
  return events.map((event) => event._id);
}

export async function canAccessEvent(user, eventId) {
  if (isBoss(user)) return true;
  const count = await Event.countDocuments({ _id: eventId, ...(await eventScopeQuery(user)) });
  return count > 0;
}
