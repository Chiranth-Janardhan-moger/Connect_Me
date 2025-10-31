import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { TripStatus } from '../models/bus.model';
import { calculateDistance } from '../utils/location.util';
import busRepository from '../api/repositories/bus.repository';

const DESTINATION_RADIUS_METERS = 50;
let io: Server | null = null;

export const initializeSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
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
            const roomName = busId.toString();
            socket.join(roomName); // Convert to string for room name
            console.log(`✅ Student ${studentId} joined ROOM "${roomName}" for route ${busId}`);

            // Send the last known location to the student upon joining
            // ONLY if trip is currently active (ON_ROUTE)
            try {
                // FIX: Search by busNumber or routeNumber instead of _id
                // Since busId is being sent as routeNumber (1, 2, 3, etc.)
                const bus = await busRepository.findByRouteNumber(busId);
                
                if (!bus) {
                    console.log(`⚠️ No bus found for route ${busId}`);
                    return;
                }
                
                console.log(`📊 Route ${busId} - Status: ${bus.tripStatus}, HasLocation: ${!!(bus.currentLat && bus.currentLon)}`);
                
                // CRITICAL: Only send location if trip is ON_ROUTE
                if (bus.tripStatus === TripStatus.ON_ROUTE && bus.currentLat && bus.currentLon) {
                    socket.emit('student:location-update', {
                        latitude: bus.currentLat,
                        longitude: bus.currentLon,
                        timestamp: bus.lastUpdated,
                    });
                    console.log(`📍 Sent cached location for route ${busId} to student ${studentId}: [${bus.currentLat}, ${bus.currentLon}]`);
                } else {
                    console.log(`🚫 No location sent to student ${studentId} - Trip not active or no location available`);
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
                    if(bus && bus.tripStatus === TripStatus.NOT_STARTED) {
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
                if (io) {
                    const roomName = busId.toString();
                    io.to(roomName).emit('student:location-update', {
                        latitude,
                        longitude,
                        timestamp: now,
                    });
                    console.log(`📡 Broadcast location to ROOM "${roomName}": [${latitude}, ${longitude}]`);
                }
                
                // Monitor bus approaching destination (for logging/monitoring only)
                // Driver must manually end trip via endTrip endpoint
                const route = await busRepository.findRouteByNumber(bus.routeNumber);
                if (route && route.stops && route.stops.length > 0) {
                    const lastStop = route.stops[route.stops.length - 1];
                    const distance = calculateDistance(latitude, longitude, lastStop.lat, lastStop.lon);

                    if (distance <= DESTINATION_RADIUS_METERS) {
                        console.log(`🎯 Bus ${bus.busNumber} approaching destination (${distance}m away)`);
                        // Note: Auto-trip-end removed. Driver must manually call endTrip endpoint.
                        // This allows driver to handle final instructions before ending.
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

// Helper function to notify students when trip ends
export const notifyTripEnded = (routeNumber: number) => {
    if (io) {
        console.log(`📢 Notifying students on route ${routeNumber} that trip has ended`);
        io.to(routeNumber.toString()).emit('student:trip-ended', {
            message: 'The bus trip has ended',
            timestamp: new Date(),
        });
    }
};