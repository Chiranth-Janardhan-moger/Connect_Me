// components/ETACard.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const ETACard = ({ etaText, distanceText, stopsAway, visible = true }) => {
  if (!visible || !etaText) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        {stopsAway !== null && stopsAway !== undefined && (
          <Text style={styles.stopsText}>
            {stopsAway === 0 ? 'At your stop' : `${stopsAway} stops away`}
          </Text>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.item}>
          <Text style={styles.label}>Estimated Arrival</Text>
          <Text style={styles.value}>{etaText}</Text>
        </View>
        {distanceText && (
          <>
            <View style={styles.divider} />
            <View style={styles.item}>
              <Text style={styles.label}>Distance</Text>
              <Text style={styles.value}>{distanceText}</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  liveText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  stopsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2981f3ff',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flex: 1,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 12,
  },
  label: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
    fontWeight: '500',
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2981f3ff',
  },
});
export default ETACard;