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

export default mongoose.model('Equipment', equipmentSchema);
