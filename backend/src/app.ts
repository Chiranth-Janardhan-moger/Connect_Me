// Fix: Separate default import from type imports to resolve type conflicts.
import express from 'express';
import type { Application, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './api/routes/auth.routes';
import driverRoutes from './api/routes/driver.routes';
import studentRoutes from './api/routes/student.routes';
import adminRoutes from './api/routes/admin.routes';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.get('/', (req: Request, res: Response) => {
    res.send('College Bus Tracking API is running...');
});
app.use('/api/auth', authRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);


export default app;