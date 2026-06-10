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
    importantInstructions: { type: String, default: '' },
    overviewDetails: [
      {
        category: {
          type: String,
          enum: ['Travel', 'Hotel', 'Reporting', 'Vendor', 'Contact', 'Parking', 'Other'],
          default: 'Travel'
        },
        title: { type: String, required: true, trim: true },
        dateTime: { type: String, default: '' },
        location: { type: String, default: '' },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        description: { type: String, default: '' }
      }
    ]
  },
  { timestamps: true }
);

eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ assignedManager: 1, date: 1 });
eventSchema.index({ teamMembers: 1, date: 1 });

export default mongoose.model('Event', eventSchema);
