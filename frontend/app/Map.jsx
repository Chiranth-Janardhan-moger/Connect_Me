import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { useRouter, useLocalSearchParams } from 'expo-router';

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
      { id: 1, name: "BMSIT College", lat: 13.133845, lng:77.568760, time: "06:30 AM" },
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
  
  const [viewMode, setViewMode] = useState('map');
  
  const routeData = ROUTE_DATA[routeId] || ROUTE_DATA[2];
  
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E3F2FD" />
      
      {/* Map - Full Screen */}
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
      >
        {/* Route Polyline */}
        <Polyline
          coordinates={polylineCoords}
          strokeColor="#2981f3ff"
          strokeWidth={4}
        />
        
        {/* Custom Bus Stop Markers using SVG-like circles */}
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
      </MapView>

      {/* Header - Overlay on Map */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{routeData.routeName}</Text>
        <View style={styles.placeholder} />
      </View>

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
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#E3F2FD',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: '#2C2C2C',
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  placeholder: {
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
  listOverlay: {
    position: 'absolute',
    top: 90,
    left: 0,
    right: 0,
    bottom: 100,
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
});