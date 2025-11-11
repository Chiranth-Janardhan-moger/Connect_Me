"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const appVersion_controller_1 = require("../controllers/appVersion.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const router = (0, express_1.Router)();
// Public route - anyone can check for updates
router.get('/version', appVersion_controller_1.getAppVersion);
// Admin only - update version
router.put('/version', auth_middleware_1.verifyToken, role_middleware_1.requireAdmin, appVersion_controller_1.updateAppVersion);
exports.default = router;
