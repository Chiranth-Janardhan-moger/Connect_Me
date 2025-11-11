"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../../config"));
const user_repository_1 = __importDefault(require("../repositories/user.repository"));
const user_model_1 = require("../../models/user.model");
const bus_repository_1 = __importDefault(require("../repositories/bus.repository"));
class AuthService {
    async loginUser(email, password) {
        const user = await user_repository_1.default.findByEmail(email);
        if (!user) {
            throw new Error('User not found.');
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new Error('Invalid credentials.');
        }
        // Ensure drivers also get routeNumber and busNumber from their assigned bus
        let driverRouteNumber = user.routeNumber;
        let driverBusNumber = undefined;
        if (user.role === user_model_1.UserRole.DRIVER) {
            const bus = await bus_repository_1.default.findByDriverId(String(user._id));
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
        };
        const token = jsonwebtoken_1.default.sign(payload, config_1.default.jwtSecret, { expiresIn: '1d' });
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
exports.default = new AuthService();
