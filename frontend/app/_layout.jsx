import { Stack } from "expo-router";
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { registerForPushNotificationsAsync } from '../src/config/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootLayout() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!(state.isConnected && state.isInternetReachable !== false));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Register push notifications on app start when logged in
    (async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          await registerForPushNotificationsAsync();
        }
      } catch (_) {}
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Offline — waiting for connection…</Text>
        </View>
      )}
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      >
      {/* Splash screen */}
      <Stack.Screen name="index" />

      {/* Auth screens */}
      <Stack.Screen name="Login" />

      {/* Dashboard screens */}
      <Stack.Screen name="Student" />
      <Stack.Screen name="Driver" />
      <Stack.Screen name="Admin" />
      
      {/* Map screen */}
      <Stack.Screen name="Map" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: '#dc2626',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    color: '#fff',
    fontWeight: '700',
  },
});