// services/locationService.js - Native location utilities used across the app
// Provides: getCurrentLocation, watchPosition, calculateDistance, isStationary

import * as ExpoLocation from 'expo-location';
import Geolocation from '@react-native-community/geolocation';

// Haversine distance in meters
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Simple movement detector using last N locations
export function isStationary(recentLocations = [], thresholdMeters = 5) {
  if (!Array.isArray(recentLocations) || recentLocations.length < 2) return true;
  const first = recentLocations[0];
  const last = recentLocations[recentLocations.length - 1];
  const d = calculateDistance(first.latitude, first.longitude, last.latitude, last.longitude);
  return d < thresholdMeters;
}

// Get a single high-accuracy fix
export async function getCurrentLocation() {
  // Try Expo Location first for consistent permission handling
  try {
    // Request permissions if needed (foreground is enough here)
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    const pos = await ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.High,
      maximumAge: 5000,
      timeout: 15000,
    });

    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy ?? 50,
      timestamp: pos.timestamp ?? Date.now(),
    };
  } catch (e) {
    // Fallback to community Geolocation (works on some devices better)
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords || {};
          resolve({
            latitude,
            longitude,
            accuracy: accuracy ?? 50,
            timestamp: position.timestamp ?? Date.now(),
          });
        },
        (err) => reject(new Error(err?.message || 'Failed to get current location')),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
          distanceFilter: 0,
        }
      );
    });
  }
}

// Start continuous updates; returns a subscription with .remove()
export async function watchPosition(callback) {
  // Prefer Expo watcher for consistency
  try {
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    if (status !== 'granted') throw new Error('Location permission not granted');

    const sub = await ExpoLocation.watchPositionAsync(
      {
        // High accuracy; tune to balance battery and precision
        accuracy: ExpoLocation.Accuracy.High,
        timeInterval: 1000, // ms
        distanceInterval: 0, // meters
        mayShowUserSettingsDialog: true,
      },
      (pos) => {
        try {
          if (!pos || !pos.coords) return;
          callback({
            coords: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy ?? 50,
            },
            timestamp: pos.timestamp ?? Date.now(),
          });
        } catch (_) {}
      }
    );

    // Normalize to have .remove()
    return {
      remove: () => {
        try { sub.remove(); } catch (_) {}
      },
    };
  } catch (_) {
    // Fallback to community Geolocation watcher
    let watchId = null;
    watchId = Geolocation.watchPosition(
      (position) => {
        try {
          callback(position);
        } catch (_) {}
      },
      (err) => {
        // Log but do not crash watchers
        console.warn('watchPosition error:', err?.message || err);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 0,
        interval: 1000,
        fastestInterval: 1000,
        useSignificantChanges: false,
        showsBackgroundLocationIndicator: false,
      }
    );

    return {
      remove: () => {
        try { Geolocation.clearWatch?.(watchId); } catch (_) {}
        try { Geolocation.stopObserving?.(); } catch (_) {}
      },
    };
  }
}