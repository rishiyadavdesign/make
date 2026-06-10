import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { signToken } from '../utils/tokens.js';
import { normalizeFiles } from '../utils/fileStorage.js';

function duplicateMessage(err) {
  if (err?.code !== 11000) return null;
  const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
  return `${field} already exists. Use a different ${field}.`;
}

function sendAuth(res, user) {
  const plain = user.toObject();
  delete plain.password;
  res.json({ token: signToken(user), user: plain });
}

export const login = asyncHandler(async (req, res) => {
  const { identifier, password, accessCode } = req.body;
  const query = {
    $or: [{ username: String(identifier || '').toLowerCase() }, { email: String(identifier || '').toLowerCase() }]
  };
  if (accessCode) query.accessCode = accessCode;
  const user = await User.findOne(query).select('+password');

  if (!user || user.status !== 'Active' || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  sendAuth(res, user);
});

export const accessCodeLogin = asyncHandler(async (req, res) => {
  const { accessCode } = req.body;
  const user = await User.findOne({ accessCode });

  if (!user || user.status !== 'Active') {
    return res.status(401).json({ message: 'Invalid access code' });
  }

  sendAuth(res, user);
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password').populate('assignedEvents', 'eventName date venue status');
  res.json(user);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const allowed = ['fullName', 'username', 'email', 'phone', 'department', 'jobTitle', 'location', 'bio', 'emergencyContact'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });
  if (req.file) {
    const [profilePhoto] = await normalizeFiles([req.file]);
    user.profilePhoto = profilePhoto;
  }
  user.profileCompleted = Boolean(user.fullName);
  try {
    await user.save();
  } catch (err) {
    const message = duplicateMessage(err);
    if (message) return res.status(409).json({ message });
    throw err;
  }

  const fresh = await User.findById(user._id).select('-password').populate('assignedEvents', 'eventName date venue status');
  res.json(fresh);
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Current password and a new password of at least 6 characters are required' });
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user || !(await user.comparePassword(currentPassword))) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  user.isFirstLogin = false;
  await user.save();
  res.json({ message: 'Password updated' });
});

export const completeFirstLogin = asyncHandler(async (req, res) => {
  const { password, fullName, phone, department } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (password) user.password = password;
  if (fullName) user.fullName = fullName;
  if (phone !== undefined) user.phone = phone;
  if (department !== undefined) user.department = department;
  user.isFirstLogin = false;
  user.profileCompleted = true;
  await user.save();
  sendAuth(res, user);
});
