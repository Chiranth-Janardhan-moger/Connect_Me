import connectDB from '../config/db';
import Bus from '../models/bus.model';

const clearAllTrips = async () => {
    try {
        await connectDB();
        
        console.log('🧹 Clearing all trip data...');
        
        // Reset all buses to NOT_STARTED and clear locations
        const result = await Bus.updateMany(
            {},
            {
                $set: {
                    tripStatus: 'NOT_STARTED',
                    currentLat: null,
                    currentLon: null,
                    locationHistory: [],
                    lastUpdated: new Date()
                }
            }
        );
        
        console.log(`✅ Reset ${result.modifiedCount} buses`);
        console.log('All trips cleared successfully!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing trips:', error);
        process.exit(1);
    }
};

clearAllTrips();
