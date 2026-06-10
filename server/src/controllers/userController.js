import asyncHandler from 'express-async-handler';
import Event from '../models/Event.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

function duplicateMessage(err) {
  if (err?.code !== 11000) return null;
  const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
  return `${field} already exists. Use a different ${field}.`;
}

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().select('-password').populate('assignedEvents', 'eventName date venue');
  res.json(users);
});

export const createUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(await User.findById(user._id).select('-password'));
  } catch (err) {
    const message = duplicateMessage(err);
    if (message) return res.status(409).json({ message });
    throw err;
  }
});

export const updateUser = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (!data.password) delete data.password;
  const user = await User.findById(req.params.id).select('+password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  try {
    Object.assign(user, data);
    await user.save();
    res.json(await User.findById(user._id).select('-password'));
  } catch (err) {
    const message = duplicateMessage(err);
    if (message) return res.status(409).json({ message });
    throw err;
  }
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { status: 'Inactive' }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

export const removeUser = asyncHandler(async (req, res) => {
  if (String(req.user._id) === String(req.params.id)) {
    return res.status(400).json({ message: 'You cannot remove your own Boss/Admin account.' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  await Event.updateMany({ teamMembers: user._id }, { $pull: { teamMembers: user._id } });
  await Event.updateMany({ assignedManager: user._id }, { $unset: { assignedManager: '' } });
  await Notification.deleteMany({ userId: user._id });
  await Message.deleteMany({ $or: [{ sender: user._id }, { recipient: user._id }] });
  await user.deleteOne();

  res.json({ message: 'User removed permanently' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('+password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.password = req.body.password || `${user.username}@123`;
  user.isFirstLogin = true;
  await user.save();
  res.json({ message: 'Password reset', temporaryPassword: req.body.password || `${user.username}@123` });
});

export const generateAccessCode = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.accessCode = `BPS-${user.role.split(' ')[0].toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  await user.save();
  res.json({ accessCode: user.accessCode });
});
