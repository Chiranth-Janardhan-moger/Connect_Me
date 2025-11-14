// SOS Screen (Full Page UI)
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { sosService } from '../src/services/sosService';
import { showSuccessAlert, showErrorAlert } from './components/CustomAlert';

const SOSScreen = () => {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [routeNumber, setRouteNumber] = useState(null);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setRouteNumber(user.routeNumber);
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } else {
        showErrorAlert('Location Required', 'Location permission is required for SOS.');
      }
    } catch (error) {
      console.error('SOS initialization error:', error);
    }
  };

  const emergencyTypes = [
    { id: 'emergency', label: 'Medical Emergency', icon: 'medical', color: '#ef4444' },
    { id: 'harassment', label: 'Harassment', icon: 'alert-circle', color: '#f59e0b' },
    { id: 'accident', label: 'Accident', icon: 'car-sport', color: '#dc2626' },
    { id: 'breakdown', label: 'Bus Breakdown', icon: 'construct', color: '#6366f1' },
  ];

  const handleEmergencyType = async (type) => {
    setSending(true);
    setSelectedType(type.id);

    try {
      const result = await sosService.sendSOS({
        type: type.id,
        location: userLocation,
        routeNumber: routeNumber,
        timestamp: new Date().toISOString(),
      });

      if (result.success) {
        showSuccessAlert(
          'SOS Sent Successfully',
          `${type.label} alert sent to admin. Help is on the way! Stay calm and wait for assistance.`
        );
      } else {
        showErrorAlert(
          'SOS Failed',
          'Failed to send SOS alert. Please try again or call emergency services immediately at 112.'
        );
      }
    } catch (error) {
      console.error('SOS error:', error);
      showErrorAlert(
        'Emergency Error',
        'Failed to send SOS alert due to network error. Please call emergency services immediately at 112.'
      );
    } finally {
      setSending(false);
      setSelectedType(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerBox}>
        <Ionicons name="warning" size={40} color="#ef4444" />
        <Text style={styles.title}>Emergency SOS</Text>
        <Text style={styles.subtitle}>
          Select the type of emergency. Your location will be shared with the admin immediately.
        </Text>
      </View>

      {emergencyTypes.map((type) => (
        <TouchableOpacity
          key={type.id}
          style={[
            styles.emergencyButton,
            selectedType === type.id && { backgroundColor: `${type.color}20`, borderColor: type.color },
          ]}
          onPress={() => handleEmergencyType(type)}
          disabled={sending}
          activeOpacity={0.8}
        >
          <View style={styles.emergencyLeft}>
            <Ionicons name={type.icon} size={26} color={type.color} />
            <Text style={styles.emergencyLabel}>{type.label}</Text>
          </View>
          {sending && selectedType === type.id ? (
            <ActivityIndicator size="small" color={type.color} />
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          )}
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => router.back()}
        disabled={sending}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'space-between',
  },
  emergencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default React.memo(SOSScreen);
