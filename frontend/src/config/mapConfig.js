// Bangalore Geofence Boundaries - Expanded for better user experience
export const BANGALORE_BOUNDS = {
  north: 13.85,   // reduced (was 14.10)
  south: 12.40,   // reduced (was 11.95)
  east: 78.40,    // still covers Kolar district
  west: 76.70,    // still covers Tumkur district
};

// Zoom levels
export const ZOOM_LEVELS = {
  MIN: 7.5,        // fully zoomed out enough to show ALL districts
  MAX: 18,         // good street-level zoom
  DEFAULT: 11,    // perfect startup zoom for Bangalore + Tumkur + Mandya + Kolar
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
