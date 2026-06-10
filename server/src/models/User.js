import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    profilePhoto: { filename: String, path: String, mimetype: String, size: Number },
    jobTitle: { type: String, default: '' },
    location: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 500 },
    emergencyContact: { type: String, default: '' },
    password: { type: String, required: true, select: false },
    accessCode: { type: String, required: true, unique: true, trim: true },
    role: { type: String, enum: ['Boss/Admin', 'Project Manager', 'Team Member'], required: true },
    department: { type: String, default: '' },
    assignedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    pinnedEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    status: { type: String, enum: ['Active', 'Inactive', 'Suspended'], default: 'Active' },
    isFirstLogin: { type: Boolean, default: true },
    profileCompleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model('User', userSchema);
