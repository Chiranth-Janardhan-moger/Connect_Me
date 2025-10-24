

import mongoose, { Schema, Document as MongooseDocument, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export enum UserRole {
    STUDENT = 'student',
    DRIVER = 'driver',
    ADMIN = 'admin'
}

// FIX: Alias Document to MongooseDocument to avoid name collision with DOM's Document type.
export interface IUser extends MongooseDocument {
    // FIX: Explicitly define _id to prevent type errors
    _id: Types.ObjectId;
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    busId?: Types.ObjectId; // busId is optional for admin
    comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    busId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Bus', 
        required: function(this: IUser) {
            // Required only if the role is student or driver
            return this.role === UserRole.STUDENT || this.role === UserRole.DRIVER;
        }
    }
});

UserSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('passwordHash')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
});

UserSchema.methods.comparePassword = function (password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
};

const User = mongoose.model<IUser>('User', UserSchema);
export default User;