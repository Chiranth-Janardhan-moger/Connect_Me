// components/MapHeader.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const MapHeader = ({ routeName, onBack, topInset = 0 }) => {
  return (
    <View style={[styles.container, { paddingTop: topInset + 10 }]}>
      <View style={styles.content}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <View style={styles.backIcon}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </View>
        </TouchableOpacity>
        <Text style={styles.title}>{routeName || 'Route'}</Text>
        <View style={styles.placeholder} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#E3F2FD',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: 100,
    paddingBottom: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  placeholder: {
    width: 40,
  },
});
export default MapHeader;   