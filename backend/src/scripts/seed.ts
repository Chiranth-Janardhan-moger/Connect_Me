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
        // Drop the problematic index if it exists
        try {
            await User.collection.dropIndex('rollNumber_1');
            console.log('Dropped existing rollNumber index.');
        } catch (err) {
            console.log('No existing rollNumber index to drop (this is fine).');
        }

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
            // No rollNumber for admin
        });
        await admin.save();
        console.log('Admin created.');

        // 1. Create Routes
        const route1 = new Route({
            routeNumber: 1,
            name: 'Route-1',
            stops: [
                { lat: 13.1007, lon: 77.5963, label: 'Yelahanka New Town' },
                { lat: 13.0950, lon: 77.5940, label: 'Yelahanka Old Town' },
                { lat: 13.0850, lon: 77.5980, label: 'Jakkur Cross' },
                { lat: 13.0358, lon: 77.5970, label: 'Hebbal Flyover' },
                { lat: 13.0157, lon: 77.5850, label: 'Mekhri Circle' }
            ]
        });
        await route1.save();

        const route2 = new Route({
            routeNumber: 2,
            name: 'Route-2',
            stops: [
                { lat: 13.133845, lon: 77.568760, label: 'BMSIT College' },
                { lat: 13.0920, lon: 77.6020, label: 'Puttenahalli Cross' },
                { lat: 13.0800, lon: 77.6100, label: 'Kogilu Cross' },
                { lat: 13.0520, lon: 77.6150, label: 'Nagavara' },
                { lat: 13.0380, lon: 77.6380, label: 'Hennur Cross' },
                { lat: 13.0280, lon: 77.6280, label: 'Tin Factory' }
            ]
        });
        await route2.save();

        const route3 = new Route({
            routeNumber: 3,
            name: 'Route-3',
            stops: [
                { lat: 13.1007, lon: 77.5963, label: 'Yelahanka' },
                { lat: 13.0720, lon: 77.5820, label: 'Attur' },
                { lat: 13.0100, lon: 77.5750, label: 'Sadashivanagar' },
                { lat: 12.9767, lon: 77.5713, label: 'Majestic' }
            ]
        });
        await route3.save();
        console.log('Routes created.');

        // 2. Create Buses for each route
        const bus1 = new Bus({
            busNumber: 'CB-101',
            routeNumber: 1, // Route-1
            driverId: new mongoose.Types.ObjectId(), // Placeholder
        });
        
        const bus2 = new Bus({
            busNumber: 'CB-102',
            routeNumber: 2, // Route-2
            driverId: new mongoose.Types.ObjectId(), // Placeholder
        });

        const bus3 = new Bus({
            busNumber: 'CB-103',
            routeNumber: 3, // Route-3
            driverId: new mongoose.Types.ObjectId(), // Placeholder
        });
        
        // 3. Create Driver Users for each route
        const driver1 = new User({
            name: 'John Driver',
            email: 'driver1@college.edu',
            passwordHash: 'password123', // Will be hashed on save
            role: UserRole.DRIVER,
            busId: bus1._id,
            // No rollNumber for drivers
        });
        await driver1.save();

        const driver2 = new User({
            name: 'Mike Driver',
            email: 'driver2@college.edu',
            passwordHash: 'password123', // Will be hashed on save
            role: UserRole.DRIVER,
            busId: bus2._id,
            // No rollNumber for drivers
        });
        await driver2.save();

        const driver3 = new User({
            name: 'Sarah Driver',
            email: 'driver3@college.edu',
            passwordHash: 'password123', // Will be hashed on save
            role: UserRole.DRIVER,
            busId: bus3._id,
            // No rollNumber for drivers
        });
        await driver3.save();
        console.log('Drivers created.');

        // Update buses with actual driverIds
        bus1.driverId = driver1._id;
        await bus1.save();
        
        bus2.driverId = driver2._id;
        await bus2.save();
        
        bus3.driverId = driver3._id;
        await bus3.save();
        console.log('Buses created and linked to drivers.');

        // 4. Create Student Users with route numbers and roll numbers
        const student1 = new User({
            rollNumber: 'STU001',
            name: 'Mohan',
            email: 'student1@college.edu',
            passwordHash: 'password123',
            role: UserRole.STUDENT,
            routeNumber: 1, // Route-1
        });
        await student1.save();
        
        const student2 = new User({
            rollNumber: 'STU002',
            name: 'Chiranth',
            email: 'student2@college.edu',
            passwordHash: 'password123',
            role: UserRole.STUDENT,
            routeNumber: 2, // Route-2
        });
        await student2.save();

        const student3 = new User({
            rollNumber: 'STU003',
            name: 'Priya',
            email: 'student3@college.edu',
            passwordHash: 'password123',
            role: UserRole.STUDENT,
            routeNumber: 3, // Route-3
        });
        await student3.save();

        const student4 = new User({
            rollNumber: 'STU004',
            name: 'Arjun',
            email: 'student4@college.edu',
            passwordHash: 'password123',
            role: UserRole.STUDENT,
            routeNumber: 1, // Route-1
        });
        await student4.save();

        const student5 = new User({
            rollNumber: 'STU005',
            name: 'Sneha',
            email: 'student5@college.edu',
            passwordHash: 'password123',
            role: UserRole.STUDENT,
            routeNumber: 2, // Route-2
        });
        await student5.save();
        console.log('Students created with route numbers and roll numbers.');

        console.log('✅ Database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`- Admin: 1 user`);
        console.log(`- Drivers: 3 users`);
        console.log(`- Students: 5 users`);
        console.log(`- Routes: 3 routes`);
        console.log(`- Buses: 3 buses`);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
};

seedDatabase();