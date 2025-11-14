import { studentAPI } from '../config/api';
import { getCurrentLocation } from '../services/locationService';

// Simple in-memory cache to speed up Map screen
const cache = {
  startedAt: 0,
  routeData: null,
  location: null,
  busLocation: null,
  error: null,
};

const MAX_AGE_MS = 2 * 60 * 1000; // 2 minutes cache

export const getPreloaded = () => cache;

export const resetPreload = () => {
  cache.startedAt = 0;
  cache.routeData = null;
  cache.location = null;
  cache.busLocation = null;
  cache.error = null;
};

export const preloadMapData = async () => {
  try {
    const now = Date.now();
    if (cache.startedAt && now - cache.startedAt < MAX_AGE_MS) return cache;
    cache.startedAt = now;
    cache.error = null;

    // Fire in parallel: route info and current location
    const [routeResp, locResult] = await Promise.allSettled([
      studentAPI.getRouteInfo(),
      getCurrentLocation(),
    ]);

    if (routeResp.status === 'fulfilled' && routeResp.value?.ok) {
      const routeNumber = routeResp.value.data?.routeNumber;
      cache.routeData = { routeNumber };
    }

    if (locResult.status === 'fulfilled' && locResult.value) {
      cache.location = locResult.value;
    }

    // Get bus live location best-effort
    try {
      const live = await studentAPI.getLiveLocation();
      if (live?.ok && live.data?.location) {
        const { latitude, longitude } = live.data.location;
        cache.busLocation = {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        };
      }
    } catch (_) {}

    return cache;
  } catch (e) {
    cache.error = e?.message || String(e);
    return cache;
  }
};


