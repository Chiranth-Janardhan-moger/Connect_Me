// Bangalore Geofence Boundaries
export const BANGALORE_BOUNDS = {
  north: 13.1,
  south: 12.8,
  east: 77.8,
  west: 77.4,
};

// Zoom levels
export const ZOOM_LEVELS = {
  MIN: 12,   // Restricted for Bangalore only
  MAX: 18,   // Street level
  DEFAULT: 13,
};

export const MAP_STYLES = {
  OSM: 'https://tiles.openfreemap.org/styles/liberty',
  OPENMAP: 'https://tiles.openfreemap.org/styles/positron',
};

// Constrain coordinates to Bangalore bounds
export const constrainToBangalore = (lat, lng) => {
  return {
    latitude: Math.max(BANGALORE_BOUNDS.south, Math.min(BANGALORE_BOUNDS.north, lat)),
    longitude: Math.max(BANGALORE_BOUNDS.west, Math.min(BANGALORE_BOUNDS.east, lng)),
  };
};

// Check if coordinates are within Bangalore
export const isWithinBangalore = (lat, lng) => {
  return lat >= BANGALORE_BOUNDS.south && lat <= BANGALORE_BOUNDS.north &&
         lng >= BANGALORE_BOUNDS.west && lng <= BANGALORE_BOUNDS.east;
};

// Calculate if zoom level is within limits
export const constrainZoom = (zoom) => {
  return Math.max(ZOOM_LEVELS.MIN, Math.min(ZOOM_LEVELS.MAX, zoom));
};

export default {
  BANGALORE_BOUNDS,
  ZOOM_LEVELS,
  MAP_STYLES,
  constrainZoom,
  constrainToBangalore,
  isWithinBangalore,
};
