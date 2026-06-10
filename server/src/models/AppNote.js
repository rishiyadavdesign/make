import mongoose from 'mongoose';

const appNoteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['General', 'Idea', 'Reminder', 'Meeting', 'Issue', 'Important'],
      default: 'General'
    },
    visibility: {
      type: String,
      enum: ['Personal', 'Shared'],
      default: 'Personal'
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

export default mongoose.model('AppNote', appNoteSchema);
