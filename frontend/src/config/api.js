import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL - Change this once for the entire app
export const API_BASE_URL = 'http://192.168.1.102:4000'; // or 'http://192.168.1.100:3000' for local

export const SOCKET_URL = API_BASE_URL; // Socket.io uses same base URL

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  
  // Student
  STUDENT_LIVE_LOCATION: '/api/student/live-location',
  
  // Driver
  DRIVER_START_TRIP: '/api/driver/start-trip',
  DRIVER_END_TRIP: '/api/driver/end-trip',
};

export const apiCall = async (endpoint, options = {}) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    let data; 
    try {
      data = await response.json();
    } catch (e) {
      data = { message: 'Invalid server response' + e.message };
    }
    
    if (response.status === 401) {
      await AsyncStorage.multiRemove(['authToken', 'user', 'userRole']);
    }
    
    return {
      ok: response.ok,
      status: response.status,
      data,
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