// components/StatusBanner.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const StatusBanner = ({ tripStatus, onRefresh, topOffset = 100 }) => {
  // Only show banner if trip is not ON_ROUTE
  if (!tripStatus || tripStatus === 'ON_ROUTE') return null;

  const icon = 'bus';
  const iconColor = '#FF9800';
  const message = 'Bus has not started yet';

  return (
    <View style={[styles.statusBanner, { top: topOffset }]} pointerEvents="box-none">
      <View style={styles.statusBannerContent} pointerEvents="auto">
        <Ionicons name={icon} size={20} color={iconColor} />
        <Text style={styles.statusBannerText}>{message}</Text>
        {onRefresh && (
          <TouchableOpacity onPress={onRefresh} style={styles.statusRefreshButton}>
            <Ionicons name="refresh" size={18} color="#2981f3ff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statusBanner: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    zIndex: 9999,
  },
  statusBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginLeft: 10,
  },
  statusRefreshButton: {
    padding: 4,
  },
});
export default StatusBanner;