import mongoose, { Schema, Document } from 'mongoose';

export interface IAppVersion extends Document {
    version: string;
    downloadUrl: string;
    updatedAt: Date;
}

const AppVersionSchema: Schema = new Schema({
    version: {
        type: String,
        required: true,
    },
    downloadUrl: {
        type: String,
        required: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model<IAppVersion>('AppVersion', AppVersionSchema);
