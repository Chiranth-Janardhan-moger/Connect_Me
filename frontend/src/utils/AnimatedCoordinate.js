// Custom Animated Coordinate for Ola Maps (replacement for AnimatedRegion from react-native-maps)
import { Animated } from 'react-native';

export class AnimatedCoordinate {
  constructor(coordinate) {
    this.latitude = new Animated.Value(coordinate.latitude);
    this.longitude = new Animated.Value(coordinate.longitude);
    
    // Create a reference object that mimics the AnimatedRegion behavior
    this._value = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude
    };
    
    // Add listeners to keep track of current values
    this.latitude.addListener(({ value }) => {
      this._value.latitude = value;
    });
    
    this.longitude.addListener(({ value }) => {
      this._value.longitude = value;
    });
  }

  setValue(coordinate) {
    this.latitude.setValue(coordinate.latitude);
    this.longitude.setValue(coordinate.longitude);
    this._value = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude
    };
  }

  timing(coordinate, config = {}) {
    const { duration = 1000, ...otherConfig } = config;
    
    this._value = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude
    };

    return Animated.parallel([
      Animated.timing(this.latitude, {
        toValue: coordinate.latitude,
        duration,
        useNativeDriver: false,
        ...otherConfig
      }),
      Animated.timing(this.longitude, {
        toValue: coordinate.longitude,
        duration,
        useNativeDriver: false,
        ...otherConfig
      })
    ]);
  }

  spring(coordinate, config = {}) {
    this._value = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude
    };

    return Animated.parallel([
      Animated.spring(this.latitude, {
        toValue: coordinate.latitude,
        useNativeDriver: false,
        ...config
      }),
      Animated.spring(this.longitude, {
        toValue: coordinate.longitude,
        useNativeDriver: false,
        ...config
      })
    ]);
  }

  // Get current value
  get value() {
    return this._value;
  }

  // For compatibility with existing code
  stopAnimation(callback) {
    this.latitude.stopAnimation();
    this.longitude.stopAnimation();
    if (callback) {
      callback(this._value);
    }
  }
}

export default AnimatedCoordinate;
