// components/StatusBanner.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const StatusBannerComponent = ({ tripStatus, onRefresh, topOffset = 100 }) => {
  // Only hide when bus is actively ON_ROUTE or REACHED
  // Show for: NOT_STARTED, null, undefined, or any other status
  if (tripStatus === 'ON_ROUTE' || tripStatus === 'REACHED') {
    return null;
  }

  const message = 'Bus has not started yet';

  return (
    <View style={[styles.statusBanner, { top: topOffset }]} pointerEvents="box-none">
      <View style={styles.statusBannerContent} pointerEvents="auto">
        <View style={styles.iconContainer}>
          <Ionicons name="bus-outline" size={18} color="#f59e0b" />
        </View>
        <Text style={styles.statusBannerText}>{message}</Text>
        {onRefresh && (
          <TouchableOpacity onPress={onRefresh} style={styles.statusRefreshButton}>
            <Ionicons name="refresh" size={18} color="#3b82f6" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export const StatusBanner = React.memo(StatusBannerComponent);

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
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusRefreshButton: {
    padding: 4,
  },
});
export default StatusBanner;