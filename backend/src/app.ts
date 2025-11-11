// Fix: Separate default import from type imports to resolve type conflicts.
import express from 'express';
import type { Application, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './api/routes/auth.routes';
import driverRoutes from './api/routes/driver.routes';
import studentRoutes from './api/routes/student.routes';
import adminRoutes from './api/routes/admin.routes';
import notificationRoutes from './api/routes/notification.routes';
import appVersionRoutes from './api/routes/appVersion.routes';
import chatRoutes from './api/routes/chat.routes';
import sosRoutes from './api/routes/sos.routes';

const app: Application = express();

// Middleware
app.use(cors({
  origin: true, // Allow all origins (adjust for production)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// API Routes
app.get('/', (req: Request, res: Response) => {
    res.json({
        status: 'running',
        message: 'College Bus Tracking API',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: '/api/auth',
            driver: '/api/driver',
            student: '/api/student',
            admin: '/api/admin',
            notifications: '/api/notifications',
            chat: '/api/chat',
            sos: '/api/sos',
        }
    });
});

app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        socketIO: 'enabled',
        timestamp: new Date().toISOString()
    });
});
app.use('/api/auth', authRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/app', appVersionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/sos', sosRoutes);


export default app;