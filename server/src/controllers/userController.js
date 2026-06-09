import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().select('-password').populate('assignedEvents', 'eventName date venue');
  res.json(users);
});

export const createUser = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json(await User.findById(user._id).select('-password'));
});

export const updateUser = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (!data.password) delete data.password;
  const user = await User.findById(req.params.id).select('+password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  Object.assign(user, data);
  await user.save();
  res.json(await User.findById(user._id).select('-password'));
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { status: 'Inactive' }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
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
