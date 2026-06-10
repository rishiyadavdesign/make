import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['General', 'Entry Gate', 'Parking', 'Emergency', 'Schedule Change'],
      default: 'General'
    }
  },
  { timestamps: true }
);

noteSchema.index({ eventId: 1, createdAt: -1 });
noteSchema.index({ createdBy: 1 });
noteSchema.index({ type: 1 });

export default mongoose.model('Note', noteSchema);
