import asyncHandler from 'express-async-handler';
import CalendarPlan from '../models/CalendarPlan.js';
import { isBoss } from '../middleware/auth.js';

function readableQuery(user) {
  if (isBoss(user)) return {};
  return { $or: [{ createdBy: user._id }, { visibility: 'Shared' }] };
}

function canModify(plan, user) {
  return isBoss(user) || String(plan.createdBy) === String(user._id);
}

export const listCalendarPlans = asyncHandler(async (req, res) => {
  const query = readableQuery(req.user);
  if (req.query.month) {
    const [year, month] = req.query.month.split('-').map(Number);
    if (year && month) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      query.date = { $gte: start, $lt: end };
    }
  }
  const plans = await CalendarPlan.find(query)
    .populate('createdBy', 'fullName username role department')
    .sort({ date: 1, startTime: 1, createdAt: 1 });
  res.json(plans);
});

export const createCalendarPlan = asyncHandler(async (req, res) => {
  const plan = await CalendarPlan.create({
    title: req.body.title,
    description: req.body.description || '',
    date: req.body.date,
    startTime: req.body.startTime || '',
    endTime: req.body.endTime || '',
    category: req.body.category || 'Task',
    status: req.body.status || 'Planned',
    visibility: req.body.visibility || 'Personal',
    createdBy: req.user._id
  });
  res.status(201).json(await CalendarPlan.findById(plan._id).populate('createdBy', 'fullName username role department'));
});

export const updateCalendarPlan = asyncHandler(async (req, res) => {
  const plan = await CalendarPlan.findById(req.params.id);
  if (!plan) return res.status(404).json({ message: 'Calendar plan not found' });
  if (!canModify(plan, req.user)) return res.status(403).json({ message: 'Forbidden' });

  plan.title = req.body.title ?? plan.title;
  plan.description = req.body.description ?? plan.description;
  plan.date = req.body.date ?? plan.date;
  plan.startTime = req.body.startTime ?? plan.startTime;
  plan.endTime = req.body.endTime ?? plan.endTime;
  plan.category = req.body.category ?? plan.category;
  plan.status = req.body.status ?? plan.status;
  plan.visibility = req.body.visibility ?? plan.visibility;
  await plan.save();

  res.json(await CalendarPlan.findById(plan._id).populate('createdBy', 'fullName username role department'));
});

export const deleteCalendarPlan = asyncHandler(async (req, res) => {
  const plan = await CalendarPlan.findById(req.params.id);
  if (!plan) return res.status(404).json({ message: 'Calendar plan not found' });
  if (!canModify(plan, req.user)) return res.status(403).json({ message: 'Forbidden' });

  await plan.deleteOne();
  res.json({ message: 'Calendar plan deleted' });
});
