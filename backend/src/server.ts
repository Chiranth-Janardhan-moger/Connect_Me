import http from 'http';
import app from './app';
import config from './config';
import connectDB from './config/db';
import { initializeSocket } from './services/socket.service';

const startServer = async () => {
    await connectDB();

    const server = http.createServer(app);
    
    // Initialize Socket.IO
    initializeSocket(server);

    const PORT = config.port;
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`WebSocket server is ready and listening.`);
    });
};

startServer();