import busRepository from '../repositories/bus.repository';
import { IBus } from '../../models/bus.model';

class StudentService {
    async getBusLocation(busId: string): Promise<IBus> {
        const bus = await busRepository.findById(busId);
        if (!bus) {
            throw new Error('Bus not found.');
        }
        
        if (!bus.currentLat || !bus.currentLon) {
            throw new Error('Bus location not available yet.');
        }
        
        return bus;
    }
}

export default new StudentService();
