"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bus_repository_1 = __importDefault(require("../repositories/bus.repository"));
const bus_model_1 = require("../../models/bus.model");
const socket_service_1 = require("../../services/socket.service");
class DriverService {
    async startTrip(driverId) {
        const bus = await bus_repository_1.default.findByDriverId(driverId);
        if (!bus) {
            throw new Error('Bus not found for this driver.');
        }
        if (bus.tripStatus === bus_model_1.TripStatus.ON_ROUTE) {
            throw new Error('Trip is already in progress.');
        }
        // Set trip to ON_ROUTE
        // CLEAR all previous location data to start fresh
        bus.tripStatus = bus_model_1.TripStatus.ON_ROUTE;
        bus.currentLat = undefined;
        bus.currentLon = undefined;
        bus.locationHistory = []; // Clear history for the new trip
        bus.lastUpdated = new Date();
        return bus_repository_1.default.save(bus);
    }
    async endTrip(driverId) {
        const bus = await bus_repository_1.default.findByDriverId(driverId);
        if (!bus) {
            throw new Error('Bus not found for this driver.');
        }
        if (bus.tripStatus !== bus_model_1.TripStatus.ON_ROUTE) {
            throw new Error('No trip is currently in progress to end.');
        }
        // Set trip to NOT_STARTED (reset for next trip)
        // Clear ALL location data
        bus.tripStatus = bus_model_1.TripStatus.NOT_STARTED;
        bus.currentLat = undefined;
        bus.currentLon = undefined;
        bus.locationHistory = []; // Clear history
        bus.lastUpdated = new Date();
        // Notify all students on this route that trip has ended
        (0, socket_service_1.notifyTripEnded)(bus.routeNumber);
        return bus_repository_1.default.save(bus);
    }
}
exports.default = new DriverService();
