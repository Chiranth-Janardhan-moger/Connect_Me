
import mongoose from 'mongoose';
import config from '../config/index';
import User, { UserRole } from '../models/user.model';
import Bus from '../models/bus.model';
import Route from '../models/route.model';

const seedDatabase = async () => {
    console.log('Connecting to database...');
    await mongoose.connect(config.mongoURI);
    console.log('Database connected. Seeding data...');

    try {
        // Clear existing data
        await User.deleteMany({});
        await Bus.deleteMany({});
        await Route.deleteMany({});
        console.log('Cleared existing data.');

        // 0. Create an Admin User
        const admin = new User({
            name: 'Admin User',
            email: 'admin@college.edu',
            passwordHash: 'password123', // Will be hashed on save
            role: UserRole.ADMIN,
            // No busId for admin
        });
        await admin.save();
        console.log('Admin created.');

        // 1. Create a Route
        const route1 = new Route({
            name: 'Campus-To-Downtown',
            stops: [
                { lat: 12.9716, lon: 77.5946, label: 'Campus Main Gate' },
                { lat: 12.9759, lon: 77.6018, label: 'Central Library Stop' },
                { lat: 12.9780, lon: 77.6390, label: 'Downtown Final Stop' }
            ]
        });
        await route1.save();
        console.log('Route created.');

        // 2. Create a Bus
        // This is a placeholder since we need a driverId first. We'll create it with a dummy id and update later.
        const bus1 = new Bus({
            busNumber: 'CB-101',
            routeId: route1._id,
            driverId: new mongoose.Types.ObjectId(), // Placeholder
        });
        
        // 3. Create a Driver User
        const driver1 = new User({
            name: 'John Doe (Driver)',
            email: 'driver@college.edu',
            passwordHash: 'password123', // Will be hashed on save
            role: UserRole.DRIVER,
            busId: bus1._id,
        });
        await driver1.save();
        console.log('Driver created.');

        // Update bus with actual driverId
        bus1.driverId = driver1._id;
        await bus1.save();
        console.log('Bus created and linked to driver.');

        // 4. Create a Student User
        const student1 = new User({
            name: 'Jane Smith (Student)',
            email: 'student@college.edu',
            passwordHash: 'password123',
            role: UserRole.STUDENT,
            busId: bus1._id,
        });
        await student1.save();
        console.log('Student created and linked to bus.');

        console.log('✅ Database seeding completed successfully!');

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
};

seedDatabase();