// Fix: Use `import type` for Express types to avoid type conflicts.
import type { Request, Response } from 'express';
import driverService from '../services/driver.service';

export const startTrip = async (req: Request, res: Response) => {
    const driverId = req.user?.id;
    if (!driverId) {
        return res.status(401).json({ message: "Authentication required." });
    }

    try {
        const updatedBus = await driverService.startTrip(driverId);
        res.json({ message: 'Trip started successfully.', tripStatus: updatedBus.tripStatus });
    } catch (error) {
        console.error('Start trip error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        if (errorMessage.includes('not found')) {
            return res.status(404).json({ message: errorMessage });
        }
        if (errorMessage.includes('already in progress')) {
            return res.status(400).json({ message: errorMessage });
        }
        res.status(500).json({ message: 'Server error while starting trip.' });
    }
};

export const endTrip = async (req: Request, res: Response) => {
    const driverId = req.user?.id;
    if (!driverId) {
        return res.status(401).json({ message: "Authentication required." });
    }

    try {
        const updatedBus = await driverService.endTrip(driverId);
        res.json({ message: 'Trip ended successfully.', tripStatus: updatedBus.tripStatus });
    } catch (error) {
        console.error('End trip error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        if (errorMessage.includes('not found')) {
            return res.status(404).json({ message: errorMessage });
        }
        if (errorMessage.includes('No trip is currently in progress')) {
            return res.status(400).json({ message: errorMessage });
        }
        res.status(500).json({ message: 'Server error while ending trip.' });
    }
};