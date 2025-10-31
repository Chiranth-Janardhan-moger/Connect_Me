// components/MapMarkers.jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

/**
 * Route stop markers (start, middle, end)
 */
export const RouteStopMarkers = ({ stops }) => {
  if (!stops || stops.length === 0) return null;

  return (
    <>
      {stops.map((stop, index) => {
        const isFirst = index === 0;
        const isLast = index === stops.length - 1;

        return (
          <Marker
            key={`stop-${stop.id}`}
            coordinate={{ latitude: stop.lat, longitude: stop.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            title={stop.name}
            description={stop.time}
          >
            <View
              style={[
                styles.customMarker,
                isFirst && styles.startMarker,
                isLast && styles.endMarker,
                !isFirst && !isLast && styles.middleMarker,
              ]}
            >
              <View style={styles.innerCircle} />
            </View>
          </Marker>
        );
      })}
    </>
  );
};

/**
 * Bus marker (animated)
 */
export const BusMarker = ({ coordinate }) => {
  if (!coordinate) return null;

  return (
    <Marker.Animated
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      title="Bus"
      description="Live Location"
    >
      <View style={styles.busMarker}>
        <Ionicons name="bus" size={24} color="#fff" />
      </View>
    </Marker.Animated>
  );
};

/**
 * Student location marker (animated with pulse effect)
 */
export const StudentMarker = ({ coordinate }) => {
  if (!coordinate) return null;

  return (
    <Marker.Animated
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      title="You"
      description="Your Location"
    >
      <View style={styles.studentMarkerContainer}>
        <View style={styles.studentPulseOuter}>
          <View style={styles.studentPulseInner} />
        </View>
      </View>
    </Marker.Animated>
  );
};

const styles = StyleSheet.create({
  // Stop markers
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
    backgroundColor: '#2981f3ff',
  },
  innerCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },

  // Bus marker
  busMarker: {
    width: 40,                // increased for better visibility
    height: 40,
    borderRadius: 40,         // exactly half of width/height = perfect circle
    backgroundColor: '#2981f3ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    overflow: 'visible',      // ensures nothing is clipped
  },


  // Student marker
  studentMarkerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentPulseOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(29, 78, 216, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentPulseInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2563eb',
    borderWidth: 3,
    borderColor: '#fff',
  },
});

export default { RouteStopMarkers, BusMarker, StudentMarker };