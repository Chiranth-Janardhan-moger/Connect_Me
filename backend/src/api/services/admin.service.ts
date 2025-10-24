import userRepository from '../repositories/user.repository';
import busRepository from '../repositories/bus.repository';
import routeRepository from '../repositories/route.repository';
import User, { IUser, UserRole } from '../../models/user.model';
import Bus, { IBus } from '../../models/bus.model';
import Route, { IRoute } from '../../models/route.model';
import mongoose from 'mongoose';

class AdminService {
    async addStudent(studentData: any): Promise<IUser> {
        const { name, email, password, busId } = studentData;

        if (!name || !email || !password || !busId) {
            throw new Error('Missing required fields for student: name, email, password, busId.');
        }
        
        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) {
            throw new Error('Email already in use.');
        }

        const bus = await busRepository.findById(busId);
        if (!bus) {
            throw new Error('Bus with the provided busId not found.');
        }

        const student = new User({
            name,
            email,
            passwordHash: password, // Hashing is handled by pre-save middleware
            role: UserRole.STUDENT,
            busId: bus._id
        });

        return userRepository.save(student);
    }

    async addDriver(driverData: any): Promise<{ driver: IUser, bus: IBus }> {
        const { name, email, password, busNumber, routeId } = driverData;

        if (!name || !email || !password || !busNumber || !routeId) {
            throw new Error('Missing required fields: name, email, password, busNumber, routeId.');
        }

        if (await userRepository.findByEmail(email)) {
            throw new Error('Driver email already in use.');
        }

        const route = await routeRepository.findById(routeId);
        if (!route) {
            throw new Error('Route not found.');
        }
        
        const busWithNumber = await busRepository.findByBusNumber(busNumber);
        if(busWithNumber) {
            throw new Error('Bus number already in use.');
        }

        const newBus = new Bus({
            busNumber,
            routeId,
            driverId: new mongoose.Types.ObjectId(), // Placeholder
        });

        const newDriver = new User({
            name,
            email,
            passwordHash: password,
            role: UserRole.DRIVER,
            busId: newBus._id,
        });
        
        newBus.driverId = newDriver._id;
        
        const savedDriver = await userRepository.save(newDriver);
        const savedBus = await busRepository.save(newBus);

        return { driver: savedDriver, bus: savedBus };
    }

    async addRoute(routeData: any): Promise<IRoute> {
        const { name, stops } = routeData;
        if (!name || !stops || !Array.isArray(stops) || stops.length === 0) {
            throw new Error('Route name and a non-empty array of stops are required.');
        }
        
        const existingRoute = await routeRepository.findByName(name);
        if (existingRoute) {
            throw new Error('A route with this name already exists.');
        }

        const route = new Route({ name, stops });
        return routeRepository.save(route);
    }
}

export default new AdminService();
