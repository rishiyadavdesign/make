import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String
  },
  { timestamps: true }
);

const taskSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    title: { type: String, required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
    deadline: Date,
    description: { type: String, default: '' },
    deliverables: { type: String, default: '' },
    referenceLinks: [{ type: String }],
    attachments: [{ filename: String, path: String, mimetype: String, size: Number }],
    approvalCriteria: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Submitted', 'Approved', 'Revision Required', 'Overdue'],
      default: 'Pending'
    },
    comments: [commentSchema],
    submission: {
      text: String,
      files: [{ filename: String, path: String, mimetype: String, size: Number }],
      submittedAt: Date
    },
    feedback: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model('Task', taskSchema);
