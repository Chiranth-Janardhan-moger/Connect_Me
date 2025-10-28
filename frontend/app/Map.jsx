import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  StatusBar, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import MapView, { Polyline, Marker, AnimatedRegion } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { studentAPI } from '../src/config/api';
import {
  joinBusRoom,
  listenToLocationUpdates,
  listenToBusReached,
  disconnectSocket,
} from '../src/config/socket';

// Bangalore stops data
const BANGALORE_STOPS = {
  1: {
    routeId: 1,
    routeName: "Route-1",
    stops: [
      { id: 1, name: "Yelahanka New Town", lat: 13.1007, lng: 77.5963, time: "06:00 AM" },
      { id: 2, name: "Yelahanka Old Town", lat: 13.0950, lng: 77.5940, time: "06:10 AM" },
      { id: 3, name: "Jakkur Cross", lat: 13.0850, lng: 77.5980, time: "06:20 AM" },
      { id: 4, name: "Hebbal Flyover", lat: 13.0358, lng: 77.5970, time: "06:35 AM" },
      { id: 5, name: "Mekhri Circle", lat: 13.0157, lng: 77.5850, time: "06:50 AM" },
      { id: 6, name: "Cubbon Park", lat: 12.9767, lng: 77.5923, time: "07:05 AM" },
      { id: 7, name: "MG Road", lat: 12.9716, lng: 77.5946, time: "07:15 AM" },
    ]
  },
  2: {
    routeId: 2,
    routeName: "Route-2", 
    stops: [
      { id: 1, name: "BMSIT College", lat: 13.133845, lng: 77.568760, time: "06:30 AM" },
      { id: 2, name: "Puttenahalli Cross", lat: 13.0920, lng: 77.6020, time: "06:40 AM" },
      { id: 3, name: "Kogilu Cross", lat: 13.0800, lng: 77.6100, time: "06:50 AM" },
      { id: 4, name: "Nagavara", lat: 13.0520, lng: 77.6150, time: "07:05 AM" },
      { id: 5, name: "Hennur Cross", lat: 13.0380, lng: 77.6380, time: "07:20 AM" },
      { id: 6, name: "Tin Factory", lat: 13.0280, lng: 77.6280, time: "07:30 AM" },
      { id: 7, name: "KR Puram", lat: 13.0100, lng: 77.6200, time: "07:45 AM" },
      { id: 8, name: "Whitefield", lat: 12.9700, lng: 77.7500, time: "08:00 AM" },
    ]
  },
};

export default function Map() {
  const router = useRouter();
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [tripStatus, setTripStatus] = useState('NOT_STARTED');
  const [busLocation, setBusLocation] = useState(null);
  const [studentLocation, setStudentLocation] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [etaText, setEtaText] = useState(null);
  const [distanceText, setDistanceText] = useState(null);
  
  // Animated coordinates
  const busAnimatedCoord = useRef(null);
  const studentAnimatedCoord = useRef(null);
  
  // Location tracking refs
  const locationSubscription = useRef(null);
  const hasCenteredOnStudent = useRef(false);
  const lastUpdateTime = useRef(Date.now());
  
  // Route data
  const [routeData, setRouteData] = useState(null);
  const [routeLoading, setRouteLoading] = useState(true);
  
  // Fetch route data
  const fetchRouteData = async () => {
    try {
      setRouteLoading(true);
      const response = await studentAPI.getRouteInfo();
      
      if (response.ok && response.data) {
        const routeNumber = response.data.routeNumber;
        const localRouteData = BANGALORE_STOPS[routeNumber];
        
        if (localRouteData) {
          setRouteData(localRouteData);
        } else {
          console.error('Route not found:', routeNumber);
          Alert.alert('Error', 'Route information not available.');
        }
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      Alert.alert('Error', 'Failed to load route information.');
    } finally {
      setRouteLoading(false);
    }
  };
  
  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };
  
  // Fetch ETA using Google Distance Matrix API
  const fetchETA = async (origin, destination) => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.warn('Google Maps API key not configured');
        // Fallback: Calculate simple ETA based on distance
        const distance = calculateDistance(
          origin.latitude, 
          origin.longitude, 
          destination.latitude, 
          destination.longitude
        );
        
        // Assume average speed of 20 km/h in city traffic
        const avgSpeedMps = 20000 / 3600; // 20 km/h to m/s
        const etaSeconds = distance / avgSpeedMps;
        const etaMinutes = Math.round(etaSeconds / 60);
        
        setDistanceText(`${(distance / 1000).toFixed(1)} km`);
        setEtaText(etaMinutes < 1 ? 'Less than 1 min' : `${etaMinutes} mins`);
        return;
      }
      
      const origins = `${origin.latitude},${origin.longitude}`;
      const destinations = `${destination.latitude},${destination.longitude}`;
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&departure_time=now&traffic_model=best_guess&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.rows[0]?.elements[0]) {
        const element = data.rows[0].elements[0];
        
        if (element.status === 'OK') {
          // Use duration_in_traffic if available, otherwise use duration
          const duration = element.duration_in_traffic || element.duration;
          const distance = element.distance;
          
          setEtaText(duration?.text || 'Calculating...');
          setDistanceText(distance?.text || '');
        } else {
          // Fallback to simple calculation
          const distance = calculateDistance(
            origin.latitude, origin.longitude,
            destination.latitude, destination.longitude
          );
          const avgSpeedMps = 20000 / 3600;
          const etaMinutes = Math.round((distance / avgSpeedMps) / 60);
          setDistanceText(`${(distance / 1000).toFixed(1)} km`);
          setEtaText(`${etaMinutes} mins`);
        }
      }
    } catch (error) {
      console.error('ETA fetch error:', error);
      // Fallback calculation
      const distance = calculateDistance(
        origin.latitude, origin.longitude,
        destination.latitude, destination.longitude
      );
      const avgSpeedMps = 20000 / 3600;
      const etaMinutes = Math.round((distance / avgSpeedMps) / 60);
      setDistanceText(`${(distance / 1000).toFixed(1)} km`);
      setEtaText(`${etaMinutes} mins`);
    }
  };
  
  // Get accurate student location with proper filtering
  const getStudentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        setStatusMessage('Location permission required');
        return;
      }

      // Get initial position
      const initialPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        maximumAge: 0,
      });

      const initialLocation = {
        latitude: initialPosition.coords.latitude,
        longitude: initialPosition.coords.longitude,
      };

      setStudentLocation(initialLocation);
      
      // Initialize animated coordinate
      if (!studentAnimatedCoord.current) {
        studentAnimatedCoord.current = new AnimatedRegion({
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      }

      // Center map on student location once
      if (mapRef.current && !hasCenteredOnStudent.current) {
        hasCenteredOnStudent.current = true;
        setTimeout(() => {
          mapRef.current?.animateToRegion({
            ...initialLocation,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }, 1000);
        }, 500);
      }

      // Start watching position with optimized settings
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000, // Update every 2 seconds
          distanceInterval: 5, // Or when moved 5 meters
        },
        (position) => {
          const now = Date.now();
          const timeDelta = now - lastUpdateTime.current;
          
          // Only update if enough time has passed and position is accurate
          if (timeDelta < 1500 || !position.coords.accuracy || position.coords.accuracy > 20) {
            return;
          }
          
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          // Check if movement is significant (more than 3 meters)
          if (studentLocation) {
            const distance = calculateDistance(
              studentLocation.latitude,
              studentLocation.longitude,
              newLocation.latitude,
              newLocation.longitude
            );
            
            // Ignore tiny movements (GPS drift)
            if (distance < 3) {
              return;
            }
          }

          lastUpdateTime.current = now;
          setStudentLocation(newLocation);

          // Smooth animation
          if (studentAnimatedCoord.current) {
            studentAnimatedCoord.current.timing({
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
              duration: 1500,
              useNativeDriver: false,
            }).start();
          }
        }
      );

    } catch (error) {
      console.error('Failed to get student location:', error);
      Alert.alert('Location Error', 'Failed to get your location. Please check your GPS settings.');
    }
  };
  
  // Check trip status
  const checkTripStatus = async () => {
    try {
      setLoading(true);
      console.log('Checking trip status...');
      
      const response = await studentAPI.getLiveLocation();

      if (response.ok && response.data) {
        console.log('Trip is ON_ROUTE');
        setTripStatus('ON_ROUTE');
        
        const newLocation = {
          latitude: parseFloat(response.data.latitude),
          longitude: parseFloat(response.data.longitude),
        };
        
        setBusLocation(newLocation);
        
        // Initialize bus animated coordinate
        if (!busAnimatedCoord.current) {
          busAnimatedCoord.current = new AnimatedRegion({
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
        }
        
        // Center map on bus
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }, 1000);
          }
        }, 500);
        
        await setupWebSocket();
      } else if (response.status === 404) {
        console.log('Trip not started');
        setTripStatus('NOT_STARTED');
        setStatusMessage('The bus has not started its journey yet.');
      } else {
        setTripStatus('NOT_STARTED');
        setStatusMessage('Unable to fetch bus location. Please try again.');
      }
    } catch (error) {
      console.error('Error checking trip status:', error);
      setTripStatus('NOT_STARTED');
      setStatusMessage('Unable to fetch bus location. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Setup WebSocket
  const setupWebSocket = async () => {
    try {
      console.log('Setting up WebSocket...');
      
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) {
        Alert.alert('Error', 'User information not found. Please login again.');
        return;
      }
      
      const user = JSON.parse(userStr);
      const routeNumber = user.routeNumber;
      const userId = user._id;
      
      console.log('Joining bus room for Route:', routeNumber);
      
      joinBusRoom(routeNumber, userId);
      setIsSocketConnected(true);

      // Listen for location updates
      listenToLocationUpdates((data) => {
        console.log('Location update received:', data);
        
        if (!data || !data.latitude || !data.longitude) {
          return;
        }
        
        const newLocation = {
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
        };

        setBusLocation(newLocation);

        // Smooth animation
        if (busAnimatedCoord.current) {
          busAnimatedCoord.current.timing({
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
            duration: 1000,
            useNativeDriver: false,
          }).start();
        }
      });

      // Listen for trip completion
      listenToBusReached(() => {
        Alert.alert(
          'Trip Completed',
          'The bus has reached its destination!',
          [{
            text: 'OK',
            onPress: () => {
              setTripStatus('REACHED');
              setStatusMessage('The trip for today has ended.');
              setIsSocketConnected(false);
              disconnectSocket();
            },
          }]
        );
      });

      console.log('WebSocket setup complete');
    } catch (error) {
      console.error('WebSocket setup error:', error);
      Alert.alert('Connection Error', 'Failed to connect to live tracking.');
    }
  };
  
  // Update ETA when locations change
  useEffect(() => {
    if (busLocation && studentLocation && tripStatus === 'ON_ROUTE') {
      fetchETA(busLocation, studentLocation);
      
      // Update ETA every 30 seconds
      const interval = setInterval(() => {
        fetchETA(busLocation, studentLocation);
      }, 30000);
      
      return () => clearInterval(interval);
    } else {
      setEtaText(null);
      setDistanceText(null);
    }
  }, [busLocation, studentLocation, tripStatus]);
  
  // Initialize
  useEffect(() => {
    const init = async () => {
      await Promise.all([
        getStudentLocation(),
        fetchRouteData(),
        checkTripStatus(),
      ]);
    };

    init();

    // Cleanup
    return () => {
      if (isSocketConnected) {
        disconnectSocket();
      }
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);
  
  const polylineCoords = routeData?.stops?.map(stop => ({
    latitude: stop.lat,
    longitude: stop.lng,
  })) || [];
  
  const initialRegion = routeData?.stops?.[0] ? {
    latitude: routeData.stops[0].lat,
    longitude: routeData.stops[0].lng,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  } : {
    latitude: 13.1007,
    longitude: 77.5963,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  };

  // Loading state
  if (loading || routeLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#E3F2FD" />
        <View style={[styles.headerContainer, { paddingTop: (insets.top || 16) + 10 }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <View style={styles.backIconWrapper}>
                <Ionicons name="chevron-back" size={22} color="#111827" />
              </View>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{routeData?.routeName || 'Loading...'}</Text>
            <View style={styles.rightPlaceholder} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2981f3ff" />
          <Text style={styles.loadingText}>
            {routeLoading ? 'Loading route...' : 'Checking bus status...'}
          </Text>
        </View>
      </View>
    );
  }

  // Trip not started
  if (tripStatus === 'NOT_STARTED' || tripStatus === 'REACHED') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#E3F2FD" />
        <View style={[styles.headerContainer, { paddingTop: (insets.top || 16) + 10 }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <View style={styles.backIconWrapper}>
                <Ionicons name="chevron-back" size={22} color="#111827" />
              </View>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{routeData?.routeName || 'Route'}</Text>
            <View style={styles.rightPlaceholder} />
          </View>
        </View>
        <View style={styles.messageContainer}>
          <Text style={styles.messageIcon}>🚌</Text>
          <Text style={styles.messageText}>{statusMessage}</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={checkTripStatus}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main map view
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E3F2FD" />
      
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        provider={MapView.PROVIDER_GOOGLE}
      >
        {/* Route polyline */}
        <Polyline
          coordinates={polylineCoords}
          strokeColor="#2981f3ff"
          strokeWidth={4}
        />
        
        {/* Stop markers */}
        {routeData?.stops?.map((stop, index) => {
          const isFirst = index === 0;
          const isLast = index === routeData.stops.length - 1;
          
          return (
            <Marker
              key={stop.id}
              coordinate={{ latitude: stop.lat, longitude: stop.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={[
                styles.customMarker,
                isFirst && styles.startMarker,
                isLast && styles.endMarker,
                !isFirst && !isLast && styles.middleMarker
              ]}>
                <View style={styles.innerCircle} />
              </View>
            </Marker>
          );
        })}

        {/* Bus marker */}
        {busLocation && busAnimatedCoord.current && (
          <Marker.Animated
            coordinate={busAnimatedCoord.current}
            anchor={{ x: 0.5, y: 0.5 }}
            title="Bus"
            description="Live Location"
          >
            <View style={styles.busMarker}>
              <Ionicons name="bus" size={24} color="#fff" />
            </View>
          </Marker.Animated>
        )}

        {/* Student marker */}
        {studentLocation && studentAnimatedCoord.current && (
          <Marker.Animated
            coordinate={studentAnimatedCoord.current}
            anchor={{ x: 0.5, y: 1 }}
            title="You"
          >
            <View style={styles.studentMarkerContainer}>
              <View style={styles.studentPulseOuter}>
                <View style={styles.studentPulseInner} />
              </View>
            </View>
          </Marker.Animated>
        )}
      </MapView>

      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: (insets.top || 16) + 10 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <View style={styles.backIconWrapper}>
              <Ionicons name="chevron-back" size={22} color="#111827" />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{routeData?.routeName || 'Route'}</Text>
          <View style={styles.rightPlaceholder} />
        </View>
      </View>

      {/* ETA Card */}
      {tripStatus === 'ON_ROUTE' && etaText && (
        <View style={styles.etaCard}>
          <View style={styles.etaHeader}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <View style={styles.etaContent}>
            <View style={styles.etaItem}>
              <Text style={styles.etaLabel}>Estimated Arrival</Text>
              <Text style={styles.etaValue}>{etaText}</Text>
            </View>
            {distanceText && (
              <View style={styles.etaDivider} />
            )}
            {distanceText && (
              <View style={styles.etaItem}>
                <Text style={styles.etaLabel}>Distance</Text>
                <Text style={styles.etaValue}>{distanceText}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#E3F2FD',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: 100,
    paddingBottom: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  rightPlaceholder: { width: 40 },
  customMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startMarker: { backgroundColor: '#4CAF50' },
  endMarker: { backgroundColor: '#F44336' },
  middleMarker: { backgroundColor: '#2981f3ff' },
  innerCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  busMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2981f3ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  studentMarkerContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentPulseOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(29, 78, 216, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentPulseInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563eb',
    borderWidth: 3,
    borderColor: '#fff',
  },
  etaCard: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  etaHeader: {
    marginBottom: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  liveText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  etaContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etaItem: {
    flex: 1,
  },
  etaDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 12,
  },
  etaLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
    fontWeight: '500',
  },
  etaValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2981f3ff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 40,
  },
  messageIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  messageText: {
    fontSize: 18,
    color: '#2C2C2C',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 26,
  },
  refreshButton: {
    backgroundColor: '#2981f3ff',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});