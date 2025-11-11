import jwt from 'jsonwebtoken';
import config from '../../config';
import userRepository from '../repositories/user.repository';
import { UserRole } from '../../models/user.model';
import busRepository from '../repositories/bus.repository';

class AuthService {
    async loginUser(email: string, password: string) {
        const user = await userRepository.findByEmail(email);
        if (!user) {
            throw new Error('User not found.');
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new Error('Invalid credentials.');
        }

        // Ensure drivers also get routeNumber and busNumber from their assigned bus
        let driverRouteNumber: number | undefined = user.routeNumber as any;
        let driverBusNumber: string | undefined = undefined;
        if (user.role === UserRole.DRIVER) {
            const bus = await busRepository.findByDriverId(String(user._id));
            if (bus) {
                driverRouteNumber = bus.routeNumber;
                driverBusNumber = bus.busNumber;
            }
        }

        const payload = {
            id: user._id,
            role: user.role,
            busId: user.busId,
            routeNumber: driverRouteNumber ?? user.routeNumber,
            rollNumber: user.rollNumber,
        } as any;

        const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1d' });

        return {
            token,
            user: {
                _id: user._id,
                name: user.name,
                role: user.role,
                busId: user.busId,
                routeNumber: driverRouteNumber ?? user.routeNumber,
                busNumber: driverBusNumber,
                rollNumber: user.rollNumber,
            },
        };
    }
}

export default new AuthService();
