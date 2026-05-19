import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, CACHE_CONFIG } from '../config/keys';

class OfflinePredictorService {
  constructor() {
    this.locationHistory = [];
    this.routePatterns = new Map();
    this.predictions = new Map(); // routeNumber -> prediction data
    this.storageKey = STORAGE_KEYS.OFFLINE_PREDICTIONS;
  }

  async initialize() {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) this.locationHistory = JSON.parse(stored);
    } catch (error) {
      console.error('Init error:', error);
    }
  }

  async recordLocation(routeNumber, lat, lng, timestamp) {
    this.locationHistory.push({ routeNumber, lat, lng, timestamp: timestamp || Date.now() });
    if (this.locationHistory.length > 100) this.locationHistory.shift();
    
    try {
      await AsyncStorage.setItem('location_history', JSON.stringify(this.locationHistory));
    } catch (error) {
      console.error('Save error:', error);
    }
  }

  predictLocation(routeNumber, lastKnownLat, lastKnownLng, secondsOffline) {
    const routeHistory = this.locationHistory.filter(r => r.routeNumber === routeNumber);
    
    if (routeHistory.length < 2) {
      return { lat: lastKnownLat, lng: lastKnownLng, confidence: 0 };
    }

    const avgSpeed = this.calculateAverageSpeed(routeHistory);
    const avgBearing = this.calculateAverageBearing(routeHistory);
    
    const distance = avgSpeed * secondsOffline;
    const predicted = this.movePoint(lastKnownLat, lastKnownLng, distance, avgBearing);
    
    const confidence = Math.max(0, 1 - (secondsOffline / 300));
    
    return { ...predicted, confidence };
  }

  calculateAverageSpeed(history) {
    let totalSpeed = 0;
    let count = 0;
    
    for (let i = 1; i < history.length; i++) {
      const dist = this.calculateDistance(
        history[i-1].lat, history[i-1].lng,
        history[i].lat, history[i].lng
      );
      const time = (history[i].timestamp - history[i-1].timestamp) / 1000;
      if (time > 0) {
        totalSpeed += dist / time;
        count++;
      }
    }
    
    return count > 0 ? totalSpeed / count : 5.5;
  }

  calculateAverageBearing(history) {
    const bearings = [];
    for (let i = 1; i < history.length; i++) {
      bearings.push(this.calculateBearing(
        history[i-1].lat, history[i-1].lng,
        history[i].lat, history[i].lng
      ));
    }
    return bearings.length > 0 ? bearings.reduce((a,b) => a+b) / bearings.length : 0;
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  calculateBearing(lat1, lon1, lat2, lon2) {
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }

  movePoint(lat, lng, distance, bearing) {
    const R = 6371e3;
    const δ = distance / R;
    const θ = bearing * Math.PI / 180;
    const φ1 = lat * Math.PI / 180;
    const λ1 = lng * Math.PI / 180;
    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
    const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
    return { lat: φ2 * 180 / Math.PI, lng: λ2 * 180 / Math.PI };
  }
}

export default new OfflinePredictorService();
