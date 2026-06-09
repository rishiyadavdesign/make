import asyncHandler from 'express-async-handler';
import Checklist from '../models/Checklist.js';
import Equipment from '../models/Equipment.js';
import Expense from '../models/Expense.js';
import Note from '../models/Note.js';
import Notification from '../models/Notification.js';
import Responsibility from '../models/Responsibility.js';
import Submission from '../models/Submission.js';
import Task from '../models/Task.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { canAccessEvent, eventIdsForUser } from '../utils/scope.js';
import { normalizeFiles } from '../utils/fileStorage.js';
import { isBoss, isManager, isMember } from '../middleware/auth.js';

const registry = {
  tasks: Task,
  equipment: Equipment,
  responsibilities: Responsibility,
  checklist: Checklist,
  notes: Note,
  notifications: Notification,
  submissions: Submission,
  expenses: Expense
};

const populateMap = {
  tasks: ['assignedTo', 'eventId'],
  equipment: ['responsiblePerson', 'eventId'],
  responsibilities: ['assignedTo', 'eventId'],
  checklist: ['assignedTo', 'eventId'],
  notes: ['createdBy', 'eventId'],
  notifications: ['userId', 'eventId'],
  submissions: ['taskId', 'eventId', 'submittedBy', 'reviewedBy'],
  expenses: ['eventId', 'submittedBy', 'reviewedBy']
};

function populate(query, type) {
  for (const field of populateMap[type] || []) query.populate(field, 'fullName username role eventName title');
  if (type === 'tasks') query.populate('comments.user', 'fullName username role');
  return query;
}

async function scopedQuery(type, user, reqQuery = {}) {
  const query = {};
  if (type === 'notifications') query.userId = user._id;

  if (isBoss(user)) {
    if (reqQuery.eventId) query.eventId = reqQuery.eventId;
    return query;
  }

  const eventIds = await eventIdsForUser(user);
  if (type !== 'notifications') {
    if (reqQuery.eventId) {
      query.eventId = eventIds.some((id) => String(id) === String(reqQuery.eventId)) ? reqQuery.eventId : null;
    } else {
      query.eventId = { $in: eventIds };
    }
  }

  if (isMember(user)) {
    if (type === 'tasks') query.assignedTo = user._id;
    if (type === 'equipment') query.responsiblePerson = user._id;
    if (['responsibilities', 'checklist'].includes(type)) query.assignedTo = user._id;
    if (type === 'submissions') query.submittedBy = user._id;
  }
  if (type === 'expenses' && !isBoss(user)) query.submittedBy = user._id;
  return query;
}

async function assertEventAccess(req, eventId) {
  if (!eventId || !(await canAccessEvent(req.user, eventId))) {
    req.res.status(403);
    throw new Error('Forbidden');
  }
}

async function notifyUser({ userId, eventId, title, message, type = 'Info' }) {
  if (!userId) return;
  await Notification.create({ userId, eventId, title, message, type });
}

export function listResource(type) {
  return asyncHandler(async (req, res) => {
    const Model = registry[type];
    const docs = await populate(Model.find(await scopedQuery(type, req.user, req.query)), type).sort({ createdAt: -1 });
    res.json(docs);
  });
}

export function createResource(type) {
  return asyncHandler(async (req, res) => {
    const Model = registry[type];
    if (type !== 'notifications') await assertEventAccess(req, req.body.eventId);
    if (type === 'notes') req.body.createdBy = req.user._id;
    if (isMember(req.user) && !['notes', 'submissions', 'expenses'].includes(type)) return res.status(403).json({ message: 'Forbidden' });
    if (type === 'submissions') {
      req.body.submittedBy = req.user._id;
      req.body.files = await normalizeFiles(req.files);
      req.body.status = 'Submitted';
      await Task.findByIdAndUpdate(req.body.taskId, {
        status: 'Submitted',
        submission: { text: req.body.message, files: req.body.files, submittedAt: new Date() }
      });
      const task = await Task.findById(req.body.taskId);
      await notifyUser({
        userId: task?.assignedTo,
        eventId: req.body.eventId,
        title: 'Work submitted',
        message: `${req.user.fullName} submitted work for "${task?.title || 'a task'}".`,
        type: 'Submission'
      });
    }
    if (type === 'tasks' && req.files?.length) req.body.attachments = await normalizeFiles(req.files);
    if (type === 'expenses') {
      req.body.submittedBy = req.user._id;
      req.body.receipts = await normalizeFiles(req.files);
      req.body.status = 'Submitted';
    }
    const doc = await Model.create(req.body);
    if (type === 'tasks') {
      await notifyUser({
        userId: doc.assignedTo,
        eventId: doc.eventId,
        title: 'Task assigned',
        message: `You have been assigned "${doc.title}".`,
        type: 'Task'
      });
    }
    if (type === 'equipment') {
      await notifyUser({
        userId: doc.responsiblePerson,
        eventId: doc.eventId,
        title: 'Equipment assigned',
        message: `You are responsible for ${doc.name}.`,
        type: 'Equipment'
      });
    }
    if (['responsibilities', 'checklist'].includes(type)) {
      await notifyUser({
        userId: doc.assignedTo,
        eventId: doc.eventId,
        title: type === 'checklist' ? 'Checklist assigned' : 'Responsibility assigned',
        message: doc.title,
        type: type === 'checklist' ? 'Checklist' : 'Responsibility'
      });
    }
    if (type === 'expenses') {
      const bosses = await User.find({ role: 'Boss/Admin', status: 'Active' }).select('_id');
      await Promise.all(bosses.map((boss) => notifyUser({
        userId: boss._id,
        eventId: doc.eventId,
        title: 'Expense submitted',
        message: `${req.user.fullName} submitted ${doc.title} for reimbursement.`,
        type: 'Expense'
      })));
    }
    res.status(201).json(await populate(Model.findById(doc._id), type));
  });
}

export function updateResource(type) {
  return asyncHandler(async (req, res) => {
    const Model = registry[type];
    const doc = await Model.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    if (doc.eventId) await assertEventAccess(req, doc.eventId);

    if (isMember(req.user)) {
      const ownTask = type === 'tasks' && String(doc.assignedTo) === String(req.user._id);
      const ownEquipment = type === 'equipment' && String(doc.responsiblePerson) === String(req.user._id);
      const ownChecklist = type === 'checklist' && String(doc.assignedTo) === String(req.user._id);
      const ownNotification = type === 'notifications' && String(doc.userId) === String(req.user._id);
      const ownExpense = type === 'expenses' && String(doc.submittedBy) === String(req.user._id);
      if (!ownTask && !ownEquipment && !ownChecklist && !ownNotification && !ownExpense) return res.status(403).json({ message: 'Forbidden' });
      if (type === 'tasks') req.body = { status: req.body.status, comments: req.body.comments };
      if (type === 'equipment') req.body = { status: req.body.status, notes: req.body.notes };
      if (type === 'checklist') req.body = { completed: req.body.completed };
      if (type === 'notifications') req.body = { isRead: req.body.isRead };
    }

    if (type === 'expenses' && !isBoss(req.user)) {
      if (String(doc.submittedBy) !== String(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
      if (!['Draft', 'Submitted', 'Revision Required', 'Rejected'].includes(doc.status)) {
        return res.status(403).json({ message: 'Reviewed expenses cannot be edited' });
      }
      req.body = {
        title: req.body.title,
        category: req.body.category,
        amount: req.body.amount,
        spentOn: req.body.spentOn,
        paymentMode: req.body.paymentMode,
        description: req.body.description,
        status: 'Submitted'
      };
      if (req.files?.length) req.body.receipts = await normalizeFiles(req.files);
    }

    Object.assign(doc, req.body);
    if (type === 'tasks' && req.files?.length) doc.attachments.push(...(await normalizeFiles(req.files)));
    await doc.save();
    res.json(await populate(Model.findById(doc._id), type));
  });
}

export function deleteResource(type) {
  return asyncHandler(async (req, res) => {
    const Model = registry[type];
    const doc = await Model.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    if (doc.eventId) await assertEventAccess(req, doc.eventId);
    if (isMember(req.user)) return res.status(403).json({ message: 'Forbidden' });
    if (type === 'expenses' && !isBoss(req.user)) {
      if (String(doc.submittedBy) !== String(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
      if (!['Draft', 'Submitted', 'Revision Required', 'Rejected'].includes(doc.status)) {
        return res.status(403).json({ message: 'Reviewed expenses cannot be deleted' });
      }
    }
    await doc.deleteOne();
    res.json({ message: 'Deleted' });
  });
}

export const reviewSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id);
  if (!submission) return res.status(404).json({ message: 'Submission not found' });
  await assertEventAccess(req, submission.eventId);
  if (!isBoss(req.user) && !isManager(req.user)) return res.status(403).json({ message: 'Forbidden' });
  submission.status = req.body.status;
  submission.feedback = req.body.feedback || '';
  submission.reviewedBy = req.user._id;
  await submission.save();
  await Task.findByIdAndUpdate(submission.taskId, {
    status: req.body.status === 'Approved' ? 'Approved' : 'Revision Required',
    feedback: submission.feedback
  });
  await notifyUser({
    userId: submission.submittedBy,
    eventId: submission.eventId,
    title: req.body.status === 'Approved' ? 'Submission approved' : 'Revision required',
    message: submission.feedback || 'Your submission has been reviewed.',
    type: 'Review'
  });
  res.json(await populate(Submission.findById(submission._id), 'submissions'));
});

export const reviewExpense = asyncHandler(async (req, res) => {
  if (!isBoss(req.user)) return res.status(403).json({ message: 'Forbidden' });
  const expense = await Expense.findById(req.params.id);
  if (!expense) return res.status(404).json({ message: 'Expense not found' });

  expense.status = req.body.status;
  expense.feedback = req.body.feedback || '';
  expense.reviewedBy = req.user._id;
  expense.reviewedAt = new Date();
  if (req.body.status === 'Paid') expense.paidAt = new Date();
  await expense.save();

  await notifyUser({
    userId: expense.submittedBy,
    eventId: expense.eventId,
    title: `Expense ${expense.status.toLowerCase()}`,
    message: expense.feedback || `Your expense "${expense.title}" is ${expense.status}.`,
    type: 'Expense'
  });

  res.json(await populate(Expense.findById(expense._id), 'expenses'));
});

export const dashboard = asyncHandler(async (req, res) => {
  const eventQuery = await scopedQuery('tasks', req.user, {});
  const eventIds = isBoss(req.user) ? null : eventQuery.eventId?.$in || [];
  const baseFilter = eventIds ? { eventId: { $in: eventIds } } : {};
  const taskFilter = { ...baseFilter };
  const equipmentFilter = { ...baseFilter };
  if (isMember(req.user)) {
    taskFilter.assignedTo = req.user._id;
    equipmentFilter.responsiblePerson = req.user._id;
  }
  const expenseFilter = isMember(req.user) || isManager(req.user) ? { ...baseFilter, submittedBy: req.user._id } : baseFilter;
  const [users, events, tasks, equipment, submissions, expenses] = await Promise.all([
    isBoss(req.user) ? User.countDocuments() : Promise.resolve(null),
    Event.countDocuments(isBoss(req.user) ? {} : { _id: { $in: eventIds } }),
    Task.aggregate([{ $match: taskFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Equipment.aggregate([{ $match: equipmentFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Submission.countDocuments(isMember(req.user) ? { ...baseFilter, submittedBy: req.user._id } : baseFilter),
    Expense.aggregate([{ $match: expenseFilter }, { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } }])
  ]);
  const pinnedEvent = req.user.pinnedEvent && (await canAccessEvent(req.user, req.user.pinnedEvent))
    ? await Event.findById(req.user.pinnedEvent)
      .populate('assignedManager', 'fullName role')
      .populate('teamMembers', 'fullName role')
    : null;
  res.json({ users, events, tasks, equipment, submissions, expenses, pinnedEvent });
});
