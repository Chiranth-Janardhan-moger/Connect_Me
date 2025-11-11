// Fix: Use `import type` for Express types to avoid type conflicts.
import type { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../models/user.model';

export const requireDriver = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === UserRole.DRIVER) {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden. Driver access required.' });
    }
};

export const requireStudent = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === UserRole.STUDENT) {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden. Student access required.' });
    }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === UserRole.ADMIN) {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden. Admin access required.' });
    }
};