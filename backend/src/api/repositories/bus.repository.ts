
import Bus, { IBus } from '../../models/bus.model';
import routeRepository from './route.repository';

class BusRepository {
    async findByDriverId(driverId: string): Promise<IBus | null> {
        return Bus.findOne({ driverId }).exec();
    }

    async findById(id: string): Promise<IBus | null> {
        return Bus.findById(id).exec();
    }

    async findByIdAndPopulate(id: string, populatePath: string): Promise<IBus | null> {
        return Bus.findById(id).populate(populatePath).exec();
    }
    
    async findByBusNumber(busNumber: string): Promise<IBus | null> {
        return Bus.findOne({ busNumber }).exec();
    }

    async findByRouteNumber(routeNumber: number): Promise<IBus | null> {
        return Bus.findOne({ routeNumber }).exec();
    }

    async findRouteByNumber(routeNumber: number) {
        return routeRepository.findByRouteNumber(routeNumber);
    }

    async save(bus: IBus): Promise<IBus> {
        return bus.save();
    }
}

export default new BusRepository();