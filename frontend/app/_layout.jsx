import { Stack } from "expo-router";
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export default function RootLayout() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!(state.isConnected && state.isInternetReachable !== false));
    });
    return () => unsubscribe();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
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