// services/etaService.js - FREE APIs + SMART ALGORITHM
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

const fetchOpenRouteServiceETA = async (origin, destination) => {
  try {
    const apiKey = process.env.EXPO_PUBLIC_OPENROUTE_API_KEY;
    if (!apiKey) throw new Error('No API key');

    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${origin.longitude},${origin.latitude}&end=${destination.longitude},${destination.latitude}`;

    const response = await fetch(url, { timeout: 5000 });
    if (!response.ok) throw new Error('API request failed');

    const data = await response.json();

    if (data.features && data.features[0]) {
      const route = data.features[0].properties.segments[0];
      const duration = route.duration;
      const distance = route.distance;
      const minutes = Math.round(duration / 60);
      
      return {
        etaText: minutes < 1 ? 'Less than 1 min' : `${minutes} mins`,
        distanceText: `${(distance / 1000).toFixed(1)} km`,
      };
    }

    throw new Error('Invalid response');
  } catch (error) {
    console.log('OpenRouteService error:', error.message);
    throw error;
  }
};

const fetchMapBoxETA = async (origin, destination) => {
  try {
    const apiKey = process.env.EXPO_PUBLIC_MAPBOX_API_KEY;
    if (!apiKey) throw new Error('No API key');

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?access_token=${apiKey}&geometries=geojson`;

    const response = await fetch(url, { timeout: 5000 });
    if (!response.ok) throw new Error('API request failed');

    const data = await response.json();

    if (data.routes && data.routes[0]) {
      const route = data.routes[0];
      const duration = route.duration;
      const distance = route.distance;
      const minutes = Math.round(duration / 60);
      
      return {
        etaText: minutes < 1 ? 'Less than 1 min' : `${minutes} mins`,
        distanceText: `${(distance / 1000).toFixed(1)} km`,
      };
    }

    throw new Error('Invalid response');
  } catch (error) {
    console.log('MapBox error:', error.message);
    throw error;
  }
};

const fetchTomTomETA = async (origin, destination) => {
  try {
    const apiKey = process.env.EXPO_PUBLIC_TOMTOM_API_KEY;
    if (!apiKey) throw new Error('No API key');

    const url = `https://api.tomtom.com/routing/1/calculateRoute/${origin.latitude},${origin.longitude}:${destination.latitude},${destination.longitude}/json?key=${apiKey}&traffic=true`;

    const response = await fetch(url, { timeout: 5000 });
    if (!response.ok) throw new Error('API request failed');

    const data = await response.json();

    if (data.routes && data.routes[0]) {
      const route = data.routes[0].summary;
      const duration = route.travelTimeInSeconds;
      const distance = route.lengthInMeters;
      const minutes = Math.round(duration / 60);
      
      return {
        etaText: minutes < 1 ? 'Less than 1 min' : `${minutes} mins`,
        distanceText: `${(distance / 1000).toFixed(1)} km`,
      };
    }

    throw new Error('Invalid response');
  } catch (error) {
    console.log('TomTom error:', error.message);
    throw error;
  }
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

    // Try OpenRouteService
    try {
      console.log('Trying OpenRouteService...');
      const result = await fetchOpenRouteServiceETA(origin, destination);
      console.log('✅ OpenRouteService success');
      return { ...result, stopsAway: 0 };
    } catch (error) {
      console.log('OpenRouteService not available:', error.message);
    }

    // Try MapBox
    try {
      console.log('Trying MapBox...');
      const result = await fetchMapBoxETA(origin, destination);
      console.log('✅ MapBox success');
      return { ...result, stopsAway: 0 };
    } catch (error) {
      console.log('MapBox not available:', error.message);
    }

    // Try TomTom
    try {
      console.log('Trying TomTom...');
      const result = await fetchTomTomETA(origin, destination);
      console.log('✅ TomTom success');
      return { ...result, stopsAway: 0 };
    } catch (error) {
      console.log('TomTom not available:', error.message);
    }

    // Fallback to smart algorithm
    console.log('Using smart algorithm fallback');
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