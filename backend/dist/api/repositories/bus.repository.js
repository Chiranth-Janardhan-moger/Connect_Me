"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bus_model_1 = __importDefault(require("../../models/bus.model"));
const route_repository_1 = __importDefault(require("./route.repository"));
class BusRepository {
    /**
     * Find bus by driver ID
     */
    async findByDriverId(driverId) {
        try {
            return await bus_model_1.default.findOne({ driverId }).exec();
        }
        catch (error) {
            console.error('Error finding bus by driver ID:', error);
            throw error;
        }
    }
    /**
     * Find bus by MongoDB ObjectId with validation
     */
    async findById(id) {
        try {
            // Validate if id is a valid ObjectId
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                console.warn(`Invalid ObjectId: ${id}`);
                return null;
            }
            return await bus_model_1.default.findById(id).exec();
        }
        catch (error) {
            console.error('Error finding bus by ID:', error);
            throw error;
        }
    }
    /**
     * Find bus by ID and populate related data
     */
    async findByIdAndPopulate(id, populatePath) {
        try {
            // Validate if id is a valid ObjectId
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                console.warn(`Invalid ObjectId: ${id}`);
                return null;
            }
            return await bus_model_1.default.findById(id).populate(populatePath).exec();
        }
        catch (error) {
            console.error('Error finding and populating bus by ID:', error);
            throw error;
        }
    }
    /**
     * Find bus by bus number (unique identifier like "BUS-001")
     */
    async findByBusNumber(busNumber) {
        try {
            return await bus_model_1.default.findOne({ busNumber }).exec();
        }
        catch (error) {
            console.error('Error finding bus by bus number:', error);
            throw error;
        }
    }
    /**
     * Find bus by route number (1, 2, 3, etc.)
     * This is the primary method used for real-time tracking
     * Returns the most recently updated bus for the route
     */
    async findByRouteNumber(routeNumber) {
        try {
            // Find active bus on this route (ON_ROUTE or NOT_STARTED)
            const bus = await bus_model_1.default.findOne({
                routeNumber: routeNumber,
                tripStatus: { $in: ['ON_ROUTE', 'NOT_STARTED'] }
            })
                .sort({ lastUpdated: -1 }) // Get most recent
                .exec();
            return bus;
        }
        catch (error) {
            console.error('Error finding bus by route number:', error);
            throw error;
        }
    }
    /**
     * Find all buses for a specific route number
     * Useful for historical data or multiple buses on same route
     */
    async findAllByRouteNumber(routeNumber) {
        try {
            return await bus_model_1.default.find({ routeNumber })
                .sort({ lastUpdated: -1 })
                .exec();
        }
        catch (error) {
            console.error('Error finding all buses by route number:', error);
            throw error;
        }
    }
    /**
     * Find route information by route number
     */
    async findRouteByNumber(routeNumber) {
        try {
            return await route_repository_1.default.findByRouteNumber(routeNumber);
        }
        catch (error) {
            console.error('Error finding route by number:', error);
            throw error;
        }
    }
    /**
     * Find active bus on route (currently ON_ROUTE)
     */
    async findActiveByRouteNumber(routeNumber) {
        try {
            return await bus_model_1.default.findOne({
                routeNumber: routeNumber,
                tripStatus: 'ON_ROUTE'
            })
                .sort({ lastUpdated: -1 })
                .exec();
        }
        catch (error) {
            console.error('Error finding active bus by route number:', error);
            throw error;
        }
    }
    /**
     * Get current location of bus by route number
     * Returns only location data for performance
     */
    async getLocationByRouteNumber(routeNumber) {
        try {
            const bus = await bus_model_1.default.findOne({
                routeNumber: routeNumber,
                tripStatus: 'ON_ROUTE',
                currentLat: { $exists: true },
                currentLon: { $exists: true }
            })
                .select('currentLat currentLon lastUpdated')
                .sort({ lastUpdated: -1 })
                .exec();
            if (!bus || !bus.currentLat || !bus.currentLon) {
                return null;
            }
            return {
                latitude: bus.currentLat,
                longitude: bus.currentLon,
                lastUpdated: bus.lastUpdated || new Date()
            };
        }
        catch (error) {
            console.error('Error getting location by route number:', error);
            throw error;
        }
    }
    /**
     * Update bus location
     */
    async updateLocation(busId, latitude, longitude) {
        try {
            const bus = await this.findById(busId);
            if (!bus) {
                console.warn(`Bus not found: ${busId}`);
                return null;
            }
            bus.currentLat = latitude;
            bus.currentLon = longitude;
            bus.lastUpdated = new Date();
            // Add to location history
            if (!bus.locationHistory) {
                bus.locationHistory = [];
            }
            bus.locationHistory.push({
                lat: latitude,
                lon: longitude,
                timestamp: new Date()
            });
            // Keep only last 100 location points to prevent huge documents
            if (bus.locationHistory.length > 100) {
                bus.locationHistory = bus.locationHistory.slice(-100);
            }
            return await bus.save();
        }
        catch (error) {
            console.error('Error updating bus location:', error);
            throw error;
        }
    }
    /**
     * Update trip status
     */
    async updateTripStatus(busId, status) {
        try {
            const bus = await this.findById(busId);
            if (!bus) {
                console.warn(`Bus not found: ${busId}`);
                return null;
            }
            bus.tripStatus = status;
            bus.lastUpdated = new Date();
            return await bus.save();
        }
        catch (error) {
            console.error('Error updating trip status:', error);
            throw error;
        }
    }
    /**
     * Get all buses with their current status
     */
    async findAll() {
        try {
            return await bus_model_1.default.find()
                .sort({ routeNumber: 1 })
                .exec();
        }
        catch (error) {
            console.error('Error finding all buses:', error);
            throw error;
        }
    }
    /**
     * Get all active trips (buses currently ON_ROUTE)
     */
    async findAllActive() {
        try {
            return await bus_model_1.default.find({ tripStatus: 'ON_ROUTE' })
                .sort({ routeNumber: 1 })
                .exec();
        }
        catch (error) {
            console.error('Error finding all active buses:', error);
            throw error;
        }
    }
    /**
     * Create new bus record
     */
    async create(busData) {
        try {
            const bus = new bus_model_1.default(busData);
            return await bus.save();
        }
        catch (error) {
            console.error('Error creating bus:', error);
            throw error;
        }
    }
    /**
     * Save/update bus document
     */
    async save(bus) {
        try {
            return await bus.save();
        }
        catch (error) {
            console.error('Error saving bus:', error);
            throw error;
        }
    }
    /**
     * Delete bus by ID
     */
    async deleteById(id) {
        try {
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                console.warn(`Invalid ObjectId: ${id}`);
                return false;
            }
            const result = await bus_model_1.default.findByIdAndDelete(id).exec();
            return result !== null;
        }
        catch (error) {
            console.error('Error deleting bus:', error);
            throw error;
        }
    }
    /**
     * Clear location history for a bus
     */
    async clearLocationHistory(busId) {
        try {
            const bus = await this.findById(busId);
            if (!bus) {
                return null;
            }
            bus.locationHistory = [];
            return await bus.save();
        }
        catch (error) {
            console.error('Error clearing location history:', error);
            throw error;
        }
    }
    /**
     * Get buses by multiple route numbers
     */
    async findByRouteNumbers(routeNumbers) {
        try {
            return await bus_model_1.default.find({
                routeNumber: { $in: routeNumbers }
            })
                .sort({ routeNumber: 1, lastUpdated: -1 })
                .exec();
        }
        catch (error) {
            console.error('Error finding buses by route numbers:', error);
            throw error;
        }
    }
    /**
     * Check if bus exists by route number
     */
    async existsByRouteNumber(routeNumber) {
        try {
            const count = await bus_model_1.default.countDocuments({ routeNumber }).exec();
            return count > 0;
        }
        catch (error) {
            console.error('Error checking bus existence:', error);
            throw error;
        }
    }
    /**
     * Get location history for a bus
     */
    async getLocationHistory(busId, limit = 50) {
        try {
            const bus = await bus_model_1.default.findById(busId)
                .select('locationHistory')
                .exec();
            if (!bus || !bus.locationHistory) {
                return [];
            }
            // Return last N locations
            return bus.locationHistory.slice(-limit);
        }
        catch (error) {
            console.error('Error getting location history:', error);
            throw error;
        }
    }
}
exports.default = new BusRepository();
