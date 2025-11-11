
import dotenv from 'dotenv';

dotenv.config();

interface Config {
    port: string;
    mongoURI: string;
    jwtSecret: string;
}

// Validate required environment variables
const requiredEnvVars = ['PORT', 'MONGO', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

const config: Config = {
    port: process.env.PORT!,
    mongoURI: process.env.MONGO!,
    jwtSecret: process.env.JWT_SECRET!,
};


export default config;
