// Indoor/Outdoor Environment Detection Service
// Automatically switches location sources based on GPS accuracy

const INDOOR_THRESHOLD = 50; // meters
const OUTDOOR_THRESHOLD = 20; // meters
const HISTORY_SIZE = 10;

class EnvironmentDetectionService {
  constructor() {
    this.accuracyHistory = [];
    this.currentEnvironment = 'outdoor'; // 'indoor' or 'outdoor'
    this.listeners = [];
  }

  /**
   * Add accuracy reading and detect environment
   */
  addAccuracyReading(accuracy) {
    this.accuracyHistory.push(accuracy);
    
    if (this.accuracyHistory.length > HISTORY_SIZE) {
      this.accuracyHistory.shift();
    }

    const avgAccuracy = this.accuracyHistory.reduce((a, b) => a + b, 0) / this.accuracyHistory.length;
    const previousEnvironment = this.currentEnvironment;

    // Detect environment change
    if (avgAccuracy > INDOOR_THRESHOLD && this.currentEnvironment === 'outdoor') {
      this.currentEnvironment = 'indoor';
      console.log('🏢 Environment changed: OUTDOOR → INDOOR');
      this.notifyListeners('indoor', avgAccuracy);
    } else if (avgAccuracy < OUTDOOR_THRESHOLD && this.currentEnvironment === 'indoor') {
      this.currentEnvironment = 'outdoor';
      console.log('🌳 Environment changed: INDOOR → OUTDOOR');
      this.notifyListeners('outdoor', avgAccuracy);
    }

    return {
      environment: this.currentEnvironment,
      accuracy: avgAccuracy,
      changed: previousEnvironment !== this.currentEnvironment
    };
  }

  /**
   * Subscribe to environment changes
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners
   */
  notifyListeners(environment, accuracy) {
    this.listeners.forEach(callback => {
      try {
        callback(environment, accuracy);
      } catch (error) {
        console.error('Error in environment listener:', error);
      }
    });
  }

  /**
   * Get current environment
   */
  getCurrentEnvironment() {
    return this.currentEnvironment;
  }

  /**
   * Reset detection
   */
  reset() {
    this.accuracyHistory = [];
    this.currentEnvironment = 'outdoor';
  }
}

export default new EnvironmentDetectionService();
