// Fix: Use `import type` for Express types to avoid type conflicts.
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../../config';

interface JwtPayload {
    id: string;
    role: any;
    busId: any;
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
        req.user = {
            id: decoded.id,
            role: decoded.role,
            busId: decoded.busId,
        };
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};