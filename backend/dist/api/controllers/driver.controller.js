"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.endTrip = exports.startTrip = void 0;
const driver_service_1 = __importDefault(require("../services/driver.service"));
const startTrip = async (req, res) => {
    const driverId = req.user?.id;
    if (!driverId) {
        return res.status(401).json({ message: "Authentication required." });
    }
    try {
        const updatedBus = await driver_service_1.default.startTrip(driverId);
        res.json({ message: 'Trip started successfully.', tripStatus: updatedBus.tripStatus });
    }
    catch (error) {
        console.error('Start trip error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        if (errorMessage.includes('not found')) {
            return res.status(404).json({ message: errorMessage });
        }
        if (errorMessage.includes('already in progress')) {
            return res.status(409).json({ message: errorMessage });
        }
        res.status(500).json({ message: 'Server error while starting trip.' });
    }
};
exports.startTrip = startTrip;
const endTrip = async (req, res) => {
    const driverId = req.user?.id;
    if (!driverId) {
        return res.status(401).json({ message: "Authentication required." });
    }
    try {
        const updatedBus = await driver_service_1.default.endTrip(driverId);
        res.json({ message: 'Trip ended successfully.', tripStatus: updatedBus.tripStatus });
    }
    catch (error) {
        console.error('End trip error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        if (errorMessage.includes('not found')) {
            return res.status(404).json({ message: errorMessage });
        }
        if (errorMessage.includes('No trip is currently in progress')) {
            return res.status(400).json({ message: errorMessage });
        }
        res.status(500).json({ message: 'Server error while ending trip.' });
    }
};
exports.endTrip = endTrip;
