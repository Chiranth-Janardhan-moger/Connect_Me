// services/whatsNewService.js - Manage What's New modal display logic
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentVersion, getLatestVersion } from './versionService';

const WHATS_NEW_STORAGE_KEY = 'whatsNewShown';
const LAST_SHOWN_VERSION_KEY = 'lastShownWhatsNewVersion';

/**
 * Check if What's New modal should be shown
 * Pure version-based logic:
 * - Read currentVersion from changelog
 * - Read lastShownVersion from AsyncStorage
 * - If different or missing → show
 */
export const shouldShowWhatsNew = async () => {
  try {
    const currentVersion = getCurrentVersion();
    const lastShownVersion = await AsyncStorage.getItem(LAST_SHOWN_VERSION_KEY);

    if (!lastShownVersion || lastShownVersion !== currentVersion) {
      console.log(`📱 Version changed (${lastShownVersion} → ${currentVersion}) - will show What's New`);
      return true;
    }

    console.log('✅ User has seen current version - won\'t show What\'s New');
    return false;
  } catch (error) {
    console.error('Error checking What\'s New status:', error);
    // On error, show it to be safe
    return true;
  }
};

/**
 * Mark What's New as shown for current version
 */
export const markWhatsNewAsShown = async () => {
  try {
    const currentVersion = getCurrentVersion();
    await AsyncStorage.setItem(WHATS_NEW_STORAGE_KEY, 'true');
    await AsyncStorage.setItem(LAST_SHOWN_VERSION_KEY, currentVersion);
    console.log(`✅ Marked What's New as shown for version ${currentVersion}`);
  } catch (error) {
    console.error('Error marking What\'s New as shown:', error);
  }
};

/**
 * Reset What's New status (for testing or admin purposes)
 */
export const resetWhatsNewStatus = async () => {
  try {
    await AsyncStorage.removeItem(WHATS_NEW_STORAGE_KEY);
    await AsyncStorage.removeItem(LAST_SHOWN_VERSION_KEY);
    console.log('🔄 Reset What\'s New status');
  } catch (error) {
    console.error('Error resetting What\'s New status:', error);
  }
};

/**
 * Get the version details to show in What's New modal
 */
export const getWhatsNewContent = () => {
  try {
    return getLatestVersion();
  } catch (error) {
    console.error('Error getting What\'s New content:', error);
    return null;
  }
};
