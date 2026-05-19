// Changelog.jsx - Full changelog screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAllVersions, getCurrentVersion } from '../src/services/versionService';
import { apiCall } from '../src/config/api';

const Changelog = () => {
  const router = useRouter();
  const versions = getAllVersions();
  const currentVersion = getCurrentVersion();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateVersion, setUpdateVersion] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [updateDismissed, setUpdateDismissed] = useState(false);

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      const response = await apiCall('/api/app/version', 'GET');
      
      if (response.ok) {
        const { version, downloadUrl } = response.data;
        
        // Simple version comparison
        if (version && version !== currentVersion && compareVersions(version, currentVersion) > 0) {
          setUpdateAvailable(true);
          setUpdateVersion(version);
          setDownloadUrl(downloadUrl);
        }
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  const compareVersions = (v1, v2) => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }
    return 0;
  };

  const handleDownloadUpdate = () => {
    if (downloadUrl) {
      Linking.openURL(downloadUrl).catch((err) =>
        console.error('Failed to open download URL:', err)
      );
    }
  };

  const handleDismissUpdate = () => {
    setUpdateDismissed(true);
  };

  const VersionCard = ({ version, isLatest }) => {
    const hasFeatures = version.features && version.features.length > 0;
    const hasImprovements = version.improvements && version.improvements.length > 0;
    const hasFixes = version.fixes && version.fixes.length > 0;

    return (
      <View style={styles.versionCard}>
        {/* Version Header */}
        <View style={styles.versionHeader}>
          <View style={styles.versionTitleRow}>
            <Ionicons name="phone-portrait" size={24} color="#0ea5e9" />
            <Text style={styles.versionNumber}>Version {version.version}</Text>
            {isLatest && (
              <View style={styles.latestBadge}>
                <Text style={styles.latestBadgeText}>LATEST</Text>
              </View>
            )}
          </View>
          <Text style={styles.versionDate}>{version.date}</Text>
          <Text style={styles.versionTitle}>{version.title}</Text>
        </View>

        {/* Features */}
        {hasFeatures && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles" size={18} color="#0ea5e9" />
              <Text style={styles.sectionTitle}>New Features</Text>
            </View>
            {version.features.map((feature, index) => (
              <View key={index} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: '#0ea5e9' }]} />
                <Text style={styles.listText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Improvements */}
        {hasImprovements && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash" size={18} color="#22c55e" />
              <Text style={styles.sectionTitle}>Improvements</Text>
            </View>
            {version.improvements.map((improvement, index) => (
              <View key={index} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: '#22c55e' }]} />
                <Text style={styles.listText}>{improvement}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Bug Fixes */}
        {hasFixes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bug" size={18} color="#f59e0b" />
              <Text style={styles.sectionTitle}>Bug Fixes</Text>
            </View>
            {version.fixes.map((fix, index) => (
              <View key={index} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.listText}>{fix}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0ea5e9" />

      {/* Header */}
      <LinearGradient
        colors={['#0ea5e9', '#2563eb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>App Changelog</Text>
          <Text style={styles.headerSubtitle}>
            Version History & Updates
          </Text>
        </View>
      </LinearGradient>

      {/* Changelog List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Update Card */}
        {updateAvailable && !updateDismissed && (
          <View style={styles.updateCard}>
            <TouchableOpacity
              style={styles.closeButtonChangelog}
              onPress={handleDismissUpdate}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
            
            <View style={styles.updateCardHeader}>
              <View style={styles.updateIconContainer}>
                <Ionicons name="download-outline" size={28} color="#f59e0b" />
              </View>
              <View style={styles.updateCardTextContainer}>
                <Text style={styles.updateCardTitle}>New Version Available!</Text>
                <Text style={styles.updateCardVersion}>Version {updateVersion}</Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.updateDownloadButton}
              onPress={handleDownloadUpdate}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#f59e0b', '#ef4444']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.updateDownloadButtonGradient}
              >
                <Ionicons name="download" size={18} color="#fff" />
                <Text style={styles.updateDownloadButtonText}>Download Update</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Current Version Info */}
        <View style={styles.currentVersionBanner}>
          <LinearGradient
            colors={['#e0f2fe', '#bae6fd']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.currentVersionGradient}
          >
            <Ionicons name="information-circle" size={24} color="#0ea5e9" />
            <View style={styles.currentVersionText}>
              <Text style={styles.currentVersionLabel}>Current Version</Text>
              <Text style={styles.currentVersionNumber}>{currentVersion}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Version Cards */}
        {versions.map((version, index) => (
          <VersionCard
            key={version.version}
            version={version}
            isLatest={index === 0}
          />
        ))}

        {/* Bug Report Button */}
        <TouchableOpacity
          style={styles.bugReportButton}
          onPress={() => router.push('/BugReport')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#ef4444', '#dc2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bugReportGradient}
          >
            <Ionicons name="bug" size={20} color="#fff" />
            <Text style={styles.bugReportText}>Report a Bug or Issue</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="heart" size={16} color="#ef4444" />
          <Text style={styles.footerText}>
            Made with love for BMS Students
          </Text>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  currentVersionBanner: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentVersionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  currentVersionText: {
    marginLeft: 12,
  },
  currentVersionLabel: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '600',
    marginBottom: 2,
  },
  currentVersionNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c4a6e',
  },
  versionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  versionHeader: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  versionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  versionNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 8,
  },
  latestBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  latestBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  versionDate: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
    marginLeft: 32,
  },
  versionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 32,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 8,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 4,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 6,
    marginRight: 10,
  },
  listText: {
    flex: 1,
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 19,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 6,
  },
  bottomSpace: {
    height: 24,
  },
  updateCard: {
    backgroundColor: '#fff',
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    position: 'relative',
  },
  closeButtonChangelog: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  updateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  updateIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  updateCardTextContainer: {
    flex: 1,
    paddingRight: 32,
  },
  updateCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  updateCardVersion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  updateDownloadButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#f59e0b',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  updateDownloadButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateDownloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  bottomSpace: {
    height: 40,
  },
  bugReportButton: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bugReportGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  bugReportText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

export default Changelog;
