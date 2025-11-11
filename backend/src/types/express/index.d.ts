
import { Types } from 'mongoose';
import { UserRole } from '../../models/user.model';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: UserRole;
                busId?: Types.ObjectId;
                routeNumber?: number;
                rollNumber?: string;
            };
        }
    }
}
