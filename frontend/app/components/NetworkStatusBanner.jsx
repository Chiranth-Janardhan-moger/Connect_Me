import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const NetworkStatusBanner = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const slideAnim = useRef(new Animated.Value(-60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected && state.isInternetReachable;
      
      if (connected !== isConnected) {
        setIsConnected(connected);
        
        if (!connected) {
          // Show offline banner immediately
          setShowBanner(true);
          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        } else {
          // Show online banner briefly, then hide
          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            // Hide after 2 seconds with animation
            setTimeout(() => {
              Animated.parallel([
                Animated.timing(slideAnim, {
                  toValue: -60,
                  duration: 300,
                  useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                }),
              ]).start(() => {
                setShowBanner(false);
              });
            }, 2000);
          });
        }
      }
    });

    return () => unsubscribe();
  }, [isConnected, slideAnim, fadeAnim]);

  if (!showBanner) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: isConnected ? '#22c55e' : '#ef4444',
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name={isConnected ? 'wifi' : 'wifi-off'}
          size={16}
          color="#fff"
          style={styles.icon}
        />
        <Text style={styles.text}>
          {isConnected ? 'Connected' : 'No Internet Connection'}
        </Text>
        {isConnected && (
          <Ionicons
            name="checkmark-circle"
            size={16}
            color="#fff"
            style={styles.checkIcon}
          />
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 9999,
    justifyContent: 'flex-end',
    paddingBottom: 8,
    paddingTop: 30, // Account for status bar
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  checkIcon: {
    marginLeft: 8,
  },
});

export default NetworkStatusBanner;
