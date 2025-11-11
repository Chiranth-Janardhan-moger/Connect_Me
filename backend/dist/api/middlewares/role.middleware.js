"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireStudent = exports.requireDriver = void 0;
const user_model_1 = require("../../models/user.model");
const requireDriver = (req, res, next) => {
    if (req.user && req.user.role === user_model_1.UserRole.DRIVER) {
        next();
    }
    else {
        res.status(403).json({ message: 'Forbidden. Driver access required.' });
    }
};
exports.requireDriver = requireDriver;
const requireStudent = (req, res, next) => {
    if (req.user && req.user.role === user_model_1.UserRole.STUDENT) {
        next();
    }
    else {
        res.status(403).json({ message: 'Forbidden. Student access required.' });
    }
};
exports.requireStudent = requireStudent;
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === user_model_1.UserRole.ADMIN) {
        next();
    }
    else {
        res.status(403).json({ message: 'Forbidden. Admin access required.' });
    }
};
exports.requireAdmin = requireAdmin;
