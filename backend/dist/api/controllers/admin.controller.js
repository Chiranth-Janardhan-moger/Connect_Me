"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.getUsers = exports.getAllRoutes = exports.addRoute = exports.addDriver = exports.addStudent = void 0;
const admin_service_1 = __importDefault(require("../services/admin.service"));
const handleServiceError = (error, res) => {
    console.error('Admin operation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    if (errorMessage.includes('not found')) {
        return res.status(404).json({ message: errorMessage });
    }
    if (errorMessage.includes('already in use') || errorMessage.includes('already exists')) {
        return res.status(409).json({ message: errorMessage }); // 409 Conflict
    }
    if (errorMessage.includes('Missing required fields')) {
        return res.status(400).json({ message: errorMessage });
    }
    res.status(500).json({ message: 'Server error during admin operation.' });
};
const addStudent = async (req, res) => {
    try {
        const student = await admin_service_1.default.addStudent(req.body);
        const response = { ...student.toObject() };
        // @ts-ignore
        delete response.passwordHash;
        res.status(201).json({ message: 'Student created successfully.', student: response });
    }
    catch (error) {
        handleServiceError(error, res);
    }
};
exports.addStudent = addStudent;
const addDriver = async (req, res) => {
    try {
        const { driver, bus } = await admin_service_1.default.addDriver(req.body);
        const driverResponse = { ...driver.toObject() };
        // @ts-ignore
        delete driverResponse.passwordHash;
        res.status(201).json({ message: 'Driver and bus created successfully.', driver: driverResponse, bus });
    }
    catch (error) {
        handleServiceError(error, res);
    }
};
exports.addDriver = addDriver;
const addRoute = async (req, res) => {
    try {
        const route = await admin_service_1.default.addRoute(req.body);
        res.status(201).json({ message: 'Route created successfully.', route });
    }
    catch (error) {
        handleServiceError(error, res);
    }
};
exports.addRoute = addRoute;
const getAllRoutes = async (req, res) => {
    try {
        const routes = await admin_service_1.default.getAllRoutes();
        res.status(200).json({ routes });
    }
    catch (error) {
        handleServiceError(error, res);
    }
};
exports.getAllRoutes = getAllRoutes;
const getUsers = async (req, res) => {
    try {
        const roleParam = typeof req.query.role === 'string' ? req.query.role : undefined;
        const users = await admin_service_1.default.getUsersByRole(roleParam);
        const sanitized = users.map((u) => {
            delete u.passwordHash;
            return u;
        });
        res.status(200).json({ users: sanitized });
    }
    catch (error) {
        handleServiceError(error, res);
    }
};
exports.getUsers = getUsers;
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ message: 'userId is required.' });
        }
        const deleted = await admin_service_1.default.deleteUser(userId);
        if (!deleted) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json({ message: 'User deleted successfully.' });
    }
    catch (error) {
        handleServiceError(error, res);
    }
};
exports.deleteUser = deleteUser;
