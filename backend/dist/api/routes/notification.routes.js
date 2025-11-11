"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const notification_controller_1 = require("../controllers/notification.controller");
const router = (0, express_1.Router)();
// Any authenticated user can register their token
router.post('/register', auth_middleware_1.verifyToken, notification_controller_1.registerToken);
// Any authenticated user can test their own notifications
router.post('/test', auth_middleware_1.verifyToken, notification_controller_1.testNotification);
// Only admin can broadcast notifications to roles
router.post('/send', auth_middleware_1.verifyToken, role_middleware_1.requireAdmin, notification_controller_1.sendToRole);
// Only admin can send to specific users
router.post('/send-user', auth_middleware_1.verifyToken, role_middleware_1.requireAdmin, notification_controller_1.sendToUser);
exports.default = router;
