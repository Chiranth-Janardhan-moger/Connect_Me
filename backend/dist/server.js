"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const db_1 = __importDefault(require("./config/db"));
const socket_service_1 = require("./services/socket.service");
const redis_1 = require("./config/redis");
const startServer = async () => {
    await (0, db_1.default)();
    // Initialize Redis (optional)
    (0, redis_1.initRedis)();
    const server = http_1.default.createServer(app_1.default);
    // Initialize Socket.IO
    (0, socket_service_1.initializeSocket)(server);
    const PORT = config_1.default.port;
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`WebSocket server is ready and listening.`);
    });
};
startServer();
