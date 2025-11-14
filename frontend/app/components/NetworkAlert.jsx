// components/NetworkAlert.jsx - Network status banner (no emojis)
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export const NetworkAlert = ({ isOnline, topOffset = 72 }) => {
  const slideAnim = useRef(new Animated.Value(-60)).current;
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      // Show offline banner
      setShowBanner(true);
      setWasOffline(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else if (wasOffline) {
      // Show "Back Online" briefly, then hide
      setShowBanner(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();

      // Hide after 3 seconds
      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -60,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setShowBanner(false);
          setWasOffline(false);
        });
      }, 2000);
    }
  }, [isOnline]);

  if (!showBanner) return null;

  const backgroundColor = isOnline ? '#22c55e' : '#ef4444';
  const statusText = isOnline ? 'Back Online' : 'No Internet Connection';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: topOffset,
          backgroundColor,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.indicator, { backgroundColor: isOnline ? '#dcfce7' : '#fee2e2' }]} />
        <Text style={styles.text}>{statusText}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9998,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
