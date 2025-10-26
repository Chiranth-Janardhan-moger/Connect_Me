

import mongoose, { Schema, Document as MongooseDocument, Types } from 'mongoose';

interface IStop {
    lat: number;
    lon: number;
    label: string;
}

// FIX: Alias Document to MongooseDocument to avoid name collision with DOM's Document type.
export interface IRoute extends MongooseDocument {
    // FIX: Explicitly define _id to prevent type errors
    _id: Types.ObjectId;
    name: string;
    stops: IStop[];
}

const StopSchema: Schema = new Schema({
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    label: { type: String, required: true }
});

const RouteSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    stops: { type: [StopSchema], required: true }
});

const Route = mongoose.model<IRoute>('Route', RouteSchema);
export default Route;