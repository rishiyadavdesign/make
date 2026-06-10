import asyncHandler from 'express-async-handler';
import Event from '../models/Event.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { isBoss } from '../middleware/auth.js';
import { eventScopeQuery } from '../utils/scope.js';
import { normalizeFiles } from '../utils/fileStorage.js';

const userSelect = 'fullName username role department status';

async function contactIdsFor(user) {
  if (isBoss(user)) {
    const users = await User.find({ _id: { $ne: user._id }, status: 'Active' }).select('_id');
    return users.map((item) => String(item._id));
  }

  const events = await Event.find(await eventScopeQuery(user)).select('assignedManager teamMembers');
  const ids = new Set();
  for (const event of events) {
    if (event.assignedManager) ids.add(String(event.assignedManager));
    for (const member of event.teamMembers || []) ids.add(String(member));
  }
  const bosses = await User.find({ role: 'Boss/Admin', status: 'Active' }).select('_id');
  bosses.forEach((boss) => ids.add(String(boss._id)));
  ids.delete(String(user._id));
  return [...ids];
}

async function canMessage(user, recipientId) {
  const ids = await contactIdsFor(user);
  return ids.includes(String(recipientId));
}

export const listContacts = asyncHandler(async (req, res) => {
  const ids = await contactIdsFor(req.user);
  const contacts = await User.find({ _id: { $in: ids }, status: 'Active' }).select(userSelect).sort({ role: 1, fullName: 1 });
  const unread = await Message.aggregate([
    { $match: { recipient: req.user._id, readAt: { $exists: false } } },
    { $group: { _id: '$sender', count: { $sum: 1 } } }
  ]);
  const unreadMap = new Map(unread.map((item) => [String(item._id), item.count]));
  res.json(contacts.map((contact) => ({
    ...contact.toObject(),
    unreadCount: unreadMap.get(String(contact._id)) || 0
  })));
});

export const listConversation = asyncHandler(async (req, res) => {
  const otherUserId = req.params.userId;
  if (!(await canMessage(req.user, otherUserId))) return res.status(403).json({ message: 'Forbidden' });

  const messages = await Message.find({
    $or: [
      { sender: req.user._id, recipient: otherUserId },
      { sender: otherUserId, recipient: req.user._id }
    ]
  })
    .populate('sender', userSelect)
    .populate('recipient', userSelect)
    .sort({ createdAt: 1 })
    .limit(200);

  await Message.updateMany({ sender: otherUserId, recipient: req.user._id, readAt: { $exists: false } }, { readAt: new Date() });
  res.json(messages);
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { recipient, body, eventId } = req.body;
  const attachments = await normalizeFiles(req.files);
  if (!recipient || (!String(body || '').trim() && attachments.length === 0)) {
    return res.status(400).json({ message: 'Recipient and message or attachment are required' });
  }
  if (!(await canMessage(req.user, recipient))) return res.status(403).json({ message: 'Forbidden' });

  const message = await Message.create({
    sender: req.user._id,
    recipient,
    body: String(body || '').trim(),
    attachments,
    eventId: eventId || undefined
  });

  await Notification.create({
    userId: recipient,
    eventId: eventId || undefined,
    title: `Message from ${req.user.fullName}`,
    message: message.body ? message.body.slice(0, 140) : `${attachments.length} attachment${attachments.length === 1 ? '' : 's'}`,
    type: 'Chat'
  }).catch((err) => {
    console.error('Failed to create chat notification:', err);
  });

  res.status(201).json(await Message.findById(message._id).populate('sender', userSelect).populate('recipient', userSelect));
});
