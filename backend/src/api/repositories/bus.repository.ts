import mongoose from 'mongoose';
import Bus, { IBus } from '../../models/bus.model';
import routeRepository from './route.repository';

class BusRepository {
    /**
     * Find bus by driver ID
     */
    async findByDriverId(driverId: string): Promise<IBus | null> {
        try {
            return await Bus.findOne({ driverId }).exec();
        } catch (error) {
            console.error('Error finding bus by driver ID:', error);
            throw error;
        }
    }

    /**
     * Find bus by MongoDB ObjectId with validation
     */
    async findById(id: string): Promise<IBus | null> {
        try {
            // Validate if id is a valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(id)) {
                console.warn(`Invalid ObjectId: ${id}`);
                return null;
            }
            
            return await Bus.findById(id).exec();
        } catch (error) {
            console.error('Error finding bus by ID:', error);
            throw error;
        }
    }

    /**
     * Find bus by ID and populate related data
     */
    async findByIdAndPopulate(id: string, populatePath: string): Promise<IBus | null> {
        try {
            // Validate if id is a valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(id)) {
                console.warn(`Invalid ObjectId: ${id}`);
                return null;
            }
            
            return await Bus.findById(id).populate(populatePath).exec();
        } catch (error) {
            console.error('Error finding and populating bus by ID:', error);
            throw error;
        }
    }

    /**
     * Find bus by bus number (unique identifier like "BUS-001")
     */
    async findByBusNumber(busNumber: string): Promise<IBus | null> {
        try {
            return await Bus.findOne({ busNumber }).exec();
        } catch (error) {
            console.error('Error finding bus by bus number:', error);
            throw error;
        }
    }

    /**
     * Find bus by route number (1, 2, 3, etc.)
     * This is the primary method used for real-time tracking
     * Returns the most recently updated bus for the route
     */
    async findByRouteNumber(routeNumber: number): Promise<IBus | null> {
        try {
            // Find active bus on this route (ON_ROUTE or NOT_STARTED)
            const bus = await Bus.findOne({ 
                routeNumber: routeNumber,
                tripStatus: { $in: ['ON_ROUTE', 'NOT_STARTED'] }
            })
            .sort({ lastUpdated: -1 }) // Get most recent
            .exec();
            
            return bus;
        } catch (error) {
            console.error('Error finding bus by route number:', error);
            throw error;
        }
    }

    /**
     * Find all buses for a specific route number
     * Useful for historical data or multiple buses on same route
     */
    async findAllByRouteNumber(routeNumber: number): Promise<IBus[]> {
        try {
            return await Bus.find({ routeNumber })
                .sort({ lastUpdated: -1 })
                .exec();
        } catch (error) {
            console.error('Error finding all buses by route number:', error);
            throw error;
        }
    }

    /**
     * Find route information by route number
     */
    async findRouteByNumber(routeNumber: number) {
        try {
            return await routeRepository.findByRouteNumber(routeNumber);
        } catch (error) {
            console.error('Error finding route by number:', error);
            throw error;
        }
    }

    /**
     * Find active bus on route (currently ON_ROUTE)
     */
    async findActiveByRouteNumber(routeNumber: number): Promise<IBus | null> {
        try {
            return await Bus.findOne({ 
                routeNumber: routeNumber,
                tripStatus: 'ON_ROUTE'
            })
            .sort({ lastUpdated: -1 })
            .exec();
        } catch (error) {
            console.error('Error finding active bus by route number:', error);
            throw error;
        }
    }

    /**
     * Get current location of bus by route number
     * Returns only location data for performance
     */
    async getLocationByRouteNumber(routeNumber: number): Promise<{
        latitude: number;
        longitude: number;
        lastUpdated: Date;
    } | null> {
        try {
            const bus = await Bus.findOne({ 
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
        } catch (error) {
            console.error('Error getting location by route number:', error);
            throw error;
        }
    }

    /**
     * Update bus location
     */
    async updateLocation(
        busId: string, 
        latitude: number, 
        longitude: number
    ): Promise<IBus | null> {
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
        } catch (error) {
            console.error('Error updating bus location:', error);
            throw error;
        }
    }

    /**
     * Update trip status
     */
    async updateTripStatus(busId: string, status: string): Promise<IBus | null> {
        try {
            const bus = await this.findById(busId);
            if (!bus) {
                console.warn(`Bus not found: ${busId}`);
                return null;
            }

            bus.tripStatus = status as any;
            bus.lastUpdated = new Date();
            
            return await bus.save();
        } catch (error) {
            console.error('Error updating trip status:', error);
            throw error;
        }
    }

    /**
     * Get all buses with their current status
     */
    async findAll(): Promise<IBus[]> {
        try {
            return await Bus.find()
                .sort({ routeNumber: 1 })
                .exec();
        } catch (error) {
            console.error('Error finding all buses:', error);
            throw error;
        }
    }

    /**
     * Get all active trips (buses currently ON_ROUTE)
     */
    async findAllActive(): Promise<IBus[]> {
        try {
            return await Bus.find({ tripStatus: 'ON_ROUTE' })
                .sort({ routeNumber: 1 })
                .exec();
        } catch (error) {
            console.error('Error finding all active buses:', error);
            throw error;
        }
    }

    /**
     * Create new bus record
     */
    async create(busData: Partial<IBus>): Promise<IBus> {
        try {
            const bus = new Bus(busData);
            return await bus.save();
        } catch (error) {
            console.error('Error creating bus:', error);
            throw error;
        }
    }

    /**
     * Save/update bus document
     */
    async save(bus: IBus): Promise<IBus> {
        try {
            return await bus.save();
        } catch (error) {
            console.error('Error saving bus:', error);
            throw error;
        }
    }

    /**
     * Delete bus by ID
     */
    async deleteById(id: string): Promise<boolean> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                console.warn(`Invalid ObjectId: ${id}`);
                return false;
            }

            const result = await Bus.findByIdAndDelete(id).exec();
            return result !== null;
        } catch (error) {
            console.error('Error deleting bus:', error);
            throw error;
        }
    }

    /**
     * Clear location history for a bus
     */
    async clearLocationHistory(busId: string): Promise<IBus | null> {
        try {
            const bus = await this.findById(busId);
            if (!bus) {
                return null;
            }

            bus.locationHistory = [];
            return await bus.save();
        } catch (error) {
            console.error('Error clearing location history:', error);
            throw error;
        }
    }

    /**
     * Get buses by multiple route numbers
     */
    async findByRouteNumbers(routeNumbers: number[]): Promise<IBus[]> {
        try {
            return await Bus.find({ 
                routeNumber: { $in: routeNumbers } 
            })
            .sort({ routeNumber: 1, lastUpdated: -1 })
            .exec();
        } catch (error) {
            console.error('Error finding buses by route numbers:', error);
            throw error;
        }
    }

    /**
     * Check if bus exists by route number
     */
    async existsByRouteNumber(routeNumber: number): Promise<boolean> {
        try {
            const count = await Bus.countDocuments({ routeNumber }).exec();
            return count > 0;
        } catch (error) {
            console.error('Error checking bus existence:', error);
            throw error;
        }
    }

    /**
     * Get location history for a bus
     */
    async getLocationHistory(busId: string, limit: number = 50): Promise<any[]> {
        try {
            const bus = await Bus.findById(busId)
                .select('locationHistory')
                .exec();
            
            if (!bus || !bus.locationHistory) {
                return [];
            }

            // Return last N locations
            return bus.locationHistory.slice(-limit);
        } catch (error) {
            console.error('Error getting location history:', error);
            throw error;
        }
    }
}

export default new BusRepository();