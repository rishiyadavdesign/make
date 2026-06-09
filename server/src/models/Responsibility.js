import mongoose from 'mongoose';

const responsibilitySchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    title: { type: String, required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model('Responsibility', responsibilitySchema);
