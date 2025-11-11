"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const auth_service_1 = __importDefault(require("../services/auth.service"));
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    try {
        const result = await auth_service_1.default.loginUser(email, password);
        res.json(result);
    }
    catch (error) {
        console.error('Login error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        if (errorMessage.includes('User not found')) {
            return res.status(404).json({ message: errorMessage });
        }
        if (errorMessage.includes('Invalid credentials')) {
            return res.status(401).json({ message: errorMessage });
        }
        res.status(500).json({ message: 'Server error during login.' });
    }
};
exports.login = login;
