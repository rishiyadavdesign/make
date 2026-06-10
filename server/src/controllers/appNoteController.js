import asyncHandler from 'express-async-handler';
import AppNote from '../models/AppNote.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { isBoss } from '../middleware/auth.js';

function readableQuery(user) {
  if (isBoss(user)) return {};
  return { $or: [{ createdBy: user._id }, { visibility: 'Shared' }] };
}

async function canModify(note, user) {
  return isBoss(user) || String(note.createdBy) === String(user._id);
}

export const listAppNotes = asyncHandler(async (req, res) => {
  const notes = await AppNote.find(readableQuery(req.user))
    .populate('createdBy', 'fullName username role department')
    .sort({ updatedAt: -1 });
  res.json(notes);
});

export const createAppNote = asyncHandler(async (req, res) => {
  const note = await AppNote.create({
    title: req.body.title,
    description: req.body.description || '',
    category: req.body.category || 'General',
    visibility: req.body.visibility || 'Personal',
    createdBy: req.user._id
  });
  if (note.visibility === 'Shared') {
    const recipients = await User.find({ _id: { $ne: req.user._id }, status: 'Active' }).select('_id');
    await Promise.all(recipients.map((recipient) => Notification.create({
      userId: recipient._id,
      title: 'Shared note added',
      message: `${req.user.fullName} shared "${note.title}".`,
      type: 'Note'
    })));
  }
  res.status(201).json(await AppNote.findById(note._id).populate('createdBy', 'fullName username role department'));
});

export const updateAppNote = asyncHandler(async (req, res) => {
  const note = await AppNote.findById(req.params.id);
  if (!note) return res.status(404).json({ message: 'Note not found' });
  if (!(await canModify(note, req.user))) return res.status(403).json({ message: 'Forbidden' });

  note.title = req.body.title ?? note.title;
  note.description = req.body.description ?? note.description;
  note.category = req.body.category ?? note.category;
  note.visibility = req.body.visibility ?? note.visibility;
  await note.save();

  res.json(await AppNote.findById(note._id).populate('createdBy', 'fullName username role department'));
});

export const deleteAppNote = asyncHandler(async (req, res) => {
  const note = await AppNote.findById(req.params.id);
  if (!note) return res.status(404).json({ message: 'Note not found' });
  if (!(await canModify(note, req.user))) return res.status(403).json({ message: 'Forbidden' });

  await note.deleteOne();
  res.json({ message: 'Note deleted' });
});
