"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRouteInfo = exports.getLiveLocation = void 0;
const student_service_1 = __importDefault(require("../services/student.service"));
const getLiveLocation = async (req, res) => {
    const routeNumber = req.user?.routeNumber;
    if (!routeNumber) {
        return res.status(400).json({
            message: "User is not assigned to a route."
        });
    }
    try {
        // Find the bus for this route number
        const bus = await student_service_1.default.getBusByRouteNumber(routeNumber);
        // Bus not found - return 404
        if (!bus) {
            return res.status(404).json({
                message: "Bus not found for this route."
            });
        }
        // Check if location is available and trip is ON_ROUTE
        const hasValidLocation = bus.currentLat !== undefined && bus.currentLon !== undefined && bus.currentLat !== null && bus.currentLon !== null;
        const isOnRoute = bus.tripStatus === 'ON_ROUTE';
        if (!hasValidLocation || !isOnRoute) {
            return res.status(200).json({
                busId: bus._id,
                status: bus.tripStatus,
                locationAvailable: false,
                message: isOnRoute ? "Bus location not available yet." : "Trip not started.",
                location: null
            });
        }
        // Validate coordinates are valid numbers
        const latitude = Number(bus.currentLat);
        const longitude = Number(bus.currentLon);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            console.error('Invalid coordinates in database:', { lat: bus.currentLat, lng: bus.currentLon });
            return res.status(500).json({
                message: 'Server error: Invalid coordinates stored'
            });
        }
        // Location available - return full data with validated numbers
        return res.status(200).json({
            busId: bus._id,
            status: bus.tripStatus,
            locationAvailable: true,
            location: {
                latitude,
                longitude,
                lastUpdated: bus.lastUpdated,
            },
        });
    }
    catch (error) {
        // Only log genuine unexpected errors
        console.error('Unexpected error in getLiveLocation:', error);
        return res.status(500).json({
            message: 'Server error while fetching location.'
        });
    }
};
exports.getLiveLocation = getLiveLocation;
const getRouteInfo = async (req, res) => {
    const routeNumber = req.user?.routeNumber;
    if (!routeNumber) {
        return res.status(400).json({
            message: "User is not assigned to a route."
        });
    }
    try {
        const route = await student_service_1.default.getRouteByNumber(routeNumber);
        if (!route) {
            return res.status(404).json({
                message: "Route not found."
            });
        }
        return res.status(200).json({
            routeId: route._id,
            routeName: route.name,
            routeNumber: routeNumber,
            stops: route.stops
        });
    }
    catch (error) {
        console.error('Unexpected error in getRouteInfo:', error);
        return res.status(500).json({
            message: 'Server error while fetching route information.'
        });
    }
};
exports.getRouteInfo = getRouteInfo;
