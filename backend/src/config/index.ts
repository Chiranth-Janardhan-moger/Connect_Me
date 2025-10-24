
import dotenv from 'dotenv';

dotenv.config();

const config = {
    port: process.env.PORT || 4000,
    mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/bus_tracking_db',
    jwtSecret: process.env.JWT_SECRET || 'averysecretkey'
};

export default config;
