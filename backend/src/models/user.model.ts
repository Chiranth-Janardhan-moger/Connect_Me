import mongoose, { Schema, Document as MongooseDocument, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export enum UserRole {
    STUDENT = 'student',
    DRIVER = 'driver',
    ADMIN = 'admin'
}

export interface IUser extends MongooseDocument {
    _id: Types.ObjectId;
    rollNumber?: string; // Optional for admin and drivers, required for students
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    busId?: Types.ObjectId; // busId is optional for admin
    routeNumber?: number; // route number for students
    comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
    rollNumber: { 
        type: String,
        sparse: true,  // Only index documents where this field exists
        unique: true,  // Ensure uniqueness among students
        required: function(this: any) {
            // Required only if the role is student
            return this.role === UserRole.STUDENT;
        }
    },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    busId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Bus', 
        required: function(this: any) {
            // Required only if the role is driver
            return this.role === UserRole.DRIVER;
        }
    },
    routeNumber: {
        type: Number,
        required: function(this: any) {
            // Required only if the role is student
            return this.role === UserRole.STUDENT;
        }
    }
} as any);

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