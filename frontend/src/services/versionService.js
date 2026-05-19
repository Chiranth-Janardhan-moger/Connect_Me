// versionService.js - Simple version management
import changelogData from '../../assets/data/changelog.json';

/**
 * Get current app version from changelog
 */
export const getCurrentVersion = () => {
  return changelogData.currentVersion;
};

/**
 * Get all versions from changelog (for changelog page)
 */
export const getAllVersions = () => {
  return changelogData.versions;
};

/**
 * Get latest version details (for What's New modal)
 */
export const getLatestVersion = () => {
  return changelogData.versions[0]; // First version is the latest
};
