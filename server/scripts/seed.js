import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Checklist from '../src/models/Checklist.js';
import Equipment from '../src/models/Equipment.js';
import Expense from '../src/models/Expense.js';
import Event from '../src/models/Event.js';
import Note from '../src/models/Note.js';
import Notification from '../src/models/Notification.js';
import Message from '../src/models/Message.js';
import Responsibility from '../src/models/Responsibility.js';
import Submission from '../src/models/Submission.js';
import Task from '../src/models/Task.js';
import User from '../src/models/User.js';

dotenv.config();

await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bps_event_portal');

await Promise.all([
  User.deleteMany({}),
  Event.deleteMany({}),
  Task.deleteMany({}),
  Equipment.deleteMany({}),
  Expense.deleteMany({}),
  Responsibility.deleteMany({}),
  Checklist.deleteMany({}),
  Note.deleteMany({}),
  Message.deleteMany({}),
  Notification.deleteMany({}),
  Submission.deleteMany({})
]);

const [boss, manager, team] = await User.create([
  {
    fullName: 'Rishi BPS',
    username: 'rishi',
    email: 'rishi@bps.com',
    password: 'Rishi@123',
    accessCode: 'BPS-TEAM-001',
    role: 'Boss/Admin',
    department: 'Leadership',
    isFirstLogin: false,
    profileCompleted: true
  },
  {
    fullName: 'BPS Project Manager',
    username: 'manager',
    email: 'manager@bps.com',
    password: 'Manager@123',
    accessCode: 'BPS-MANAGER-001',
    role: 'Project Manager',
    department: 'Operations',
    isFirstLogin: false,
    profileCompleted: true
  },
  {
    fullName: 'BPS Team Member',
    username: 'team',
    email: 'team@bps.com',
    password: 'Team@123',
    accessCode: 'BPS-MEMBER-001',
    role: 'Team Member',
    department: 'Production',
    isFirstLogin: false,
    profileCompleted: true
  }
]);

const events = await Event.create([
  {
    eventName: 'Meerut T20 League',
    clientName: 'Meerut Sports Council',
    date: new Date('2026-07-18'),
    venue: 'Meerut Stadium',
    reportingTime: '08:00',
    description: 'Opening ceremony and match-day event production.',
    status: 'Active',
    assignedManager: manager._id,
    teamMembers: [team._id],
    importantInstructions: 'Coordinate gate branding and player tunnel checks before audience entry.'
  },
  {
    eventName: 'Wedding Asia',
    clientName: 'Wedding Asia Expo',
    date: new Date('2026-08-02'),
    venue: 'India Expo Centre',
    reportingTime: '09:30',
    description: 'Premium wedding exhibition setup and live operations.',
    status: 'Planning',
    assignedManager: manager._id,
    teamMembers: [team._id],
    importantInstructions: 'VIP lounge and sponsor stalls must be inspected one day before opening.'
  },
  {
    eventName: 'Aura Launch Event',
    clientName: 'Aura Lifestyle',
    date: new Date('2026-08-20'),
    venue: 'The Grand, New Delhi',
    reportingTime: '12:00',
    description: 'Product launch with stage reveal and media desk.',
    status: 'Planning',
    assignedManager: manager._id,
    teamMembers: [team._id],
    importantInstructions: 'Keep reveal sequence confidential until rehearsal lock.'
  },
  {
    eventName: 'UP T20',
    clientName: 'UP Cricket Association',
    date: new Date('2026-09-05'),
    venue: 'Lucknow Cricket Ground',
    reportingTime: '07:30',
    description: 'League fixture operations, fan zones, and sponsor activations.',
    status: 'Planning',
    assignedManager: manager._id,
    teamMembers: [team._id],
    importantInstructions: 'Confirm power backup for all digital screens.'
  }
]);

await User.updateMany({ _id: { $in: [manager._id, team._id] } }, { assignedEvents: events.map((event) => event._id) });

for (const event of events) {
  const task = await Task.create({
    eventId: event._id,
    title: `Prepare production checklist for ${event.eventName}`,
    assignedTo: team._id,
    priority: 'High',
    deadline: new Date(event.date.getTime() - 3 * 24 * 60 * 60 * 1000),
    description: 'Verify branding, signage, entry flow, stage, power, and crew reporting points.',
    deliverables: 'Updated checklist with photos or comments for each area.',
    referenceLinks: ['https://bps.example/reference'],
    approvalCriteria: 'All critical areas marked ready or escalated.'
  });

  await Equipment.create({
    eventId: event._id,
    name: 'Wireless Microphones',
    quantity: 8,
    responsiblePerson: team._id,
    status: 'Assigned',
    notes: 'Charge batteries and carry spare receivers.'
  });

  await Responsibility.create({
    eventId: event._id,
    title: 'Entry Gate Coordination',
    assignedTo: team._id,
    description: 'Coordinate queue lanes, signage placement, and gate opening readiness.'
  });

  await Checklist.create([
    { eventId: event._id, section: 'Before Event', title: 'Venue branding installed', assignedTo: team._id },
    { eventId: event._id, section: 'During Event', title: 'Monitor stage communication', assignedTo: team._id },
    { eventId: event._id, section: 'After Event', title: 'Return assigned equipment', assignedTo: team._id }
  ]);

  await Note.create({
    eventId: event._id,
    title: 'Manager instruction',
    description: 'Daily progress update required by 6 PM.',
    createdBy: manager._id,
    type: 'General'
  });

  await Notification.create({
    userId: team._id,
    eventId: event._id,
    title: 'Task assigned',
    message: `You have been assigned "${task.title}".`,
    type: 'Task'
  });

  await Expense.create({
    eventId: event._id,
    submittedBy: team._id,
    title: `Travel reimbursement for ${event.eventName}`,
    category: 'Travel',
    amount: 1200,
    spentOn: new Date(event.date.getTime() - 1 * 24 * 60 * 60 * 1000),
    paymentMode: 'UPI',
    description: 'Local travel for pre-event venue coordination.',
    status: 'Submitted'
  });
}

await Message.create([
  {
    sender: boss._id,
    recipient: manager._id,
    body: 'Please keep the Meerut T20 League team updated in the portal chat.'
  },
  {
    sender: manager._id,
    recipient: team._id,
    body: 'Share packing status here before leaving for the venue.'
  },
  {
    sender: team._id,
    recipient: boss._id,
    body: 'I will update task status and equipment status from the event workspace.'
  }
]);

console.log('Seed complete');
await mongoose.disconnect();
