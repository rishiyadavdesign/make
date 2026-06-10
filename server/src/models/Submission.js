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

submissionSchema.index({ eventId: 1, createdAt: -1 });
submissionSchema.index({ submittedBy: 1, status: 1 });
submissionSchema.index({ taskId: 1 });

export default mongoose.model('Submission', submissionSchema);
