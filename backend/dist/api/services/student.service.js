"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bus_repository_1 = __importDefault(require("../repositories/bus.repository"));
const route_repository_1 = __importDefault(require("../repositories/route.repository"));
class StudentService {
    async getBusByRouteNumber(routeNumber) {
        try {
            const bus = await bus_repository_1.default.findByRouteNumber(routeNumber);
            if (!bus) {
                return null;
            }
            return bus;
        }
        catch (error) {
            console.error('Error in getBusByRouteNumber:', error);
            return null;
        }
    }
    async getRouteByNumber(routeNumber) {
        try {
            const route = await route_repository_1.default.findByRouteNumber(routeNumber);
            if (!route) {
                return null;
            }
            return route;
        }
        catch (error) {
            console.error('Error in getRouteByNumber:', error);
            return null;
        }
    }
}
exports.default = new StudentService();
