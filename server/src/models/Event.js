import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    eventName: { type: String, required: true, trim: true },
    clientName: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    venue: { type: String, required: true },
    reportingTime: { type: String, default: '' },
    description: { type: String, default: '' },
    status: { type: String, enum: ['Planning', 'Active', 'Completed', 'Cancelled'], default: 'Planning' },
    assignedManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    importantInstructions: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model('Event', eventSchema);
