import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { TripStatus } from '../models/bus.model';
import { calculateDistance } from '../utils/location.util';
import busRepository from '../api/repositories/bus.repository';

const DESTINATION_RADIUS_METERS = 50;

export const initializeSocket = (httpServer: HttpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: '*', // Be more specific in production
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket: Socket) => {
        console.log(`New client connected: ${socket.id}`);

        // Student joins a room to receive updates for their bus
        socket.on('student:join', async ({ busId, studentId }) => {
            if (!busId) return;
            console.log(`Student ${studentId} joining room for bus ${busId}`);
            socket.join(busId.toString()); // Convert to string for room name

            // Send the last known location to the student upon joining
            try {
                // FIX: Search by busNumber or routeNumber instead of _id
                // Since busId is being sent as routeNumber (1, 2, 3, etc.)
                const bus = await busRepository.findByRouteNumber(busId);
                
                if (bus && bus.currentLat && bus.currentLon) {
                    socket.emit('student:location-update', {
                        latitude: bus.currentLat,
                        longitude: bus.currentLon,
                        timestamp: bus.lastUpdated,
                    });
                } else {
                    console.log(`No active location found for route ${busId}`);
                }
            } catch (error) {
                console.error("Error fetching last known location:", error);
            }
        });

        // Driver sends a location update
        socket.on('driver:location-update', async ({ busId, latitude, longitude }) => {
            if (!busId || latitude === undefined || longitude === undefined) return;
            
            try {
                // FIX: Find by routeNumber instead of _id
                const bus = await busRepository.findByRouteNumber(busId);
                
                if (!bus || bus.tripStatus !== TripStatus.ON_ROUTE) {
                    // If trip ended, notify driver to stop sending updates
                    if(bus && bus.tripStatus === TripStatus.REACHED) {
                        socket.emit('driver:trip-ended');
                    }
                    return;
                }
                
                const now = new Date();
                bus.currentLat = latitude;
                bus.currentLon = longitude;
                bus.lastUpdated = now;
                bus.locationHistory.push({ lat: latitude, lon: longitude, timestamp: now });
                
                // Broadcast update to all students in the room
                io.to(busId.toString()).emit('student:location-update', {
                    latitude,
                    longitude,
                    timestamp: now,
                });
                
                // Check if bus has reached destination
                const route = await busRepository.findRouteByNumber(bus.routeNumber);
                if (route && route.stops && route.stops.length > 0) {
                    const lastStop = route.stops[route.stops.length - 1];
                    const distance = calculateDistance(latitude, longitude, lastStop.lat, lastStop.lon);

                    if (distance <= DESTINATION_RADIUS_METERS) {
                        bus.tripStatus = TripStatus.REACHED;
                        io.to(busId.toString()).emit('bus:reached', {
                            busId: bus._id,
                            status: TripStatus.REACHED,
                            message: `Bus has reached the destination: ${lastStop.label}.`
                        });
                        console.log(`Bus ${bus.busNumber} reached its destination.`);
                    }
                }

                await busRepository.save(bus);

            } catch (error) {
                console.error("Error processing location update:", error);
            }
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
};