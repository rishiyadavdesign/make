import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['Travel', 'Food', 'Accommodation', 'Equipment', 'Vendor', 'Fuel', 'Other'],
      default: 'Other'
    },
    amount: { type: Number, required: true, min: 0 },
    spentOn: { type: Date, required: true },
    paymentMode: { type: String, enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Other'], default: 'Cash' },
    description: { type: String, default: '' },
    receipts: [{ filename: String, path: String, mimetype: String, size: Number }],
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Approved', 'Rejected', 'Paid', 'Revision Required'],
      default: 'Submitted'
    },
    feedback: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    paidAt: Date
  },
  { timestamps: true }
);

expenseSchema.index({ eventId: 1, createdAt: -1 });
expenseSchema.index({ submittedBy: 1, status: 1 });
expenseSchema.index({ status: 1, spentOn: -1 });

export default mongoose.model('Expense', expenseSchema);
