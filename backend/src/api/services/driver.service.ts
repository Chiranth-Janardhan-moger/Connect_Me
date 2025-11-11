import busRepository from '../repositories/bus.repository';
import { TripStatus, IBus } from '../../models/bus.model';
import { notifyTripEnded } from '../../services/socket.service';

class DriverService {
    async startTrip(driverId: string): Promise<IBus> {
        const bus = await busRepository.findByDriverId(driverId);
        if (!bus) {
            throw new Error('Bus not found for this driver.');
        }

        if (bus.tripStatus === TripStatus.ON_ROUTE) {
            throw new Error('Trip is already in progress.');
        }

        // Set trip to ON_ROUTE
        // CLEAR all previous location data to start fresh
        bus.tripStatus = TripStatus.ON_ROUTE;
        bus.currentLat = undefined;
        bus.currentLon = undefined;
        bus.locationHistory = []; // Clear history for the new trip
        bus.lastUpdated = new Date();
        
        return busRepository.save(bus);
    }

    async endTrip(driverId: string): Promise<IBus> {
        const bus = await busRepository.findByDriverId(driverId);
        if (!bus) {
            throw new Error('Bus not found for this driver.');
        }

        if (bus.tripStatus !== TripStatus.ON_ROUTE) {
            throw new Error('No trip is currently in progress to end.');
        }

        // Set trip to NOT_STARTED (reset for next trip)
        // Clear ALL location data
        bus.tripStatus = TripStatus.NOT_STARTED;
        bus.currentLat = undefined;
        bus.currentLon = undefined;
        bus.locationHistory = []; // Clear history
        bus.lastUpdated = new Date();

        // Notify all students on this route that trip has ended
        notifyTripEnded(bus.routeNumber);

        return busRepository.save(bus);
    }
}

export default new DriverService();