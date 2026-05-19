"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Fix: Separate default import from type imports to resolve type conflicts.
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./api/routes/auth.routes"));
const driver_routes_1 = __importDefault(require("./api/routes/driver.routes"));
const student_routes_1 = __importDefault(require("./api/routes/student.routes"));
const admin_routes_1 = __importDefault(require("./api/routes/admin.routes"));
const notification_routes_1 = __importDefault(require("./api/routes/notification.routes"));
const appVersion_routes_1 = __importDefault(require("./api/routes/appVersion.routes"));
const chat_routes_1 = __importDefault(require("./api/routes/chat.routes"));
const sos_routes_1 = __importDefault(require("./api/routes/sos.routes"));
const bugReport_routes_1 = __importDefault(require("./api/routes/bugReport.routes"));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: true, // Allow all origins (adjust for production)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
// API Routes
app.get('/', (req, res) => {
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
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        socketIO: 'enabled',
        timestamp: new Date().toISOString()
    });
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/driver', driver_routes_1.default);
app.use('/api/student', student_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/app', appVersion_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
app.use('/api/sos', sos_routes_1.default);
app.use('/api/bug-reports', bugReport_routes_1.default);
exports.default = app;
