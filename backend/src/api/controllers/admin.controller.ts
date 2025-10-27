// Fix: Use `import type` for Express types to avoid type conflicts.
import type { Request, Response } from 'express';
import adminService from '../services/admin.service';

const handleServiceError = (error: unknown, res: Response) => {
    console.error('Admin operation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    
    if (errorMessage.includes('not found')) {
        return res.status(404).json({ message: errorMessage });
    }
    if (errorMessage.includes('already in use') || errorMessage.includes('already exists')) {
        return res.status(409).json({ message: errorMessage }); // 409 Conflict
    }
    if (errorMessage.includes('Missing required fields')) {
        return res.status(400).json({ message: errorMessage });
    }
    res.status(500).json({ message: 'Server error during admin operation.' });
};


export const addStudent = async (req: Request, res: Response) => {
    try {
        const student = await adminService.addStudent(req.body);
        const response = { ...student.toObject() };
        // @ts-ignore
        delete response.passwordHash;
        res.status(201).json({ message: 'Student created successfully.', student: response });
    } catch (error) {
        handleServiceError(error, res);
    }
};

export const addDriver = async (req: Request, res: Response) => {
    try {
        const { driver, bus } = await adminService.addDriver(req.body);
        const driverResponse = { ...driver.toObject() };
        // @ts-ignore
        delete driverResponse.passwordHash;
        res.status(201).json({ message: 'Driver and bus created successfully.', driver: driverResponse, bus });
    } catch (error) {
        handleServiceError(error, res);
    }
};

export const addRoute = async (req: Request, res: Response) => {
    try {
        const route = await adminService.addRoute(req.body);
        res.status(201).json({ message: 'Route created successfully.', route });
    } catch (error) {
        handleServiceError(error, res);
    }
};

export const getAllRoutes = async (req: Request, res: Response) => {
    try {
        const routes = await adminService.getAllRoutes();
        res.status(200).json({ routes });
    } catch (error) {
        handleServiceError(error, res);
    }
};