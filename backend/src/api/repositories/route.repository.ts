import Route, { IRoute } from '../../models/route.model';
import { Types } from 'mongoose';

class RouteRepository {
    async save(route: IRoute): Promise<IRoute> {
        return route.save();
    }

    async findByName(name: string): Promise<IRoute | null> {
        return Route.findOne({ name }).exec();
    }
    
    async findById(id: string | Types.ObjectId): Promise<IRoute | null> {
        return Route.findById(id).exec();
    }
}

export default new RouteRepository();
