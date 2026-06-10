import mongoose from 'mongoose';

const equipmentSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    responsiblePerson: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['Required', 'Assigned', 'Packed', 'Brought to Event', 'Missing', 'Returned'],
      default: 'Required'
    },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

equipmentSchema.index({ eventId: 1, createdAt: -1 });
equipmentSchema.index({ responsiblePerson: 1, status: 1 });
equipmentSchema.index({ eventId: 1, responsiblePerson: 1 });

export default mongoose.model('Equipment', equipmentSchema);
