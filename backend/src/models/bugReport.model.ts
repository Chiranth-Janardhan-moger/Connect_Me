import mongoose, { Schema, Document } from 'mongoose';

export interface IBugReport extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userRole: string;
  message: string;
  timestamp: Date;
  status: 'pending' | 'reviewed' | 'resolved';
  adminNotes?: string;
}

const BugReportSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userRole: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending',
  },
  adminNotes: {
    type: String,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
BugReportSchema.index({ status: 1, timestamp: -1 });

export default mongoose.model<IBugReport>('BugReport', BugReportSchema);
