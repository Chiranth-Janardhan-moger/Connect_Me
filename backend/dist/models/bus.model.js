"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var TripStatus;
(function (TripStatus) {
    TripStatus["NOT_STARTED"] = "NOT_STARTED";
    TripStatus["ON_ROUTE"] = "ON_ROUTE";
    TripStatus["REACHED"] = "REACHED";
})(TripStatus || (exports.TripStatus = TripStatus = {}));
const LocationHistorySchema = new mongoose_1.Schema({
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
});
const BusSchema = new mongoose_1.Schema({
    busNumber: { type: String, required: true, unique: true },
    routeNumber: { type: Number, required: true }, // Changed from routeId to routeNumber
    driverId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    currentLat: { type: Number },
    currentLon: { type: Number },
    tripStatus: { type: String, enum: Object.values(TripStatus), default: TripStatus.NOT_STARTED },
    lastUpdated: { type: Date },
    locationHistory: [LocationHistorySchema]
});
const Bus = mongoose_1.default.model('Bus', BusSchema);
exports.default = Bus;
