import busRepository from '../repositories/bus.repository';
import routeRepository from '../repositories/route.repository';
import { IBus } from '../../models/bus.model';
import { IRoute } from '../../models/route.model';

class StudentService {
    async getBusByRouteNumber(routeNumber: number): Promise<IBus | null> {
        try {
            const bus = await busRepository.findByRouteNumber(routeNumber);
            
            if (!bus) {
                return null;
            }
            
            return bus;
        } catch (error) {
            console.error('Error in getBusByRouteNumber:', error);
            return null;
        }
    }

    async getRouteByNumber(routeNumber: number): Promise<IRoute | null> {
        try {
            const route = await routeRepository.findByRouteNumber(routeNumber);
            
            if (!route) {
                return null;
            }
            
            return route;
        } catch (error) {
            console.error('Error in getRouteByNumber:', error);
            return null;
        }
    }
}

export default new StudentService();