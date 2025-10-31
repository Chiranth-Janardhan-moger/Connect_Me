// Bangalore Map Configuration for MapLibre GL

// Bangalore city boundaries (approximate)
export const BANGALORE_BOUNDS = {
  southwest: { latitude: 12.7342, longitude: 77.3791 }, // Southwest corner
  northeast: { latitude: 13.1739, longitude: 77.8858 }, // Northeast corner
};

// Bangalore center point
export const BANGALORE_CENTER = {
  latitude: 12.9716,
  longitude: 77.5946,
};

// Zoom levels for Bangalore
export const ZOOM_LEVELS = {
  MIN: 10,   // Max out - shows all of Bangalore
  MAX: 18,   // Complete inner zoom - street level
  DEFAULT: 12, // Default view
};

// Map style URLs (Free OpenStreetMap tiles)
export const MAP_STYLES = {
  // OpenStreetMap style (free, no API key)
  OSM: 'https://tiles.openfreemap.org/styles/liberty',
  
  // Maptiler basic (free tier available)
  MAPTILER_BASIC: 'https://api.maptiler.com/maps/basic-v2/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL',
  
  // OpenMapTiles (self-hosted option)
  OPENMAP: 'https://tiles.openfreemap.org/styles/positron',
};

// Check if coordinates are within Bangalore bounds
export const isWithinBangalore = (latitude, longitude) => {
  return (
    latitude >= BANGALORE_BOUNDS.southwest.latitude &&
    latitude <= BANGALORE_BOUNDS.northeast.latitude &&
    longitude >= BANGALORE_BOUNDS.southwest.longitude &&
    longitude <= BANGALORE_BOUNDS.northeast.longitude
  );
};

// Constrain coordinates to Bangalore bounds
export const constrainToBangalore = (latitude, longitude) => {
  const lat = Math.max(
    BANGALORE_BOUNDS.southwest.latitude,
    Math.min(BANGALORE_BOUNDS.northeast.latitude, latitude)
  );
  const lng = Math.max(
    BANGALORE_BOUNDS.southwest.longitude,
    Math.min(BANGALORE_BOUNDS.northeast.longitude, longitude)
  );
  return { latitude: lat, longitude: lng };
};

// Calculate if zoom level is within limits
export const constrainZoom = (zoom) => {
  return Math.max(ZOOM_LEVELS.MIN, Math.min(ZOOM_LEVELS.MAX, zoom));
};

// Bangalore districts for reference
export const BANGALORE_DISTRICTS = [
  'Bangalore Urban',
  'Bangalore Rural',
];

// Major areas in Bangalore
export const MAJOR_AREAS = [
  'Whitefield',
  'Electronic City',
  'Koramangala',
  'Indiranagar',
  'Jayanagar',
  'Marathahalli',
  'HSR Layout',
  'BTM Layout',
  'Malleshwaram',
  'Rajajinagar',
];

export default {
  BANGALORE_BOUNDS,
  BANGALORE_CENTER,
  ZOOM_LEVELS,
  MAP_STYLES,
  isWithinBangalore,
  constrainToBangalore,
  constrainZoom,
};
