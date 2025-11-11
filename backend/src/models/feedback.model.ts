import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  routeNumber: number;
  driverId?: string;
  rating: number;
  category: string;
  comment?: string;
  sentiment: string;
  sentimentScore: number;
  timestamp: Date;
}

const FeedbackSchema = new Schema({
  routeNumber: { type: Number, required: true },
  driverId: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
  category: { type: String, required: true },
  comment: { type: String },
  sentiment: { type: String, default: 'neutral' },
  sentimentScore: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model<IFeedback>('Feedback', FeedbackSchema);
