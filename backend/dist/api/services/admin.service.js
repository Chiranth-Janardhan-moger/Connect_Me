"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_repository_1 = __importDefault(require("../repositories/user.repository"));
const bus_repository_1 = __importDefault(require("../repositories/bus.repository"));
const route_repository_1 = __importDefault(require("../repositories/route.repository"));
const user_model_1 = __importStar(require("../../models/user.model"));
const bus_model_1 = __importDefault(require("../../models/bus.model"));
const route_model_1 = __importDefault(require("../../models/route.model"));
const mongoose_1 = __importDefault(require("mongoose"));
class AdminService {
    async addStudent(studentData) {
        const { name, email, password, rollNumber, routeNumber } = studentData;
        if (!name || !email || !password || !rollNumber || !routeNumber) {
            throw new Error('Missing required fields for student: name, email, password, rollNumber, routeNumber.');
        }
        const existingUser = await user_repository_1.default.findByEmail(email);
        if (existingUser) {
            throw new Error('Email already in use.');
        }
        const existingRollNumber = await user_repository_1.default.findByRollNumber(rollNumber);
        if (existingRollNumber) {
            throw new Error('Roll number already in use.');
        }
        // Validate route number is a positive integer
        const routeNum = parseInt(routeNumber);
        if (isNaN(routeNum) || routeNum <= 0) {
            throw new Error('Route number must be a positive integer.');
        }
        const student = new user_model_1.default({
            rollNumber,
            name,
            email,
            passwordHash: password, // Hashing is handled by pre-save middleware
            role: user_model_1.UserRole.STUDENT,
            routeNumber: routeNum
        });
        return user_repository_1.default.save(student);
    }
    async addDriver(driverData) {
        const { name, email, password, busNumber, routeNumber } = driverData;
        if (!name || !email || !password || !busNumber || !routeNumber) {
            throw new Error('Missing required fields: name, email, password, busNumber, routeNumber.');
        }
        if (await user_repository_1.default.findByEmail(email)) {
            throw new Error('Driver email already in use.');
        }
        // Validate route number is a positive integer
        const routeNum = parseInt(routeNumber);
        if (isNaN(routeNum) || routeNum <= 0) {
            throw new Error('Route number must be a positive integer.');
        }
        // Check if route exists
        const route = await route_repository_1.default.findByRouteNumber(routeNum);
        if (!route) {
            throw new Error('Route not found.');
        }
        const busWithNumber = await bus_repository_1.default.findByBusNumber(busNumber);
        if (busWithNumber) {
            throw new Error('Bus number already in use.');
        }
        const newBus = new bus_model_1.default({
            busNumber,
            routeNumber: routeNum,
            driverId: new mongoose_1.default.Types.ObjectId(), // Placeholder
        });
        const newDriver = new user_model_1.default({
            name,
            email,
            passwordHash: password,
            role: user_model_1.UserRole.DRIVER,
            busId: newBus._id,
        });
        newBus.driverId = newDriver._id;
        const savedDriver = await user_repository_1.default.save(newDriver);
        const savedBus = await bus_repository_1.default.save(newBus);
        return { driver: savedDriver, bus: savedBus };
    }
    async addRoute(routeData) {
        const { routeNumber, name, stops } = routeData;
        if (!routeNumber || !name || !stops || !Array.isArray(stops) || stops.length === 0) {
            throw new Error('Route number, name and a non-empty array of stops are required.');
        }
        // Validate route number is a positive integer
        const routeNum = parseInt(routeNumber);
        if (isNaN(routeNum) || routeNum <= 0) {
            throw new Error('Route number must be a positive integer.');
        }
        const existingRoute = await route_repository_1.default.findByRouteNumber(routeNum);
        if (existingRoute) {
            throw new Error('A route with this number already exists.');
        }
        const existingRouteByName = await route_repository_1.default.findByName(name);
        if (existingRouteByName) {
            throw new Error('A route with this name already exists.');
        }
        const route = new route_model_1.default({ routeNumber: routeNum, name, stops });
        return route_repository_1.default.save(route);
    }
    async getAllRoutes() {
        return route_repository_1.default.findAll();
    }
    async getUsersByRole(role) {
        const users = await user_repository_1.default.findAllByRole(role);
        // Augment drivers with routeNumber from their assigned bus
        const augmented = await Promise.all(users.map(async (u) => {
            if (u.role === user_model_1.UserRole.DRIVER && !u.routeNumber) {
                try {
                    const bus = await bus_repository_1.default.findByDriverId(String(u._id));
                    if (bus) {
                        // Attach transiently for response
                        u = u.toObject ? u.toObject() : u;
                        u.routeNumber = bus.routeNumber;
                        return u;
                    }
                }
                catch (_) { }
            }
            return u;
        }));
        // @ts-ignore - return as IUser[]
        return augmented;
    }
    async deleteUser(userId) {
        return user_repository_1.default.deleteById(userId);
    }
}
exports.default = new AdminService();
