// services/etaService.js - PURE MATH ETA CALCULATION
import { calculateDistance } from './locationService';

const getTrafficFactor = () => {
  const hour = new Date().getHours();
  if (hour >= 7 && hour < 10) return 0.5;
  if (hour >= 17 && hour < 20) return 0.5;
  if (hour >= 12 && hour < 14) return 0.7;
  if (hour >= 22 || hour < 6) return 1.5;
  return 1.0;
};

const findClosestStopIndex = (stops, location) => {
  let minDistance = Infinity;
  let closestIndex = 0;
  
  stops.forEach((stop, index) => {
    const dist = calculateDistance(
      location.latitude,
      location.longitude,
      stop.lat,
      stop.lng
    );
    if (dist < minDistance) {
      minDistance = dist;
      closestIndex = index;
    }
  });
  
  return closestIndex;
};

const calculateSmartETA = (distance, routeStops, busLocation, studentLocation) => {
  const baseSpeed = 20000 / 3600;
  const trafficFactor = getTrafficFactor();
  const effectiveSpeed = baseSpeed * trafficFactor;
  const roadFactor = 1.3;
  const roadDistance = distance * roadFactor;
  
  let stopsInBetween = 0;
  if (routeStops && busLocation && studentLocation) {
    const busIndex = findClosestStopIndex(routeStops, busLocation);
    const studentIndex = findClosestStopIndex(routeStops, studentLocation);
    stopsInBetween = Math.abs(studentIndex - busIndex);
  }
  
  const stopDelay = stopsInBetween * 120;
  const travelTime = roadDistance / effectiveSpeed;
  const totalTime = travelTime + stopDelay;
  const totalMinutes = Math.round(totalTime / 60);
  
  return {
    etaText: totalMinutes < 1 ? 'Less than 1 min' : `${totalMinutes} mins`,
    distanceText: `${(distance / 1000).toFixed(1)} km`,
    stopsAway: stopsInBetween,
  };
};

export const fetchETA = async (origin, destination, routeStops = null) => {
  try {
    if (!origin || !destination) {
      console.warn('Invalid origin or destination for ETA calculation');
      return {
        etaText: 'Unable to calculate',
        distanceText: 'Unknown distance',
        stopsAway: 0,
      };
    }

    // Validate coordinates
    if (typeof origin.latitude !== 'number' || typeof origin.longitude !== 'number' ||
        typeof destination.latitude !== 'number' || typeof destination.longitude !== 'number') {
      console.warn('Invalid coordinate values for ETA calculation');
      return {
        etaText: 'Unable to calculate',
        distanceText: 'Unknown distance',
        stopsAway: 0,
      };
    }

    const distance = calculateDistance(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude
    );

    // If distance is too small, return immediate ETA
    if (distance < 100) {
      return {
        etaText: 'Less than 1 min',
        distanceText: 'Very close',
        stopsAway: 0,
      };
    }

    // Use pure math algorithm for ETA calculation
    console.log('📐 Calculating ETA using pure math algorithm');
    return calculateSmartETA(distance, routeStops, origin, destination);
    
  } catch (error) {
    console.error('ETA calculation error:', error);
    
    try {
      const distance = calculateDistance(
        origin.latitude,
        origin.longitude,
        destination.latitude,
        destination.longitude
      );
      
      const trafficFactor = getTrafficFactor();
      const baseSpeed = 20000 / 3600;
      const effectiveSpeed = baseSpeed * trafficFactor;
      const roadDistance = distance * 1.3;
      const etaSeconds = roadDistance / effectiveSpeed;
      const etaMinutes = Math.round(etaSeconds / 60);
      
      return {
        etaText: etaMinutes < 1 ? 'Less than 1 min' : `${etaMinutes} mins`,
        distanceText: `${(distance / 1000).toFixed(1)} km`,
        stopsAway: 0,
      };
    } catch (fallbackError) {
      console.error('Fallback ETA calculation failed:', fallbackError);
      return {
        etaText: 'Unable to calculate',
        distanceText: 'Unknown distance',
        stopsAway: 0,
      };
    }
  }
};