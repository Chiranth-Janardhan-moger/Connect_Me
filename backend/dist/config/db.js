"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Fix: Add a triple-slash directive to include Node.js types and resolve type conflicts.
/// <reference types="node" />
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = __importDefault(require("./index"));
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(index_1.default.mongoURI);
        console.log('MongoDB Connected...');
    }
    catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
        }
        else {
            console.error('An unknown error occurred during DB connection');
        }
        process.exit(1);
    }
};
exports.default = connectDB;
