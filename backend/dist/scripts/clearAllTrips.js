"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../config/db"));
const bus_model_1 = __importDefault(require("../models/bus.model"));
const clearAllTrips = async () => {
    try {
        await (0, db_1.default)();
        console.log('🧹 Clearing all trip data...');
        // Reset all buses to NOT_STARTED and clear locations
        const result = await bus_model_1.default.updateMany({}, {
            $set: {
                tripStatus: 'NOT_STARTED',
                currentLat: null,
                currentLon: null,
                locationHistory: [],
                lastUpdated: new Date()
            }
        });
        console.log(`✅ Reset ${result.modifiedCount} buses`);
        console.log('All trips cleared successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error clearing trips:', error);
        process.exit(1);
    }
};
clearAllTrips();
