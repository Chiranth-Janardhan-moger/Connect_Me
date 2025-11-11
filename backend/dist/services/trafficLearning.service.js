"use strict";
// Traffic-Aware ETA Prediction Service
// Learns from historical trip data to predict delays
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tripHistory_model_1 = __importDefault(require("../models/tripHistory.model"));
class TrafficLearningService {
    constructor() {
        this.trafficPatterns = new Map();
        this.initialized = false;
    }
    /**
     * Initialize and load historical data
     */
    async initialize() {
        if (this.initialized)
            return;
        try {
            await this.loadHistoricalData();
            this.initialized = true;
            console.log('✅ Traffic learning service initialized');
        }
        catch (error) {
            console.error('Traffic learning init error:', error);
        }
    }
    /**
     * Load historical trip data
     */
    async loadHistoricalData() {
        try {
            const trips = await tripHistory_model_1.default.find({
                startTime: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
            });
            console.log(`📊 Loaded ${trips.length} historical trips`);
            // Build traffic patterns
            trips.forEach((trip) => {
                const key = this.getPatternKey(trip.routeNumber, trip.dayOfWeek, trip.hourOfDay);
                if (!this.trafficPatterns.has(key)) {
                    this.trafficPatterns.set(key, []);
                }
                // Calculate speed (km/h)
                const speed = (trip.distance / trip.duration) * 60;
                this.trafficPatterns.get(key).push(speed);
            });
            console.log(`🗺️ Built ${this.trafficPatterns.size} traffic patterns`);
        }
        catch (error) {
            console.error('Load historical data error:', error);
        }
    }
    /**
     * Record a completed trip
     */
    async recordTrip(data) {
        try {
            const duration = (data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60); // minutes
            const dayOfWeek = data.startTime.getDay();
            const hourOfDay = data.startTime.getHours();
            await tripHistory_model_1.default.create({
                ...data,
                duration,
                dayOfWeek,
                hourOfDay,
            });
            // Update pattern
            const key = this.getPatternKey(data.routeNumber, dayOfWeek, hourOfDay);
            const speed = (data.distance / duration) * 60;
            if (!this.trafficPatterns.has(key)) {
                this.trafficPatterns.set(key, []);
            }
            this.trafficPatterns.get(key).push(speed);
            // Keep only last 100 records per pattern
            if (this.trafficPatterns.get(key).length > 100) {
                this.trafficPatterns.get(key).shift();
            }
            console.log(`✅ Trip recorded: Route ${data.routeNumber}, ${duration.toFixed(1)} min`);
        }
        catch (error) {
            console.error('Record trip error:', error);
        }
    }
    /**
     * Predict traffic delay for a route
     */
    predictDelay(routeNumber, distance) {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const hourOfDay = now.getHours();
        const key = this.getPatternKey(routeNumber, dayOfWeek, hourOfDay);
        const speeds = this.trafficPatterns.get(key);
        if (!speeds || speeds.length < 3) {
            // Not enough data, use default traffic factor
            return this.getDefaultTrafficFactor(hourOfDay);
        }
        // Calculate average speed
        const avgSpeed = speeds.reduce((sum, s) => sum + s, 0) / speeds.length;
        // Base speed (no traffic)
        const baseSpeed = 20; // km/h
        // Calculate delay factor
        const delayFactor = baseSpeed / avgSpeed;
        console.log(`🚦 Route ${routeNumber} at ${hourOfDay}:00 - Avg speed: ${avgSpeed.toFixed(1)} km/h, Delay factor: ${delayFactor.toFixed(2)}x`);
        return delayFactor;
    }
    /**
     * Get enhanced ETA with traffic learning
     */
    getEnhancedETA(routeNumber, distance, baseETA) {
        const delayFactor = this.predictDelay(routeNumber, distance);
        const enhancedETA = baseETA * delayFactor;
        console.log(`⏱️ Base ETA: ${baseETA} min → Enhanced ETA: ${enhancedETA.toFixed(1)} min`);
        return Math.round(enhancedETA);
    }
    /**
     * Get pattern key
     */
    getPatternKey(routeNumber, dayOfWeek, hourOfDay) {
        return `${routeNumber}:${dayOfWeek}:${hourOfDay}`;
    }
    /**
     * Default traffic factor (fallback)
     */
    getDefaultTrafficFactor(hour) {
        // Peak hours: 8-10 AM, 5-7 PM
        if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)) {
            return 1.5; // 50% slower
        }
        // Off-peak
        if (hour >= 22 || hour <= 6) {
            return 0.8; // 20% faster
        }
        // Normal
        return 1.0;
    }
    /**
     * Get traffic statistics
     */
    getStatistics(routeNumber) {
        if (routeNumber) {
            const patterns = Array.from(this.trafficPatterns.entries())
                .filter(([key]) => key.startsWith(`${routeNumber}:`));
            return {
                routeNumber,
                patterns: patterns.length,
                totalTrips: patterns.reduce((sum, [, speeds]) => sum + speeds.length, 0),
            };
        }
        return {
            totalPatterns: this.trafficPatterns.size,
            totalTrips: Array.from(this.trafficPatterns.values())
                .reduce((sum, speeds) => sum + speeds.length, 0),
        };
    }
}
exports.default = new TrafficLearningService();
