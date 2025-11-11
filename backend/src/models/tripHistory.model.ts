import mongoose, { Schema, Document } from 'mongoose';

export interface ITripHistory extends Document {
  routeNumber: number;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  distance: number; // km
  dayOfWeek: number; // 0-6
  hourOfDay: number; // 0-23
  createdAt: Date;
}

const TripHistorySchema = new Schema({
  routeNumber: { type: Number, required: true, index: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  duration: { type: Number, required: true },
  distance: { type: Number, required: true },
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  hourOfDay: { type: Number, required: true, min: 0, max: 23 },
  createdAt: { type: Date, default: Date.now },
});

// Index for efficient queries
TripHistorySchema.index({ routeNumber: 1, dayOfWeek: 1, hourOfDay: 1 });
TripHistorySchema.index({ startTime: -1 });

export default mongoose.model<ITripHistory>('TripHistory', TripHistorySchema);
