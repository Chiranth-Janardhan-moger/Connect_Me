// Map.jsx - MAIN COMPONENT
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Text,
} from 'react-native';
import OpenStreetMapView from './components/OpenStreetMapView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { studentAPI } from '../src/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BANGALORE_STOPS, DEFAULT_REGION } from '../src/constants/routes';
import { useLocation } from '../src/hooks/useLocation';
import { useBusTracking } from '../src/hooks/useBusTracking';
import { MapHeader } from './components/MapHeader';
import { StatusBanner } from './components/StatusBanner';
import { ETACard } from './components/ETACard';
import ErrorBoundary from './components/ErrorBoundary';
import { showErrorAlert, showWarningAlert } from './components/CustomAlert';
import { fetchETA } from '../src/services/etaService';
import { getPreloaded } from '../src/services/mapPreload';

function MapScreen() {
  const router = useRouter();
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [etaText, setEtaText] = useState(null);
  const [distanceText, setDistanceText] = useState(null);
  const [stopsAway, setStopsAway] = useState(null);
  const hasCenteredMap = useRef(false);
  const hasCenteredOnBus = useRef(false);
  const mapReadyRef = useRef(false);

  const {
    location: studentLocation,
    animatedCoord: studentAnimatedCoordRef,
    initLocation,
    startTracking,
    ensureAnimatedFromLocation,
    isTracking,
    error: locationError,
  } = useLocation();

  const {
    busLocation,
    busAnimatedCoord: busAnimatedCoordRef,
    tripStatus,
    checkTripStatus,
  } = useBusTracking();

  const fetchRouteData = async () => {
    try {
      // Prefer cached user data to avoid network
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const rn = typeof user?.routeNumber === 'number' ? user.routeNumber : parseInt(user?.routeNumber);
        if (!isNaN(rn)) {
          const localRouteData = BANGALORE_STOPS[rn];
          if (localRouteData) {
            setRouteData(localRouteData);
            return;
          }
        }
      }

      // Fallback to API if needed
      const response = await studentAPI.getRouteInfo();
      if (response.ok && response.data) {
        const routeNumber = response.data.routeNumber;
        const localRouteData = BANGALORE_STOPS[routeNumber];
        if (localRouteData) setRouteData(localRouteData);
      }

      if (!routeData) {
        const defaultRoute = BANGALORE_STOPS[1] || Object.values(BANGALORE_STOPS)[0];
        if (defaultRoute) setRouteData(defaultRoute);
      }
    } catch (error) {
      console.error('Fetch route error:', error);
      console.warn('Using default route due to error');
      // Use a default route instead of showing error
      const defaultRoute = BANGALORE_STOPS[1] || Object.values(BANGALORE_STOPS)[0];
      if (defaultRoute) {
        setRouteData(defaultRoute);
      } else {
      }
    }
  };

  const updateETA = async () => {
    console.log('📍 Update ETA - busLocation:', busLocation, 'studentLocation:', studentLocation);
    
    if (!busLocation || !studentLocation) {
      console.log('⚠️ Cannot calculate ETA - missing locations');
      setEtaText(null);
      setDistanceText(null);
      setStopsAway(null);
      return;
    }

    try {
      console.log('🧮 Calculating ETA...');
      const result = await fetchETA(
        busLocation, 
        studentLocation, 
        routeData?.stops || null
      );
      
      console.log('✅ ETA calculated:', result);
      setEtaText(result.etaText);
      setDistanceText(result.distanceText);
      
      if (result.stopsAway !== undefined) {
        setStopsAway(result.stopsAway);
      }
    } catch (error) {
      console.error('❌ Update ETA error:', error);
    }
  };

  const centerMapOnLocation = (location) => {
    try {
      if (mapRef.current && location && !hasCenteredMap.current && mapReadyRef.current) {
        hasCenteredMap.current = true;
        setTimeout(() => {
          try {
            mapRef.current?.animateToRegion(
              {
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              },
              1000
            );
          } catch (animError) {
            console.warn('Map animation failed:', animError);
          }
        }, 500);
      }
    } catch (err) {
      console.warn('Center map error:', err);
    }
  };

  // Center map when first busLocation arrives
  useEffect(() => {
    try {
      if (busLocation && mapRef.current && !hasCenteredOnBus.current) {
        hasCenteredOnBus.current = true;
        mapRef.current.animateToRegion(
          {
            latitude: busLocation.latitude,
            longitude: busLocation.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          800
        );
      }
    } catch (_) {}
  }, [busLocation]);

  useEffect(() => {
    const init = async () => {
      try {
        const pre = getPreloaded();
        if (pre?.routeData?.routeNumber) {
          const localRouteData = BANGALORE_STOPS[pre.routeData.routeNumber];
          if (localRouteData) setRouteData(localRouteData);
        }
        if (!routeData) {
          await fetchRouteData();
        }

        // ALWAYS start location tracking
        console.log('🔍 Initializing student location...');
        setGpsLoading(true);
        
        try {
          console.log('🚀 Starting location initialization...');
          const loc = await initLocation();
          if (loc) {
            console.log('✅ Got initial location:', loc.latitude, loc.longitude);
            try { ensureAnimatedFromLocation(loc); } catch (_) {}
            centerMapOnLocation(loc);
            setGpsLoading(false);
            
            // Start tracking after getting initial location
            setTimeout(() => {
              console.log('🎯 Starting location tracking...');
              startTracking();
            }, 1000);
          } else {
            console.warn('⚠️ initLocation() returned null - GPS failed');
            setGpsLoading(false);
            
            // Show clean error alert without fake location
            if (locationError) {
              showWarningAlert(
                '📍 Location Required',
                locationError + 
                '\n\nTo track the bus, we need your location.\n\nPlease:\n• Enable GPS in your phone settings\n• Grant location permission to this app\n• Go outdoors or near a window\n• Wait 30-60 seconds for GPS to lock'
              );
            }
          }
        } catch (locationError) {
          console.warn('❌ Location init failed:', locationError.message);
          setGpsLoading(false);
          
          showErrorAlert(
            '📍 Location Error',
            locationError.message + 
            '\n\nTo track the bus, we need your location.\n\nPlease:\n• Enable GPS in your phone settings\n• Grant location permission to this app\n• Go outdoors or near a window\n• Restart the app and wait 30-60 seconds'
          );
        }

        // Try to get bus location
        try {
          const busLoc = await checkTripStatus();
          if (busLoc) {
            centerMapOnLocation(busLoc);
          }
        } catch (busError) {
          console.warn('Bus location check failed:', busError);
        }
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    // Only calculate ETA when trip is active (ON_ROUTE) and we have valid locations
    if (tripStatus === 'ON_ROUTE' && busLocation && studentLocation && routeData) {
      updateETA();
      const interval = setInterval(updateETA, 30000);
      return () => clearInterval(interval);
    } else {
      // Clear ETA when trip isn't active
      setEtaText(null);
      setDistanceText(null);
      setStopsAway(null);
    }
  }, [tripStatus, busLocation, studentLocation, routeData]);

  // Poll fallback to keep bus location fresh if socket fails
  useEffect(() => {
    if (tripStatus === 'ON_ROUTE') {
      const id = setInterval(() => {
        try { checkTripStatus(); } catch (_) {}
      }, 10000);
      return () => clearInterval(id);
    }
  }, [tripStatus]);

  const polylineCoords = useMemo(() => {
    return (
      routeData?.stops?.map((stop) => ({
        latitude: stop.lat,
        longitude: stop.lng,
      })) || []
    );
  }, [routeData]);

  const initialRegion = useMemo(() => {
    if (studentLocation) {
      return {
        latitude: studentLocation.latitude,
        longitude: studentLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    if (routeData?.stops?.[0]) {
      return {
        latitude: routeData.stops[0].lat,
        longitude: routeData.stops[0].lng,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
      };
    }
    return DEFAULT_REGION;
  }, [studentLocation, routeData]);

  // Extract stable coordinate values to prevent unnecessary re-renders
  const studentLat = studentLocation?.latitude;
  const studentLng = studentLocation?.longitude;
  const busLat = busLocation?.latitude;
  const busLng = busLocation?.longitude;
  

  // Create stable markers array
  const mapMarkers = useMemo(() => {
    const markers = [];
    
    // 1. Route stops (NEVER change - add once)
    if (routeData?.stops) {
      routeData.stops.forEach((stop, index) => {
        markers.push({
          id: `stop-${stop.id}`,
          coordinate: { latitude: stop.lat, longitude: stop.lng },
          type: index === 0 ? 'start' : (index === routeData.stops.length - 1 ? 'end' : 'middle'),
          title: `${stop.name} - ${stop.time}`
        });
      });
    }
    
    // 2. Bus marker (only when trip is active)
    console.log('🚌 Bus check - tripStatus:', tripStatus, 'busLat:', busLat, 'busLng:', busLng);
    if (tripStatus === 'ON_ROUTE' && busLat != null && busLng != null) {
      console.log('✅ Adding bus marker:', busLat, busLng);
      markers.push({
        id: 'bus',
        coordinate: { latitude: busLat, longitude: busLng },
        type: 'bus',
        title: 'Bus - Live Location'
      });
    } else if (tripStatus === 'ON_ROUTE') {
      console.log('⚠️ Trip is ON_ROUTE but no bus coordinates');
    }
    
    // 3. Student marker (your location) - only show if location is available
    if (studentLat != null && studentLng != null) {
      console.log('✅ Adding student marker:', studentLat, studentLng);
      markers.push({
        id: 'student',
        coordinate: { latitude: studentLat, longitude: studentLng },
        type: 'student',
        title: 'Your Location'
      });
    }
    // No fallback marker - clean UI without fake location
    
    console.log('📊 Total markers in array:', markers.length);
    return markers;
  }, [routeData, tripStatus, busLat, busLng, studentLat, studentLng]);

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#E3F2FD" />
        <MapHeader
          routeName={routeData?.routeName || 'Loading...'}
          onBack={() => router.back()}
          topInset={insets.top || 16}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2981f3ff" />
          <Text style={styles.loadingText}>Initializing map...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E3F2FD" />

      <OpenStreetMapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        markers={mapMarkers}
        polyline={polylineCoords}
        onMapReady={() => {
          mapReadyRef.current = true;
        }}
        mapRef={mapRef}
      />

      <MapHeader
        routeName={routeData.routeName}
        onBack={() => router.back()}
        topInset={insets.top || 16}
      />

      <StatusBanner
        tripStatus={tripStatus}
        onRefresh={checkTripStatus}
        topOffset={(insets.top || 16) + 56}
      />

      <ETACard
        etaText={etaText}
        distanceText={distanceText}
        stopsAway={stopsAway}
        visible={tripStatus === 'ON_ROUTE'}
      />
      
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
  gpsLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9e9e9e',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default function Map() {
  const router = useRouter();

  return (
    <ErrorBoundary
      onReset={() => console.log('Error boundary reset')}
      onGoBack={() => router.back()}
    >
      <MapScreen />
    </ErrorBoundary>
  );
}