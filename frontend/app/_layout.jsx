// CRITICAL: Import crypto polyfill FIRST before any other imports
import 'react-native-get-random-values';

import { Stack } from "expo-router";
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { registerForPushNotificationsAsync } from '../src/config/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomAlert from './components/CustomAlert';
import { NetworkAlert } from './components/NetworkAlert';

export default function RootLayout() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Network status monitoring
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected && state.isInternetReachable !== false);
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
      <NetworkAlert isOnline={isOnline} />
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
        
        {/* Feature screens */}
        <Stack.Screen name="SOSButton" />
        <Stack.Screen name="Chat" />
        <Stack.Screen name="Changelog" />
        <Stack.Screen name="BugReport" />
        <Stack.Screen name="Feedback" />
        <Stack.Screen name="AdminBugReports" />
      </Stack>
      
      {/* Global Custom Alert */}
      <CustomAlert />
    </View>
  );
}

const styles = StyleSheet.create({
  // Styles moved to NetworkStatusBanner component
});