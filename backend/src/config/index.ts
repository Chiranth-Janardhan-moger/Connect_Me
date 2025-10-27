
import dotenv from 'dotenv';

dotenv.config();

const config = {
    port: process.env.PORT,
    mongoURI: process.env.MONGO || "mongodb+srv://Chiranth:Chiranthmoger@cluster0.dcivtjb.mongodb.net/?appName=Cluster0",

    jwtSecret: process.env.JWT_SECRET || "aea0aacaa8fb1a993389fcf0338757a3ae5707bc03e696b3effe8ecac6a2199a33ff30a56ba15ad01dde488ac1042b1aa6af45ffa0bbb9cb2b88bdf8d647260d"
};
 
//mongodb://localhost:27017/bus_tracking_db


export default config;
