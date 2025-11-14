// mapCacheService.js - Intelligent Map Caching System
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_VERSION = '1.0';
const CACHE_KEY = '@map_cache_initialized';

export const initializeMapCache = async () => {
  try {
    const cacheStatus = await AsyncStorage.getItem(CACHE_KEY);
    
    if (cacheStatus === CACHE_VERSION) {
      console.log('✅ Map cache already initialized');
      return true;
    }

    console.log('🚀 Initializing map cache for first time...');
    
    // Mark cache as initialized
    await AsyncStorage.setItem(CACHE_KEY, CACHE_VERSION);
    
    console.log('✅ Map cache initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Map cache initialization failed:', error);
    return false;
  }
};

export const clearMapCache = async () => {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
    console.log('🗑️ Map cache cleared');
  } catch (error) {
    console.error('Error clearing map cache:', error);
  }
};

export const getMapCacheStatus = async () => {
  try {
    const status = await AsyncStorage.getItem(CACHE_KEY);
    return {
      initialized: status === CACHE_VERSION,
      version: status || 'none'
    };
  } catch (error) {
    return { initialized: false, version: 'error' };
  }
};
