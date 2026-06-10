import dotenv from 'dotenv';
import mongoose from 'mongoose';
import AppNote from '../src/models/AppNote.js';
import CalendarPlan from '../src/models/CalendarPlan.js';
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
  AppNote.deleteMany({}),
  CalendarPlan.deleteMany({}),
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
    importantInstructions: 'Coordinate gate branding and player tunnel checks before audience entry.',
    overviewDetails: [
      {
        category: 'Travel',
        title: 'Crew pickup from office',
        dateTime: '18/07/2026, 05:45 AM',
        location: 'BPS Office',
        assignedTo: manager._id,
        description: 'Team bus leaves sharp at 6:00 AM. Carry ID cards and event passes.'
      },
      {
        category: 'Reporting',
        title: 'Venue reporting point',
        dateTime: '18/07/2026, 08:00 AM',
        location: 'Gate 2 - Meerut Stadium',
        assignedTo: team._id,
        description: 'Report to operations desk before starting branding checks.'
      }
    ]
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
    importantInstructions: 'VIP lounge and sponsor stalls must be inspected one day before opening.',
    overviewDetails: [
      {
        category: 'Parking',
        title: 'Vendor parking entry',
        dateTime: '02/08/2026, 07:00 AM',
        location: 'Service Gate B',
        assignedTo: manager._id,
        description: 'Keep vendor vehicle list ready for security.'
      }
    ]
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
    importantInstructions: 'Keep reveal sequence confidential until rehearsal lock.',
    overviewDetails: [
      {
        category: 'Vendor',
        title: 'Stage reveal vendor call',
        dateTime: '20/08/2026, 01:00 PM',
        location: 'Main ballroom',
        assignedTo: manager._id,
        description: 'Confirm final cue sheet before rehearsal.'
      }
    ]
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
    importantInstructions: 'Confirm power backup for all digital screens.',
    overviewDetails: [
      {
        category: 'Travel',
        title: 'Equipment vehicle arrival',
        dateTime: '05/09/2026, 06:45 AM',
        location: 'Loading bay',
        assignedTo: team._id,
        description: 'Check microphones, cables, and screen backup before handover.'
      }
    ]
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

await AppNote.create([
  {
    title: 'Daily team standup points',
    description: 'Check assigned events, urgent tasks, equipment readiness, and expense approvals every morning.',
    category: 'Meeting',
    visibility: 'Shared',
    createdBy: boss._id
  },
  {
    title: 'Vendor follow-up list',
    description: 'Call stage, barricading, branding, and transport vendors before 5 PM.',
    category: 'Reminder',
    visibility: 'Personal',
    createdBy: manager._id
  },
  {
    title: 'Packing ideas',
    description: 'Keep spare batteries, tape, markers, extension boards, and rain cover in the event kit.',
    category: 'Idea',
    visibility: 'Shared',
    createdBy: team._id
  }
]);

await CalendarPlan.create([
  {
    title: 'Review event readiness dashboard',
    description: 'Check active event progress, pending approvals, expenses, and equipment alerts.',
    date: new Date('2026-07-01'),
    startTime: '10:00',
    category: 'Task',
    status: 'Planned',
    visibility: 'Personal',
    createdBy: boss._id
  },
  {
    title: 'Meerut T20 team planning',
    description: 'Plan July crew allocation and vendor follow-ups.',
    date: new Date('2026-07-05'),
    startTime: '11:30',
    category: 'Meeting',
    status: 'Planned',
    visibility: 'Shared',
    createdBy: manager._id
  },
  {
    title: 'Prepare event packing list',
    description: 'Add monthly packing checklist items and equipment reminders.',
    date: new Date('2026-07-08'),
    startTime: '16:00',
    category: 'Reminder',
    status: 'Planned',
    visibility: 'Personal',
    createdBy: team._id
  }
]);

console.log('Seed complete');
await mongoose.disconnect();
