// Centralized Key Configuration
// All encryption keys and storage keys in one place

/**
 * AsyncStorage Keys
 */
export const STORAGE_KEYS = {
  // Authentication
  AUTH_TOKEN: 'authToken',
  USER: 'user',
  USER_ROLE: 'userRole',
  
  // Driver
  DRIVER_TRIP_ACTIVE: 'driver_trip_active',
  DRIVER_ROUTE_NUMBER: 'driver_route_number',
  
  // Chat Encryption
  CHAT_ENCRYPTION_KEY: 'chat_encryption_key',
  
  // Map & Caching
  TILE_CACHE: 'map_tile_cache',
  TILE_USAGE_HISTORY: 'tile_usage_history',
  MAP_CACHE_INITIALIZED: '@map_cache_initialized',
  
  // Location
  LOCATION_HISTORY: 'location_history',
  OFFLINE_PREDICTIONS: 'offline_predictions',
  
  // Settings
  API_BASE_URL_OVERRIDE: 'apiBaseUrlOverride',
  HTTPS_OVERRIDE: 'httpsOverride',
};

/**
 * Encryption Configuration
 */
export const ENCRYPTION_CONFIG = {
  // Chat Encryption
  CHAT_KEY_SIZE: 256, // bits
  CHAT_ALGORITHM: 'AES-256-CBC',
  
  // Key Generation
  KEY_ITERATIONS: 10000,
  KEY_LENGTH: 32, // bytes (256 bits)
  
  // Initialization Vector
  IV_LENGTH: 16, // bytes (128 bits)
};

/**
 * Cache Configuration
 */
export const CACHE_CONFIG = {
  // Tile Cache
  MAX_TILE_CACHE_SIZE: 100,
  TILE_CACHE_VERSION: '1.0',
  
  // Location Cache
  MAX_LOCATION_HISTORY: 50,
  LOCATION_CACHE_TTL: 3600000, // 1 hour in milliseconds
  
  // Offline Predictions
  MAX_PREDICTION_HISTORY: 100,
};

/**
 * API Configuration
 */
export const API_CONFIG = {
  // Timeouts
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  UPLOAD_TIMEOUT: 60000, // 60 seconds
  
  // Retry
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Rate Limiting
  MAX_REQUESTS_PER_MINUTE: 60,
};

/**
 * Map Configuration
 */
export const MAP_CONFIG = {
  // Bangalore Geofence
  BOUNDS: {
    NORTH: 13.1,
    SOUTH: 12.8,
    EAST: 77.8,
    WEST: 77.4,
  },
  
  // Zoom Levels
  MIN_ZOOM: 11,
  MAX_ZOOM: 18,
  DEFAULT_ZOOM: 13,
  
  // Clustering
  CLUSTER_RADIUS: {
    ZOOM_12: 500, // meters
    ZOOM_14: 200,
    ZOOM_16: 100,
    ZOOM_17: 50,
  },
};

/**
 * Location Configuration
 */
export const LOCATION_CONFIG = {
  // Accuracy Thresholds
  INDOOR_THRESHOLD: 50, // meters
  OUTDOOR_THRESHOLD: 20, // meters
  MAX_ACCURACY: 500, // meters (reject if worse)
  
  // Update Intervals
  GPS_UPDATE_INTERVAL: 1000, // 1 second
  GPS_DISTANCE_FILTER: 1, // 1 meter
  
  // Fusion Weights
  WEIGHTS_OUTDOOR: {
    GPS: 0.7,
    WIFI: 0.2,
    CELL: 0.1,
  },
  WEIGHTS_INDOOR: {
    GPS: 0.3,
    WIFI: 0.5,
    CELL: 0.2,
  },
};

/**
 * SOS Configuration
 */
export const SOS_CONFIG = {
  // Accident Detection
  ACCIDENT_THRESHOLD: 3, // G-force
  ACCIDENT_DURATION: 100, // milliseconds
  
  // Rate Limiting
  MAX_SOS_PER_HOUR: 3,
};

/**
 * Chat Configuration
 */
export const CHAT_CONFIG = {
  // Message Limits
  MAX_MESSAGE_LENGTH: 500,
  MAX_MESSAGES_LOAD: 50,
  
  // Auto-delete
  MESSAGE_EXPIRY_DAYS: 7,
  
  // Typing Indicator
  TYPING_TIMEOUT: 3000, // 3 seconds
};

/**
 * Helper function to get storage key
 */
export const getStorageKey = (keyName) => {
  return STORAGE_KEYS[keyName] || keyName;
};

/**
 * Helper function to generate encryption key
 */
export const generateEncryptionKey = () => {
  const array = new Uint8Array(ENCRYPTION_CONFIG.KEY_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export default {
  STORAGE_KEYS,
  ENCRYPTION_CONFIG,
  CACHE_CONFIG,
  API_CONFIG,
  MAP_CONFIG,
  LOCATION_CONFIG,
  SOS_CONFIG,
  CHAT_CONFIG,
  getStorageKey,
  generateEncryptionKey,
};
