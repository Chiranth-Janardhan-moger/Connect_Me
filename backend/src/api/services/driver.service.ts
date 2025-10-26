import busRepository from '../repositories/bus.repository';
import { TripStatus, IBus } from '../../models/bus.model';

class DriverService {
    async startTrip(driverId: string): Promise<IBus> {
        const bus = await busRepository.findByDriverId(driverId);
        if (!bus) {
            throw new Error('Bus not found for this driver.');
        }

        if (bus.tripStatus === TripStatus.ON_ROUTE) {
            throw new Error('Trip is already in progress.');
        }

        bus.tripStatus = TripStatus.ON_ROUTE;
        bus.locationHistory = []; // Clear history for the new trip
        bus.currentLat = undefined;
        bus.currentLon = undefined;
        
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

        bus.tripStatus = TripStatus.REACHED;
        bus.currentLat = undefined;
        bus.currentLon = undefined;

        return busRepository.save(bus);
    }
}

export default new DriverService();