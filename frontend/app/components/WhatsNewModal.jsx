// WhatsNewModal.jsx - Beautiful "What's New" modal
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const WhatsNewModal = ({ visible, versionDetails, onClose }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  if (!versionDetails) return null;

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              {/* Header with gradient */}
              <LinearGradient
                colors={['#0ea5e9', '#2563eb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
              >
                <View style={styles.celebrationIcon}>
                  <Text style={styles.celebrationEmoji}>🎉</Text>
                </View>
                <Text style={styles.headerTitle}>What's New</Text>
                <Text style={styles.versionText}>Version {versionDetails.version}</Text>
                <Text style={styles.dateText}>{versionDetails.date}</Text>
              </LinearGradient>

              {/* Content */}
              <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.updateTitle}>{versionDetails.title}</Text>

                {/* Features */}
                {versionDetails.features && versionDetails.features.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="sparkles" size={20} color="#0ea5e9" />
                      <Text style={styles.sectionTitle}>New Features</Text>
                    </View>
                    {versionDetails.features.map((feature, index) => (
                      <View key={index} style={styles.listItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.listText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Improvements */}
                {versionDetails.improvements && versionDetails.improvements.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="flash" size={20} color="#22c55e" />
                      <Text style={styles.sectionTitle}>Improvements</Text>
                    </View>
                    {versionDetails.improvements.map((improvement, index) => (
                      <View key={index} style={styles.listItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.listText}>{improvement}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Bug Fixes */}
                {versionDetails.fixes && versionDetails.fixes.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="bug" size={20} color="#f59e0b" />
                      <Text style={styles.sectionTitle}>Bug Fixes</Text>
                    </View>
                    {versionDetails.fixes.map((fix, index) => (
                      <View key={index} style={styles.listItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.listText}>{fix}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.bottomSpace} />
              </ScrollView>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#0ea5e9', '#2563eb']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.closeButtonGradient}
                >
                  <Text style={styles.closeButtonText}>Got It!</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouch: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: width - 48,
    maxWidth: 420,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  celebrationIcon: {
    marginBottom: 12,
  },
  celebrationEmoji: {
    fontSize: 48,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  content: {
    maxHeight: 400,
    paddingHorizontal: 24,
  },
  updateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 8,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingLeft: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6b7280',
    marginTop: 7,
    marginRight: 12,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  bottomSpace: {
    height: 16,
  },
  closeButton: {
    margin: 24,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  closeButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
});

export default WhatsNewModal;
