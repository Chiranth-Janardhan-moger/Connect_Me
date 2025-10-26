import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { driverAPI } from '../src/config/api';
import {
  connectDriverSocket,
  emitDriverLocation,
  disconnectSocket,
} from '../src/config/socket';

export default function DriverDashboard() {
  const router = useRouter();
  const [tripStatus, setTripStatus] = useState('REACHED'); // NOT_STARTED, ON_ROUTE, REACHED
  const [loading, setLoading] = useState(false);
  const [driverName, setDriverName] = useState('Driver');
  const [busNumber, setBusNumber] = useState('');
  
  const locationSubscription = useRef(null);
  const locationIntervalRef = useRef(null);
  const userDataRef = useRef(null);

  useEffect(() => {
    loadDriverInfo();

    // Cleanup on unmount
    return () => {
      stopLocationTracking();
      disconnectSocket();
    };
  }, []);

  const loadDriverInfo = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        userDataRef.current = user;
        setDriverName(user.name || 'Driver');
        setBusNumber(user.busId || 'N/A');
        console.log('👤 Driver info loaded:', user);
      }
    } catch (error) {
      console.error('Error loading driver info:', error);
    }
  };

  const handleStartTrip = async () => {
    Alert.alert(
      'Start Trip',
      'Are you sure you want to start the trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            await startTrip();
          },
        },
      ]
    );
  };

  const startTrip = async () => {
    setLoading(true);

    try {
      // Check location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to track the bus.'
        );
        setLoading(false);
        return;
      }

      console.log('🚀 Starting trip...');

      // Make API call to start trip
      const response = await driverAPI.startTrip();

      if (response.ok) {
        console.log('✅ Trip started successfully');
        
        // Update trip status
        setTripStatus('ON_ROUTE');
        
        // Connect to WebSocket
        connectDriverSocket();
        
        // Start location tracking
        await startLocationTracking();
        
        Alert.alert('Success', 'Trip started successfully!');
      } else {
        console.error('❌ Failed to start trip:', response.data);
        Alert.alert(
          'Error',
          response.data.message || 'Failed to start trip. Please try again.'
        );
      }
    } catch (error) {
      console.error('❌ Error starting trip:', error);
      Alert.alert('Error', 'Unable to start trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = async () => {
    try {
      console.log('📍 Starting location tracking...');

      const user = userDataRef.current;
      if (!user || !user.busId) {
        console.error('❌ User data not available');
        Alert.alert('Error', 'Driver information not found');
        return;
      }

      // Start watching location with high accuracy
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Or when moved 10 meters
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          console.log('📡 Location update:', latitude, longitude);

          // Emit location to server
          emitDriverLocation(user.busId, latitude, longitude);
        }
      );

      console.log('✅ Location tracking started');
    } catch (error) {
      console.error('❌ Error starting location tracking:', error);
      Alert.alert('Error', 'Failed to start location tracking');
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
      console.log('🛑 Location tracking stopped');
    }

    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  };

  const handleEndTrip = async () => {
    Alert.alert(
      'End Trip',
      'Are you sure you want to end the trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Trip',
          style: 'destructive',
          onPress: async () => {
            await endTrip();
          },
        },
      ]
    );
  };

  const endTrip = async () => {
    setLoading(true);

    try {
      console.log('🏁 Ending trip...');

      // Make API call to end trip
      const response = await driverAPI.endTrip();

      if (response.ok) {
        console.log('✅ Trip ended successfully');
        
        // Update trip status
        setTripStatus('REACHED');
        
        // Stop location tracking
        stopLocationTracking();
        
        // Disconnect socket
        disconnectSocket();
        
        Alert.alert('Success', 'Trip ended successfully!');
      } else {
        console.error('❌ Failed to end trip:', response.data);
        Alert.alert(
          'Error',
          response.data.message || 'Failed to end trip. Please try again.'
        );
      }
    } catch (error) {
      console.error('❌ Error ending trip:', error);
      Alert.alert('Error', 'Unable to end trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (tripStatus === 'ON_ROUTE') {
      Alert.alert(
        'Trip in Progress',
        'Please end the current trip before logging out.'
      );
      return;
    }

    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            stopLocationTracking();
            disconnectSocket();
            await AsyncStorage.multiRemove(['authToken', 'user', 'userRole']);
            router.replace('/Login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Driver Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome, {driverName}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Bus Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="bus" size={24} color="#3b82f6" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Bus Number</Text>
              <Text style={styles.infoValue}>{busNumber}</Text>
            </View>
          </View>
          
          <View style={styles.dividerLine} />
          
          <View style={styles.infoRow}>
            <Ionicons 
              name={tripStatus === 'ON_ROUTE' ? "radio-button-on" : "radio-button-off"} 
              size={24} 
              color={tripStatus === 'ON_ROUTE' ? '#22c55e' : '#9ca3af'} 
            />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Trip Status</Text>
              <Text style={[
                styles.infoValue,
                tripStatus === 'ON_ROUTE' && styles.activeStatus
              ]}>
                {tripStatus === 'ON_ROUTE' ? 'In Progress' : 'Not Started'}
              </Text>
            </View>
          </View>
        </View>

        {/* Status Indicator */}
        {tripStatus === 'ON_ROUTE' && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Broadcasting Location</Text>
          </View>
        )}

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          {tripStatus === 'ON_ROUTE' ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.endTripButton]}
              onPress={handleEndTrip}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="stop-circle" size={24} color="#fff" />
                  <Text style={styles.actionButtonText}>End Trip</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.startTripButton]}
              onPress={handleStartTrip}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="play-circle" size={24} color="#fff" />
                  <Text style={styles.actionButtonText}>Start Trip</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Instructions:</Text>
          {tripStatus === 'ON_ROUTE' ? (
            <>
              <Text style={styles.instructionItem}>
                • Your location is being tracked and shared with students
              </Text>
              <Text style={styles.instructionItem}>
                • Keep the app running in the foreground
              </Text>
              <Text style={styles.instructionItem}>
                • Ensure your GPS is turned on
              </Text>
              <Text style={styles.instructionItem}>
                 {`• Click "End Trip" when you reach the destination`}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.instructionItem}>
               {`• Click "Start Trip" to begin your journey`}
              </Text>
              <Text style={styles.instructionItem}>
                • Make sure location permissions are enabled
              </Text>
              <Text style={styles.instructionItem}>
                • Your location will be shared with students in real-time
              </Text>
              <Text style={styles.instructionItem}>
                • Keep your device charged during the trip
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  activeStatus: {
    color: '#22c55e',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  liveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  startTripButton: {
    backgroundColor: '#22c55e',
  },
  endTripButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  instructionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  instructionItem: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 8,
  },
});