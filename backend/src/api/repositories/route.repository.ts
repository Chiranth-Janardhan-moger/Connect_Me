import Route, { IRoute } from '../../models/route.model';
import { Types } from 'mongoose';

class RouteRepository {
    async save(route: IRoute): Promise<IRoute> {
        return route.save();
    }

    async findByName(name: string): Promise<IRoute | null> {
        return Route.findOne({ name }).exec();
    }

    async findByRouteNumber(routeNumber: number): Promise<IRoute | null> {
        return Route.findOne({ routeNumber }).exec();
    }
    
    async findById(id: string | Types.ObjectId): Promise<IRoute | null> {
        return Route.findById(id).exec();
    }

    async findAll(): Promise<IRoute[]> {
        return Route.find().exec();
    }
}

export default new RouteRepository();
