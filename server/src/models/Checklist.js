import mongoose from 'mongoose';

const checklistSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    section: { type: String, enum: ['Before Event', 'During Event', 'After Event'], required: true },
    title: { type: String, required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    completed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

checklistSchema.index({ eventId: 1, section: 1 });
checklistSchema.index({ assignedTo: 1, completed: 1 });
checklistSchema.index({ eventId: 1, assignedTo: 1 });

export default mongoose.model('Checklist', checklistSchema);
