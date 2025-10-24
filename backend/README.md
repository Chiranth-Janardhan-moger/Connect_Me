
# College Bus Tracking System - Backend

This repository contains the backend server for the College Bus Tracking System. It's built with Node.js, Express, and TypeScript, utilizing MongoDB for data storage and Socket.IO for real-time communication. The system provides live location tracking for college buses, with role-based access for students and drivers.

## Features

-   **Real-time Location Tracking**: Uses Socket.IO to broadcast live GPS coordinates from drivers to students.
-   **Role-Based Authentication**: Secure JWT-based authentication system for three distinct roles: `STUDENT`, `DRIVER`, and `ADMIN`.
-   **RESTful API**: A clean and organized API for user authentication, trip management, and fetching bus information.
-   **Administrative Endpoints**: Secure endpoints for admins to add new routes, drivers, and students to the system.
-   **Trip Management**: Drivers can start and end trips, which enables location broadcasting. The system automatically detects when a bus reaches its destination.
-   **Scalable Architecture**: Built using a Service-Repository pattern to separate business logic from data access logic, making the codebase clean, testable, and maintainable.
-   **Database Seeding**: Includes a script to populate the database with initial dummy data for easy setup and testing.

## Tech Stack

-   **Backend**: Node.js, Express.js
-   **Language**: TypeScript
-   **Database**: MongoDB with Mongoose ODM
-   **Real-time Communication**: Socket.IO
-   **Authentication**: JSON Web Tokens (JWT)
-   **Password Hashing**: bcryptjs
-   **Environment Management**: dotenv

## Project Structure

The project follows a standard structure for scalable Node.js applications:

```
src/
├── api/
│   ├── controllers/    # Handles HTTP requests and responses
│   ├── middlewares/    # Express middlewares (auth, roles)
│   ├── repositories/   # Data access layer (interacts with DB)
│   ├── routes/         # API route definitions
│   └── services/       # Business logic layer
├── config/             # Database and environment configuration
├── models/             # Mongoose schemas and models
├── scripts/            # Scripts (e.g., database seeder)
├── services/           # Application-wide services (e.g., Socket.IO)
├── types/              # Custom TypeScript type definitions
├── utils/              # Utility functions
├── app.ts              # Express app setup and configuration
└── server.ts           # Server entry point
```

## Setup and Installation

### Prerequisites

-   Node.js (v18 or higher recommended)
-   npm or yarn
-   MongoDB instance (local or cloud-based like MongoDB Atlas)

### Steps

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd bus-tracking-backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the following variables.

    ```env
    # .env
    PORT=4000
    MONGO_URI=mongodb://localhost:27017/bus_tracking_db
    JWT_SECRET=averysecretkeyforjsonwebtoken
    ```

4.  **Seed the database:**
    This command will populate your database with initial data.
    ```bash
    npm run seed
    ```
    -   **Admin Credentials**: `email: admin@college.edu`, `password: password123`
    -   **Driver Credentials**: `email: driver@college.edu`, `password: password123`
    -   **Student Credentials**: `email: student@college.edu`, `password: password123`

5.  **Start the development server:**
    This will start the server with hot-reloading using `ts-node-dev`.
    ```bash
    npm run dev
    ```
    The server will be running at `http://localhost:4000`.

## Production Build

To create a production-ready build:

1.  **Build the TypeScript project:**
    ```bash
    npm run build
    ```
    This compiles the TypeScript code into JavaScript in the `dist/` directory.

2.  **Start the production server:**
    ```bash
    npm start
    ```

## API Documentation

For detailed information about the REST API endpoints and WebSocket events, including administrative functions, please refer to the [API Documentation](./docs/api.md).