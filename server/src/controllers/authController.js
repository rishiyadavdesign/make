import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { signToken } from '../utils/tokens.js';

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
  res.json(req.user);
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
