// Hybrid Multi-Source Location Fusion Service
// Combines GPS + WiFi + Cell Tower + Device Sensors for optimal accuracy

import * as Location from 'expo-location';
// import { accelerometer, gyroscope } from 'react-native-sensors'; // Disabled for Expo managed workflow
import { LOCATION_CONFIG } from '../config/keys';

const INDOOR_THRESHOLD = LOCATION_CONFIG.INDOOR_THRESHOLD; // GPS accuracy > 50m = likely indoors
const OUTDOOR_THRESHOLD = LOCATION_CONFIG.OUTDOOR_THRESHOLD; // GPS accuracy < 20m = definitely outdoors
const FUSION_INTERVAL = LOCATION_CONFIG.GPS_UPDATE_INTERVAL; // Update every second

class LocationFusionService {
  constructor() {
    this.currentLocation = null;
    this.isIndoor = false;
    this.accuracyHistory = [];
    this.movementDetected = false;
    this.sensorSubscriptions = [];
  }

  /**
   * Calculate weighted location based on multiple sources
   */
  fuseLocations(gpsLocation, wifiLocation, cellLocation, sensorData) {
    const sources = [];

    // GPS source (highest weight when outdoors)
    if (gpsLocation && gpsLocation.accuracy < 100) {
      sources.push({
        lat: gpsLocation.latitude,
        lng: gpsLocation.longitude,
        weight: this.isIndoor ? 0.3 : 0.7, // Lower weight indoors
        accuracy: gpsLocation.accuracy,
        source: 'GPS'
      });
    }

    // WiFi triangulation (higher weight indoors)
    if (wifiLocation) {
      sources.push({
        lat: wifiLocation.latitude,
        lng: wifiLocation.longitude,
        weight: this.isIndoor ? 0.5 : 0.2,
        accuracy: wifiLocation.accuracy || 30,
        source: 'WiFi'
      });
    }

    // Cell tower (fallback)
    if (cellLocation) {
      sources.push({
        lat: cellLocation.latitude,
        lng: cellLocation.longitude,
        weight: 0.2,
        accuracy: cellLocation.accuracy || 100,
        source: 'Cell'
      });
    }

    if (sources.length === 0) return null;

    // Calculate weighted average
    const totalWeight = sources.reduce((sum, s) => sum + s.weight, 0);
    const fusedLat = sources.reduce((sum, s) => sum + (s.lat * s.weight), 0) / totalWeight;
    const fusedLng = sources.reduce((sum, s) => sum + (s.lng * s.weight), 0) / totalWeight;
    const fusedAccuracy = sources.reduce((sum, s) => sum + (s.accuracy * s.weight), 0) / totalWeight;

    console.log(`🔀 Location Fusion: ${sources.map(s => s.source).join('+')} → Accuracy: ${fusedAccuracy.toFixed(1)}m`);

    return {
      latitude: fusedLat,
      longitude: fusedLng,
      accuracy: fusedAccuracy,
      sources: sources.map(s => s.source),
      isIndoor: this.isIndoor,
      timestamp: Date.now()
    };
  }

  /**
   * Detect indoor/outdoor environment based on GPS accuracy
   */
  detectEnvironment(accuracy) {
    this.accuracyHistory.push(accuracy);
    if (this.accuracyHistory.length > 10) {
      this.accuracyHistory.shift();
    }

    const avgAccuracy = this.accuracyHistory.reduce((a, b) => a + b, 0) / this.accuracyHistory.length;

    if (avgAccuracy > INDOOR_THRESHOLD) {
      if (!this.isIndoor) {
        console.log('🏢 Detected INDOOR environment (GPS accuracy degraded)');
        this.isIndoor = true;
      }
    } else if (avgAccuracy < OUTDOOR_THRESHOLD) {
      if (this.isIndoor) {
        console.log('🌳 Detected OUTDOOR environment (GPS accuracy improved)');
        this.isIndoor = false;
      }
    }

    return this.isIndoor;
  }

  /**
   * Start sensor monitoring for movement detection
   */
  startSensorMonitoring() {
    // Monitor accelerometer for movement
    const accelSubscription = accelerometer.subscribe(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      this.movementDetected = magnitude > 10; // Threshold for movement
    });

    this.sensorSubscriptions.push(accelSubscription);
  }

  /**
   * Stop sensor monitoring
   */
  stopSensorMonitoring() {
    this.sensorSubscriptions.forEach(sub => sub.unsubscribe());
    this.sensorSubscriptions = [];
  }

  /**
   * Get location with fusion algorithm
   */
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const gpsLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
          };

          // Detect environment
          this.detectEnvironment(gpsLocation.accuracy);

          // For now, use GPS as primary source
          // TODO: Integrate WiFi and Cell tower APIs
          const fusedLocation = this.fuseLocations(gpsLocation, null, null, null);

          resolve(fusedLocation || gpsLocation);
        },
        (error) => {
          console.error('GPS error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 1000,
        }
      );
    });
  }

  /**
   * Watch location with fusion
   */
  watchLocation(callback, errorCallback) {
    this.startSensorMonitoring();

    const watchId = Geolocation.watchPosition(
      (position) => {
        const gpsLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
        };

        this.detectEnvironment(gpsLocation.accuracy);

        const fusedLocation = this.fuseLocations(gpsLocation, null, null, null);
        
        if (callback) {
          callback(fusedLocation || gpsLocation);
        }
      },
      (error) => {
        console.error('Watch location error:', error);
        if (errorCallback) errorCallback(error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 1,
        interval: FUSION_INTERVAL,
        fastestInterval: FUSION_INTERVAL,
      }
    );

    return watchId;
  }

  /**
   * Clear watch
   */
  clearWatch(watchId) {
    Geolocation.clearWatch(watchId);
    this.stopSensorMonitoring();
  }
}

export default new LocationFusionService();
