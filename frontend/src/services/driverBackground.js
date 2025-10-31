import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocket, connectDriverSocket, emitDriverLocation } from '../config/socket';

export const DRIVER_LOCATION_TASK = 'DRIVER_LOCATION_TASK';

// Define background task once
try {
  if (!TaskManager.isTaskDefined(DRIVER_LOCATION_TASK)) {
    TaskManager.defineTask(DRIVER_LOCATION_TASK, async ({ data, error }) => {
      try {
        if (error) return;
        const { locations } = data || {};
        if (!locations || locations.length === 0) return;
        const latest = locations[locations.length - 1];
        const { latitude, longitude } = latest.coords || {};
        if (typeof latitude !== 'number' || typeof longitude !== 'number') return;

        const routeNumber = await AsyncStorage.getItem('driver_route_number');
        if (!routeNumber) return;

        const socket = getSocket();
        if (!socket || !socket.connected) {
          connectDriverSocket();
        }
        emitDriverLocation(routeNumber, latitude, longitude);
      } catch (_) {}
    });
  }
} catch (_) {}

export const enableDriverBackgroundUpdates = async (routeNumber) => {
  try {
    await AsyncStorage.setItem('driver_trip_active', '1');
    await AsyncStorage.setItem('driver_route_number', String(routeNumber));

    const hasPerm = await Location.getForegroundPermissionsAsync();
    if (hasPerm.status !== 'granted') {
      await Location.requestForegroundPermissionsAsync();
    }
    const bgPerm = await Location.getBackgroundPermissionsAsync();
    if (bgPerm.status !== 'granted') {
      await Location.requestBackgroundPermissionsAsync();
    }

    const isRunning = await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK);
    if (!isRunning) {
      await Location.startLocationUpdatesAsync(DRIVER_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
        showsBackgroundLocationIndicator: true,
        pausesUpdatesAutomatically: true,
        foregroundService: {
          notificationTitle: 'BMS Connect',
          notificationBody: 'Broadcasting bus location',
        },
      });
    }
  } catch (e) {
    // Swallow; foreground tracking still works
  }
};

export const disableDriverBackgroundUpdates = async () => {
  try {
    await AsyncStorage.removeItem('driver_trip_active');
    const isRunning = await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK);
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK);
    }
  } catch (e) {}
};


