

import mongoose, { Schema, Document as MongooseDocument, Types } from 'mongoose';

export enum TripStatus {
    NOT_STARTED = 'NOT_STARTED',
    ON_ROUTE = 'ON_ROUTE',
    REACHED = 'REACHED'
}

interface ILocationHistory {
    lat: number;
    lon: number;
    timestamp: Date;
}

// FIX: Alias Document to MongooseDocument to avoid name collision with DOM's Document type.
export interface IBus extends MongooseDocument {
    // FIX: Explicitly define _id to prevent type errors
    _id: Types.ObjectId;
    busNumber: string;
    routeId: Types.ObjectId;
    driverId: Types.ObjectId;
    currentLat?: number;
    currentLon?: number;
    tripStatus: TripStatus;
    lastUpdated?: Date;
    locationHistory: ILocationHistory[];
}

const LocationHistorySchema: Schema = new Schema({
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
});

const BusSchema: Schema = new Schema({
    busNumber: { type: String, required: true, unique: true },
    routeId: { type: Schema.Types.ObjectId, ref: 'Route', required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    currentLat: { type: Number },
    currentLon: { type: Number },
    tripStatus: { type: String, enum: Object.values(TripStatus), default: TripStatus.NOT_STARTED },
    lastUpdated: { type: Date },
    locationHistory: [LocationHistorySchema]
});

const Bus = mongoose.model<IBus>('Bus', BusSchema);
export default Bus;