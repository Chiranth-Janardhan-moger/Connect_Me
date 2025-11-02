// components/LiveLocationIndicator.jsx - Beautiful live location pulse
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const LiveLocationIndicator = ({ isTracking, accuracy }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (isTracking) {
      // Pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.3,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.7,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    }
  }, [isTracking]);

  if (!isTracking) return null;

  // Determine accuracy color
  const getAccuracyColor = () => {
    if (accuracy <= 20) return '#22c55e'; // Excellent - Green
    if (accuracy <= 50) return '#3b82f6'; // Good - Blue
    if (accuracy <= 100) return '#f59e0b'; // Fair - Orange
    return '#ef4444'; // Poor - Red
  };

  const getAccuracyText = () => {
    if (accuracy <= 20) return 'Excellent';
    if (accuracy <= 50) return 'Good';
    if (accuracy <= 100) return 'Fair';
    return 'Poor';
  };

  const accuracyColor = getAccuracyColor();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Pulse ring */}
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: pulseAnim }],
              opacity: opacityAnim,
              backgroundColor: accuracyColor,
            },
          ]}
        />
        
        {/* Center dot */}
        <View style={[styles.centerDot, { backgroundColor: accuracyColor }]}>
          <Ionicons name="locate" size={16} color="#fff" />
        </View>

        {/* Text */}
        <View style={styles.textContainer}>
          <Text style={styles.statusText}>Live Location</Text>
          <View style={styles.accuracyRow}>
            <View style={[styles.accuracyDot, { backgroundColor: accuracyColor }]} />
            <Text style={styles.accuracyText}>
              {getAccuracyText()} · {Math.round(accuracy)}m
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    zIndex: 10,
    pointerEvents: 'none',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  pulseRing: {
    position: 'absolute',
    left: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  centerDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  accuracyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accuracyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  accuracyText: {
    fontSize: 12,
    color: '#6b7280',
  },
});
