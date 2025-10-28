import userRepository from '../repositories/user.repository';
import busRepository from '../repositories/bus.repository';
import routeRepository from '../repositories/route.repository';
import User, { IUser, UserRole } from '../../models/user.model';
import Bus, { IBus } from '../../models/bus.model';
import Route, { IRoute } from '../../models/route.model';
import mongoose from 'mongoose';

class AdminService {
    async addStudent(studentData: any): Promise<IUser> {
        const { name, email, password, rollNumber, routeNumber } = studentData;

        if (!name || !email || !password || !rollNumber || !routeNumber) {
            throw new Error('Missing required fields for student: name, email, password, rollNumber, routeNumber.');
        }
        
        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) {
            throw new Error('Email already in use.');
        }

        const existingRollNumber = await userRepository.findByRollNumber(rollNumber);
        if (existingRollNumber) {
            throw new Error('Roll number already in use.');
        }

        // Validate route number is a positive integer
        const routeNum = parseInt(routeNumber);
        if (isNaN(routeNum) || routeNum <= 0) {
            throw new Error('Route number must be a positive integer.');
        }

        const student = new User({
            rollNumber,
            name,
            email,
            passwordHash: password, // Hashing is handled by pre-save middleware
            role: UserRole.STUDENT,
            routeNumber: routeNum
        });

        return userRepository.save(student);
    }

    async addDriver(driverData: any): Promise<{ driver: IUser, bus: IBus }> {
        const { name, email, password, busNumber, routeNumber } = driverData;

        if (!name || !email || !password || !busNumber || !routeNumber) {
            throw new Error('Missing required fields: name, email, password, busNumber, routeNumber.');
        }

        if (await userRepository.findByEmail(email)) {
            throw new Error('Driver email already in use.');
        }

        // Validate route number is a positive integer
        const routeNum = parseInt(routeNumber);
        if (isNaN(routeNum) || routeNum <= 0) {
            throw new Error('Route number must be a positive integer.');
        }

        // Check if route exists
        const route = await routeRepository.findByRouteNumber(routeNum);
        if (!route) {
            throw new Error('Route not found.');
        }
        
        const busWithNumber = await busRepository.findByBusNumber(busNumber);
        if(busWithNumber) {
            throw new Error('Bus number already in use.');
        }

        const newBus = new Bus({
            busNumber,
            routeNumber: routeNum,
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
        const { routeNumber, name, stops } = routeData;
        if (!routeNumber || !name || !stops || !Array.isArray(stops) || stops.length === 0) {
            throw new Error('Route number, name and a non-empty array of stops are required.');
        }

        // Validate route number is a positive integer
        const routeNum = parseInt(routeNumber);
        if (isNaN(routeNum) || routeNum <= 0) {
            throw new Error('Route number must be a positive integer.');
        }
        
        const existingRoute = await routeRepository.findByRouteNumber(routeNum);
        if (existingRoute) {
            throw new Error('A route with this number already exists.');
        }

        const existingRouteByName = await routeRepository.findByName(name);
        if (existingRouteByName) {
            throw new Error('A route with this name already exists.');
        }

        const route = new Route({ routeNumber: routeNum, name, stops });
        return routeRepository.save(route);
    }

    async getAllRoutes(): Promise<IRoute[]> {
        return routeRepository.findAll();
    }

    async getUsersByRole(role?: string): Promise<IUser[]> {
        return userRepository.findAllByRole(role);
    }

    async deleteUser(userId: string): Promise<IUser | null> {
        return userRepository.deleteById(userId);
    }
}

export default new AdminService();
