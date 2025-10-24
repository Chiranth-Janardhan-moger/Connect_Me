// Fix: Add a triple-slash directive to include Node.js types and resolve type conflicts.
/// <reference types="node" />

import mongoose from 'mongoose';
import config from './index';

const connectDB = async () => {
    try {
        await mongoose.connect(config.mongoURI);
        console.log('MongoDB Connected...');
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
        } else {
            console.error('An unknown error occurred during DB connection');
        }
        process.exit(1);
    }
};

export default connectDB;
