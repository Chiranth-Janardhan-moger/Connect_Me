import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  roomId: string;
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  senderRole: 'student' | 'driver' | 'admin';
  encryptedContent: string;
  timestamp: Date;
  expiresAt: Date;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['student', 'driver', 'admin'],
      required: true,
    },
    encryptedContent: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index - auto-delete messages after expiration
MessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for efficient queries
MessageSchema.index({ roomId: 1, timestamp: -1 });

export default mongoose.model<IMessage>('Message', MessageSchema);
