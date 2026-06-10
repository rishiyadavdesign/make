import asyncHandler from 'express-async-handler';
import Event from '../models/Event.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { eventScopeQuery, canAccessEvent } from '../utils/scope.js';
import { isBoss } from '../middleware/auth.js';

function withPinnedFlag(event, user) {
  const plain = event.toObject ? event.toObject() : event;
  plain.isPinnedForMe = String(user.pinnedEvent || '') === String(plain._id);
  return plain;
}

export const listEvents = asyncHandler(async (req, res) => {
  const events = await Event.find(await eventScopeQuery(req.user))
    .populate('assignedManager', 'fullName role')
    .populate('teamMembers', 'fullName role')
    .populate('overviewDetails.assignedTo', 'fullName role')
    .sort({ status: 1, date: 1 });
  res.json(events.map((event) => withPinnedFlag(event, req.user)));
});

export const getEvent = asyncHandler(async (req, res) => {
  if (!(await canAccessEvent(req.user, req.params.id))) return res.status(403).json({ message: 'Forbidden' });
  const event = await Event.findById(req.params.id)
    .populate('assignedManager', 'fullName role email')
    .populate('teamMembers', 'fullName role email')
    .populate('overviewDetails.assignedTo', 'fullName role email');
  if (!event) return res.status(404).json({ message: 'Event not found' });
  res.json(withPinnedFlag(event, req.user));
});

export const createEvent = asyncHandler(async (req, res) => {
  const event = await Event.create(req.body);
  await syncAssignments(event);
  await notifyAssignedUsers(event, []);
  res.status(201).json(event);
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (!isBoss(req.user) && String(event.assignedManager) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const previousAssignedIds = assignedUserIds(event);
  Object.assign(event, req.body);
  await event.save();
  await syncAssignments(event, previousAssignedIds);
  await notifyAssignedUsers(event, previousAssignedIds, req.user._id);
  await notifyExistingAssignedUsers(event, previousAssignedIds, req.user._id);
  res.json(event);
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  await User.updateMany({}, { $pull: { assignedEvents: event._id } });
  await User.updateMany({ pinnedEvent: event._id }, { $unset: { pinnedEvent: '' } });
  res.json({ message: 'Event deleted' });
});

export const pinEvent = asyncHandler(async (req, res) => {
  if (!(await canAccessEvent(req.user, req.params.id))) return res.status(403).json({ message: 'Forbidden' });
  const pinnedEvent = req.body.pinned === false ? undefined : req.params.id;
  const update = pinnedEvent ? { pinnedEvent } : { $unset: { pinnedEvent: '' } };
  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password');
  res.json({ pinnedEvent: user.pinnedEvent || null });
});

function assignedUserIds(event) {
  return [event.assignedManager, ...(event.teamMembers || [])].filter(Boolean).map((id) => String(id));
}

async function syncAssignments(event, previousIds = []) {
  const ids = assignedUserIds(event);
  const removedIds = previousIds.filter((id) => !ids.includes(String(id)));
  await User.updateMany({ _id: { $in: ids } }, { $addToSet: { assignedEvents: event._id } });
  if (removedIds.length) {
    await User.updateMany({ _id: { $in: removedIds } }, { $pull: { assignedEvents: event._id } });
  }
}

async function notifyAssignedUsers(event, previousIds = [], actorId = null) {
  const previous = new Set(previousIds.map(String));
  const nextIds = assignedUserIds(event).filter((id) => !previous.has(String(id)) && String(id) !== String(actorId || ''));
  if (!nextIds.length) return;
  await Promise.all(nextIds.map((userId) => Notification.create({
    userId,
    eventId: event._id,
    title: 'Event assigned',
    message: `You have been assigned to ${event.eventName}.`,
    type: 'Event'
  })));
}

async function notifyExistingAssignedUsers(event, previousIds = [], actorId = null) {
  const current = assignedUserIds(event);
  const existingIds = current.filter((id) => previousIds.includes(String(id)) && String(id) !== String(actorId || ''));
  if (!existingIds.length) return;
  await Promise.all(existingIds.map((userId) => Notification.create({
    userId,
    eventId: event._id,
    title: 'Event details updated',
    message: `${event.eventName} details were updated.`,
    type: 'Event'
  })));
}
