// Fix: Use `import type` for Express types to avoid type conflicts.
import type { Request, Response } from 'express';
import studentService from '../services/student.service';

export const getLiveLocation = async (req: Request, res: Response) => {
    const busId = req.user?.busId?.toString();
     if (!busId) {
        return res.status(400).json({ message: "User is not assigned to a bus." });
    }

    try {
        const bus = await studentService.getBusLocation(busId);
        res.json({
            busId: bus._id,
            status: bus.tripStatus,
            location: {
                latitude: bus.currentLat,
                longitude: bus.currentLon,
                lastUpdated: bus.lastUpdated,
            },
        });

    } catch (error) {
        console.error('Get live location error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
         if (errorMessage.includes('not found')) {
            return res.status(404).json({ message: errorMessage });
        }
        if (errorMessage.includes('not available')) {
             return res.status(404).json({ message: errorMessage });
        }
        res.status(500).json({ message: 'Server error while fetching location.' });
    }
};