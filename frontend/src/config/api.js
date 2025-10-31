import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Production backend (uses HTTPS)
const PRODUCTION_URL = 'https://connect-me-8hc8.onrender.com';

// Local development IP (uses HTTP - no SSL certificate)
const LOCAL_DEV_IP = '192.168.1.103:5000';

// Auto-detect: Use HTTPS for domains, HTTP for local IPs
const isLocalIP = (url) => {
  try {
    const hostname = new URL(url).hostname;
    return /^(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)$/.test(hostname);
  } catch {
    return false;
  }
};

const normalizeUrl = (url) => {
  // If URL already has protocol, use it
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Auto-add protocol based on hostname
  const testUrl = `https://${url}`;
  return isLocalIP(testUrl) ? `http://${url}` : testUrl;
};

// Default to local dev IP (will auto-detect protocol)
const DEFAULT_CLOUD_URL = normalizeUrl(LOCAL_DEV_IP);

const getEnvBaseUrl = () => {
  // Prefer Expo public env
  const envUrl = Constants?.expoConfig?.extra?.API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL;
  if (typeof envUrl === 'string' && envUrl.length > 0) {
    return normalizeUrl(envUrl);
  }
  return null;
};

export const getBaseUrl = async () => {
  // Allow runtime override for development
  const override = await AsyncStorage.getItem('API_BASE_URL_OVERRIDE');
  if (override) return override;
  const envUrl = getEnvBaseUrl();
  if (envUrl) return envUrl;
  return DEFAULT_CLOUD_URL;
};

// Force HTTP for local development - set immediately to avoid async race
export let API_BASE_URL = DEFAULT_CLOUD_URL;
export let SOCKET_URL = DEFAULT_CLOUD_URL;

// Initialize base URLs asynchronously (best-effort)
(async () => {
  try {
    // Clear any HTTPS override for local IPs (they should use HTTP)
    const override = await AsyncStorage.getItem('API_BASE_URL_OVERRIDE');
    if (override && override.startsWith('https://') && isLocalIP(override)) {
      console.log('🔧 Clearing invalid HTTPS override for local IP:', override);
      await AsyncStorage.removeItem('API_BASE_URL_OVERRIDE');
    }
    
    const base = await getBaseUrl();
    if (base !== API_BASE_URL) {
      API_BASE_URL = base;
      SOCKET_URL = base;
      console.log('🌐 API base URL updated:', API_BASE_URL);
    } else {
      console.log('🌐 API base URL:', API_BASE_URL);
    }
  } catch (e) {
    console.warn('Error initializing API base URL:', e);
  }
})();

export const setApiBaseUrlOverride = async (baseUrl) => {
  try {
    if (!baseUrl) return;
    // Normalize the URL (auto-detect HTTP vs HTTPS)
    const normalizedUrl = normalizeUrl(baseUrl);
    await AsyncStorage.setItem('API_BASE_URL_OVERRIDE', normalizedUrl);
    API_BASE_URL = normalizedUrl;
    SOCKET_URL = normalizedUrl;
    console.log('✅ API base URL override set to:', normalizedUrl);
  } catch (e) {
    console.warn('Failed setting API_BASE_URL_OVERRIDE', e?.message || e);
  }
};

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  
  // Student
  STUDENT_LIVE_LOCATION: '/api/student/live-location',
  STUDENT_ROUTE_INFO: '/api/student/route-info',
  
  // Driver
  DRIVER_START_TRIP: '/api/driver/start-trip',
  DRIVER_END_TRIP: '/api/driver/end-trip',
  
  // Admin
  ADMIN_ROUTES: '/api/admin/routes',
  ADMIN_USERS: '/api/admin/users', // expects optional ?role=student|driver
  
  // Notifications
  NOTIFICATIONS_REGISTER: '/api/notifications/register',
  ADMIN_NOTIFICATIONS_SEND: '/api/notifications/send',
};

export const apiCall = async (endpoint, options = {}) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Increased timeout for better reliability
    const timeout = options.timeout ?? 15000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('API call timeout after', timeout, 'ms');
      controller.abort();
    }, timeout);

    // Try primary base, and if it's an http/https mismatch on a raw IP, try the flipped scheme as fallback
    const bases = [API_BASE_URL];
    try {
      const urlObj = new URL(API_BASE_URL);
      const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(urlObj.hostname);
      if (isIp) {
        const flipped = new URL(API_BASE_URL);
        flipped.protocol = urlObj.protocol === 'https:' ? 'http:' : 'https:';
        if (flipped.origin !== urlObj.origin) bases.push(flipped.origin);
      }
    } catch (_) {}

    let lastError;
    for (const base of bases) {
      try {
        const response = await fetch(`${base}${endpoint}`, {
          ...options,
          headers,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        
        let data = { message: 'No response data' }; 
        try {
          const responseText = await response.text();
          if (responseText) {
            data = JSON.parse(responseText);
          }
        } catch (parseError) {
          console.warn('Failed to parse response:', parseError.message);
          data = { message: 'Invalid server response format' };
        }
        
        // Clear auth on both 401 (unauthorized) and 400 (invalid token)
        if (response.status === 401 || (response.status === 400 && data?.message?.toLowerCase().includes('token'))) {
          try {
            await AsyncStorage.multiRemove(['authToken', 'user', 'userRole', 'driver_trip_active', 'driver_route_number']);
            console.log('🔐 Auth cleared due to invalid/expired token');
          } catch (storageError) {
            console.warn('Failed to clear storage:', storageError.message);
          }
        }
        
        return {
          ok: response.ok,
          status: response.status,
          data,
        };
      } catch (err) {
        lastError = err;
        console.warn('API call error on base', base, err?.message || err);
        
        // If it's an abort error, don't try other bases
        if (err.name === 'AbortError') {
          break;
        }
      }
    }
    
    // Clear timeout if not already cleared
    clearTimeout(timeoutId);
    
    // If all attempts failed
    return {
      ok: false,
      status: 0,
      data: { 
        message: lastError?.name === 'AbortError' 
          ? 'Request timeout. Please check your connection.' 
          : 'Network error. Please check your connection.' 
      },
      error: lastError?.message || 'Network error',
    };
  } catch (error) {
    console.error('API call error:', error);
    return {
      ok: false,
      status: 0,
      data: { message: 'Network error. Please check your connection.' },
      error: error.message,
    };
  }
};

// Auth APIs
export const authAPI = {
  login: async (email, password) => {
    return await apiCall(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  
  logout: async () => {
    return await apiCall(API_ENDPOINTS.LOGOUT, {
      method: 'POST',
    });
  },
};

// Student APIs
export const studentAPI = {
  getLiveLocation: async () => {
    return await apiCall(API_ENDPOINTS.STUDENT_LIVE_LOCATION, {
      method: 'GET',
    });
  },
  
  getRouteInfo: async () => {
    return await apiCall(API_ENDPOINTS.STUDENT_ROUTE_INFO, {
      method: 'GET',
    });
  },
};

// Driver APIs
export const driverAPI = {
  startTrip: async () => {
    return await apiCall(API_ENDPOINTS.DRIVER_START_TRIP, {
      method: 'POST',
    });
  },
  
  endTrip: async () => {
    return await apiCall(API_ENDPOINTS.DRIVER_END_TRIP, {
      method: 'POST',
    });
  },
};

// Admin APIs
export const adminAPI = {
  getRoutes: async () => {
    return await apiCall(API_ENDPOINTS.ADMIN_ROUTES, {
      method: 'GET',
    });
  },
  getUsers: async (role) => {
    const endpoint = role ? `${API_ENDPOINTS.ADMIN_USERS}?role=${encodeURIComponent(role)}` : API_ENDPOINTS.ADMIN_USERS;
    return await apiCall(endpoint, { method: 'GET' });
  },
  deleteUser: async (userId) => {
    return await apiCall(`${API_ENDPOINTS.ADMIN_USERS}/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
  },
  sendNotification: async ({ role, title, body }) => {
    return await apiCall(API_ENDPOINTS.ADMIN_NOTIFICATIONS_SEND, {
      method: 'POST',
      body: JSON.stringify({ role, title, body }),
    });
  },
};

// Notification APIs
export const notificationAPI = {
  registerToken: async (expoPushToken) => {
    return await apiCall(API_ENDPOINTS.NOTIFICATIONS_REGISTER, {
      method: 'POST',
      body: JSON.stringify({ token: expoPushToken }),
    });
  },
};