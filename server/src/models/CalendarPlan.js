import mongoose from 'mongoose';

const calendarPlanSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    date: { type: Date, required: true },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    category: {
      type: String,
      enum: ['Task', 'Meeting', 'Reminder', 'Travel', 'Follow Up', 'Personal'],
      default: 'Task'
    },
    status: {
      type: String,
      enum: ['Planned', 'In Progress', 'Done', 'Cancelled'],
      default: 'Planned'
    },
    visibility: {
      type: String,
      enum: ['Personal', 'Shared'],
      default: 'Personal'
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

export default mongoose.model('CalendarPlan', calendarPlanSchema);
