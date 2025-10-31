// Map.jsx - MAIN COMPONENT
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Text,
} from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { studentAPI } from '../src/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InteractionManager } from 'react-native';
import { BANGALORE_STOPS, DEFAULT_REGION } from '../src/constants/routes';
import { useLocation } from '../src/hooks/useLocation';
import { useBusTracking } from '../src/hooks/useBusTracking';
import { MapHeader } from './components/MapHeader';
import { StatusBanner } from './components/StatusBanner';
import { ETACard } from './components/ETACard';
import { RouteStopMarkers, BusMarker, StudentMarker } from './components/MapMarkers';
import ErrorBoundary from './components/ErrorBoundary';
import { fetchETA } from '../src/services/etaService';
import ErrorModal from '../src/components/ErrorModal';
import { getPreloaded, preloadMapData } from '../src/services/mapPreload';

function MapScreen() {
  const router = useRouter();
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [etaText, setEtaText] = useState(null);
  const [distanceText, setDistanceText] = useState(null);
  const [stopsAway, setStopsAway] = useState(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const hasCenteredMap = useRef(false);
  const hasCenteredOnBus = useRef(false);
  const mapReadyRef = useRef(false);

  const {
    location: studentLocation,
    animatedCoord: studentAnimatedCoordRef,
    initLocation,
    startTracking,
    ensureAnimatedFromLocation,
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
        setErrorTitle('Information');
        setErrorMessage('Unable to load route data. Please check your connection.');
        setErrorModalVisible(true);
      }
    }
  };

  const updateETA = async () => {
    if (!busLocation || !studentLocation) {
      setEtaText(null);
      setDistanceText(null);
      setStopsAway(null);
      return;
    }

    try {
      const result = await fetchETA(
        busLocation, 
        studentLocation, 
        routeData?.stops || null
      );
      
      setEtaText(result.etaText);
      setDistanceText(result.distanceText);
      
      if (result.stopsAway !== undefined) {
        setStopsAway(result.stopsAway);
      }
    } catch (error) {
      console.error('Update ETA error:', error);
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
        setLoading(true);

        // Fetch route data first
        const pre = getPreloaded();
        if (!pre.startedAt) {
          // kick off preloading but don't block
          preloadMapData().catch(() => {});
        }

        if (pre?.routeData?.routeNumber) {
          const localRouteData = BANGALORE_STOPS[pre.routeData.routeNumber];
          if (localRouteData) setRouteData(localRouteData);
        }
        if (!routeData) {
          await fetchRouteData();
        }

        // Try to get location, but don't fail if it doesn't work
        try {
          const pre = getPreloaded();
          const loc = pre?.location || (await initLocation());
          if (loc) {
            try { ensureAnimatedFromLocation(loc); } catch (_) {}
            centerMapOnLocation(loc);
            setTimeout(() => startTracking(), 1000);
          }
        } catch (locationError) {
          console.warn('Location initialization failed:', locationError);
          // Continue without location
        }

        // Try to get bus location, but don't fail if it doesn't work
        try {
          const pre = getPreloaded();
          const busLoc = pre?.busLocation || (await checkTripStatus());
          if (busLoc) {
            centerMapOnLocation(busLoc);
          }
        } catch (busError) {
          console.warn('Bus location check failed:', busError);
          // Continue without bus location
        }
      } catch (error) {
        console.error('Init error:', error);
        // Don't show error modal, just log and continue
        console.warn('Map initialization had issues, but continuing');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (busLocation && studentLocation && routeData) {
      updateETA();
      const interval = setInterval(updateETA, 30000);
      return () => clearInterval(interval);
    } else {
      setEtaText(null);
      setDistanceText(null);
      setStopsAway(null);
    }
  }, [busLocation, studentLocation, routeData]);

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

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        onMapReady={() => {
          mapReadyRef.current = true;
          console.log('✅ Map loaded successfully');
        }}
        onError={(error) => {
          console.error('❌ Map error:', error);
          setMapError(true);
        }}
        loadingEnabled={true}
        loadingIndicatorColor="#2981f3ff"
        loadingBackgroundColor="#ffffff"
      >
        {polylineCoords.length > 0 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor="#2981f3ff"
            strokeWidth={4}
          />
        )}

        <RouteStopMarkers stops={routeData.stops} />

        {/* Only show bus marker when trip is ON_ROUTE and location is available */}
        {tripStatus === 'ON_ROUTE' && busLocation && (
          busAnimatedCoordRef?.current ? (
            <BusMarker coordinate={busAnimatedCoordRef.current} />
          ) : (
            <Marker
              coordinate={busLocation}
              anchor={{ x: 0.5, y: 0.5 }}
              title="Bus"
              description="Live Location"
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 40,
                backgroundColor: '#2981f3ff',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 3,
                borderColor: '#fff',
                elevation: 6,
              }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>BUS</Text>
              </View>
            </Marker>
          )
        )}

        {studentAnimatedCoordRef?.current && (
          <StudentMarker coordinate={studentAnimatedCoordRef.current} />
        )}
      </MapView>

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
      
      <ErrorModal
        visible={errorModalVisible}
        title={errorTitle}
        message={errorMessage}
        onClose={() => setErrorModalVisible(false)}
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