"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const route_model_1 = __importDefault(require("../../models/route.model"));
class RouteRepository {
    async save(route) {
        return route.save();
    }
    async findByName(name) {
        return route_model_1.default.findOne({ name }).exec();
    }
    async findByRouteNumber(routeNumber) {
        return route_model_1.default.findOne({ routeNumber }).exec();
    }
    async findById(id) {
        return route_model_1.default.findById(id).exec();
    }
    async findAll() {
        return route_model_1.default.find().exec();
    }
}
exports.default = new RouteRepository();
