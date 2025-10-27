// Fix: Use `import type` for Express types to avoid type conflicts.
import type { Request, Response } from 'express';
import studentService from '../services/student.service';

export const getLiveLocation = async (req: Request, res: Response) => {
    const routeNumber = req.user?.routeNumber;
    
    if (!routeNumber) {
        return res.status(400).json({ 
            message: "User is not assigned to a route." 
        });
    }

    try {
        // Find the bus for this route number
        const bus = await studentService.getBusByRouteNumber(routeNumber);
        
        // Bus not found - return 404
        if (!bus) {
            return res.status(404).json({ 
                message: "Bus not found for this route." 
            });
        }

        // Location not available yet - return 200 with flag (NO ERROR)
        if (!bus.currentLat || !bus.currentLon) {
            return res.status(200).json({
                busId: bus._id,
                status: bus.tripStatus,
                locationAvailable: false,
                message: "Bus location not available yet.",
                location: null
            });
        }

        // Location available - return full data
        return res.status(200).json({
            busId: bus._id,
            status: bus.tripStatus,
            locationAvailable: true,
            location: {
                latitude: bus.currentLat,
                longitude: bus.currentLon,
                lastUpdated: bus.lastUpdated,
            },
        });

    } catch (error) {
        // Only log genuine unexpected errors
        console.error('Unexpected error in getLiveLocation:', error);
        return res.status(500).json({ 
            message: 'Server error while fetching location.' 
        });
    }
};

export const getRouteInfo = async (req: Request, res: Response) => {
    const routeNumber = req.user?.routeNumber;
    
    if (!routeNumber) {
        return res.status(400).json({ 
            message: "User is not assigned to a route." 
        });
    }

    try {
        const route = await studentService.getRouteByNumber(routeNumber);
        
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

    } catch (error) {
        console.error('Unexpected error in getRouteInfo:', error);
        return res.status(500).json({ 
            message: 'Server error while fetching route information.' 
        });
    }
};