"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sos_controller_1 = require("../controllers/sos.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_middleware_1.verifyToken);
// Send SOS alert (with rate limiting)
router.post('/send', rateLimiter_1.sosLimiter, sos_controller_1.sendSOS);
exports.default = router;
