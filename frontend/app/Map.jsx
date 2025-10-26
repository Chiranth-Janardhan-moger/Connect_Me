import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  StatusBar, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  ActivityIndicator,
  Alert 
} from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { studentAPI } from '../src/config/api';
import {
  joinBusRoom,
  listenToLocationUpdates,
  listenToBusReached,
  disconnectSocket,
} from '../src/config/socket';

// Mock data - Replace this with your database/API call
const ROUTE_DATA = {
  1: {
    routeId: 1,
    routeName: "Route-1",
    stops: [
      { id: 1, name: "Yelahanka New Town", lat: 13.1007, lng: 77.5963, time: "06:00 AM" },
      { id: 2, name: "Yelahanka Old Town", lat: 13.0950, lng: 77.5940, time: "06:10 AM" },
      { id: 3, name: "Jakkur Cross", lat: 13.0850, lng: 77.5980, time: "06:20 AM" },
      { id: 4, name: "Hebbal Flyover", lat: 13.0358, lng: 77.5970, time: "06:35 AM" },
      { id: 5, name: "Mekhri Circle", lat: 13.0157, lng: 77.5850, time: "06:50 AM" },
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
    ]
  },
  3: {
    routeId: 3,
    routeName: "Route-3",
    stops: [
      { id: 1, name: "Yelahanka", lat: 13.1007, lng: 77.5963, time: "07:00 AM" },
      { id: 2, name: "Attur", lat: 13.0720, lng: 77.5820, time: "07:15 AM" },
      { id: 3, name: "Sadashivanagar", lat: 13.0100, lng: 77.5750, time: "07:30 AM" },
      { id: 4, name: "Majestic", lat: 12.9767, lng: 77.5713, time: "07:50 AM" },
    ]
  },
};

export default function Map() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const routeId = params.routeId || '2';
  const mapRef = useRef(null);
  
  const [viewMode, setViewMode] = useState('map');
  const [loading, setLoading] = useState(true);
  const [tripStatus, setTripStatus] = useState('NOT_STARTED'); // NOT_STARTED, ON_ROUTE, REACHED
  const [busLocation, setBusLocation] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  
  const routeData = ROUTE_DATA[routeId] || ROUTE_DATA[2];
  
  // Polyline coordinates from stops
  const polylineCoords = routeData.stops.map(stop => ({
    latitude: stop.lat,
    longitude: stop.lng,
  }));
  
  const initialRegion = {
    latitude: routeData.stops[0].lat,
    longitude: routeData.stops[0].lng,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  };

  useEffect(() => {
    checkTripStatus();

    // Cleanup: disconnect socket when component unmounts
    return () => {
      console.log('🔌 Cleaning up socket connection');
      disconnectSocket();
    };
  });

  const checkTripStatus = async () => {
    try {
      setLoading(true);
      console.log('📡 Checking trip status...');
      
      const response = await studentAPI.getLiveLocation();

      if (response.ok && response.data) {
        // Trip is ON_ROUTE
        console.log('✅ Trip is ON_ROUTE');
        console.log('📍 Initial location:', response.data);
        
        setTripStatus('ON_ROUTE');
        setBusLocation({
          latitude: response.data.latitude,
          longitude: response.data.longitude,
        });
        
        // Center map on bus location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: response.data.latitude,
            longitude: response.data.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        }
        
        // Connect to WebSocket for real-time updates
        await setupWebSocket();
      } else if (response.status === 404) {
        // Trip NOT_STARTED or REACHED
        console.log('❌ Trip not started or already reached');
        setTripStatus('NOT_STARTED');
        setStatusMessage('The bus has not started its journey yet.');
      } else {
        setStatusMessage('Unable to fetch bus location. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error checking trip status:', error);
      setStatusMessage('Unable to fetch bus location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);

      if (!user || !user.busId || !user._id) {
        console.error('❌ User information not found');
        Alert.alert('Error', 'User information not found');
        return;
      }

      console.log('🔌 Connecting to WebSocket...');
      console.log('🚌 Bus ID:', user.busId);
      console.log('👤 Student ID:', user._id);

      // Join the bus room
      joinBusRoom(user.busId, user._id);

      // Listen for location updates
      listenToLocationUpdates((data) => {
        console.log('📍 Location update received:', data);
        
        const newLocation = {
          latitude: data.latitude,
          longitude: data.longitude,
        };
        
        setBusLocation(newLocation);
        
        // Animate map to new location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            ...newLocation,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        }
      });

      // Listen for trip completion
      listenToBusReached(() => {
        console.log('🏁 Bus reached destination');
        
        Alert.alert(
          'Trip Completed',
          'The bus has reached its destination!',
          [
            {
              text: 'OK',
              onPress: () => {
                setTripStatus('REACHED');
                setStatusMessage('The trip for today has ended.');
                disconnectSocket();
              },
            },
          ]
        );
      });

      console.log('✅ WebSocket setup complete');
    } catch (error) {
      console.error('❌ WebSocket setup error:', error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#E3F2FD" />
        
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Image
                source={require('../assets/images/BackButton.png')}
                style={styles.backImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{routeData.routeName}</Text>
            <View style={styles.rightPlaceholder} />
          </View>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2981f3ff" />
          <Text style={styles.loadingText}>Checking bus status...</Text>
        </View>
      </View>
    );
  }

  // Show "Trip Not Started" message
  if (tripStatus === 'NOT_STARTED' || tripStatus === 'REACHED') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#E3F2FD" />
        
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Image
                source={require('../assets/images/BackButton.png')}
                style={styles.backImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{routeData.routeName}</Text>
            <View style={styles.rightPlaceholder} />
          </View>
        </View>

        <View style={styles.messageContainer}>
          <Text style={styles.messageIcon}>🚌</Text>
          <Text style={styles.messageText}>{statusMessage}</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={checkTripStatus}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E3F2FD" />
      
      {/* Map - Full Screen */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
      >
        {/* Route Polyline */}
        <Polyline
          coordinates={polylineCoords}
          strokeColor="#2981f3ff"
          strokeWidth={4}
        />
        
        {/* Custom Bus Stop Markers */}
        {routeData.stops.map((stop, index) => {
          const isFirst = index === 0;
          const isLast = index === routeData.stops.length - 1;
          
          return (
            <Marker
              key={stop.id}
              coordinate={{
                latitude: stop.lat,
                longitude: stop.lng,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              centerOffset={{ x: 0, y: 0 }}
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

        {/* Live Bus Marker */}
        {busLocation && (
          <Marker
            coordinate={busLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            title="Live Bus Location"
          >
            <View style={styles.busMarker}>
              <Text style={styles.busIcon}>🚌</Text>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Header - Overlay on Map */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Image
              source={require('../assets/images/BackButton.png')}
              style={styles.backImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{routeData.routeName}</Text>
          <View style={styles.rightPlaceholder} />
        </View>
      </View>

      {/* Live Status Indicator */}
      {tripStatus === 'ON_ROUTE' && (
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live Tracking</Text>
        </View>
      )}

      {/* List View Overlay */}
      {viewMode === 'list' && (
        <View style={styles.listOverlay}>
          <ScrollView style={styles.listContainer}>
            {routeData.stops.map((stop, index) => (
              <View key={stop.id} style={styles.stopItem}>
                <View style={styles.stopIndicator}>
                  <View style={[
                    styles.stopDot,
                    index === 0 && styles.startDot,
                    index === routeData.stops.length - 1 && styles.endDot
                  ]} />
                  {index < routeData.stops.length - 1 && (
                    <View style={styles.stopLine} />
                  )}
                </View>
                <View style={styles.stopDetails}>
                  <Text style={styles.stopName}>{stop.name}</Text>
                  <Text style={styles.stopTime}>{stop.time}</Text>
                  {index === 0 && <Text style={styles.stopLabel}>Source</Text>}
                  {index === routeData.stops.length - 1 && <Text style={styles.stopLabel}>Destination</Text>}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Toggle Buttons - Overlay on Map */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'list' && styles.activeToggle]}
          onPress={() => setViewMode('list')}
        >
          <Text style={[styles.toggleText, viewMode === 'list' && styles.activeToggleText]}>
            list
          </Text>
        </TouchableOpacity>
        
        <View style={styles.divider} />
        
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'map' && styles.activeToggle]}
          onPress={() => setViewMode('map')}
        >
          <Text style={[styles.toggleText, viewMode === 'map' && styles.activeToggleText]}>
            Map
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#E3F2FD',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: 100,
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backImage: {
    width: 24,
    height: 24,
    tintColor: '#2C2C2C',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  rightPlaceholder: {
    width: 40,
  },
  customMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startMarker: {
    backgroundColor: '#4CAF50',
  },
  endMarker: {
    backgroundColor: '#F44336',
  },
  middleMarker: {
    backgroundColor: '#E53935',
  },
  innerCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  // Bus Marker Styles
  busMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: '#2981f3ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  busIcon: {
    fontSize: 24,
  },
  // Live Indicator
  liveIndicator: {
    position: 'absolute',
    top: StatusBar.currentHeight + 70 || 110,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  listOverlay: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  stopItem: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  stopIndicator: {
    alignItems: 'center',
    marginRight: 14,
  },
  stopDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E53935',
    zIndex: 1,
  },
  startDot: {
    backgroundColor: '#4CAF50',
  },
  endDot: {
    backgroundColor: '#F44336',
  },
  stopLine: {
    width: 3,
    flex: 1,
    backgroundColor: '#FFB300',
    marginTop: -2,
    minHeight: 40,
  },
  stopDetails: {
    flex: 1,
    paddingBottom: 20,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  stopTime: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  stopLabel: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 2,
  },
  toggleContainer: {
    position: 'absolute',
    bottom: 30,
    left: 80,
    right: 80,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 25,
  },
  activeToggle: {
    backgroundColor: '#E3F2FD',
  },
  toggleText: {
    fontSize: 16,
    color: '#757575',
    fontWeight: '500',
  },
  activeToggleText: {
    color: '#2C2C2C',
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: '#E0E0E0',
  },
  // Loading State
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
  // Message State
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