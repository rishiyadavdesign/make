import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, default: '' },
    files: [{ filename: String, path: String, mimetype: String, size: Number }],
    status: { type: String, enum: ['Submitted', 'Approved', 'Rejected', 'Revision Required'], default: 'Submitted' },
    feedback: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export default mongoose.model('Submission', submissionSchema);
