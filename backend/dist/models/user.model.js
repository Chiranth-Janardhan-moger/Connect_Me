"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
var UserRole;
(function (UserRole) {
    UserRole["STUDENT"] = "student";
    UserRole["DRIVER"] = "driver";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
const UserSchema = new mongoose_1.Schema({
    rollNumber: {
        type: String,
        sparse: true, // Only index documents where this field exists
        unique: true, // Ensure uniqueness among students
        required: function () {
            // Required only if the role is student
            return this.role === UserRole.STUDENT;
        }
    },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    busId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Bus',
        required: function () {
            // Required only if the role is driver
            return this.role === UserRole.DRIVER;
        }
    },
    routeNumber: {
        type: Number,
        required: function () {
            // Required only if the role is student
            return this.role === UserRole.STUDENT;
        }
    },
    expoPushToken: { type: String }, // Expo Push Token for notifications
    fcmToken: { type: String } // Deprecated - keeping for backward compatibility
});
UserSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) {
        return next();
    }
    const salt = await bcryptjs_1.default.genSalt(10);
    this.passwordHash = await bcryptjs_1.default.hash(this.passwordHash, salt);
    next();
});
UserSchema.methods.comparePassword = function (password) {
    return bcryptjs_1.default.compare(password, this.passwordHash);
};
const User = mongoose_1.default.model('User', UserSchema);
exports.default = User;
