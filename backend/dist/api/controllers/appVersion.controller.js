"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAppVersion = exports.getAppVersion = void 0;
const appVersion_service_1 = __importDefault(require("../services/appVersion.service"));
/**
 * Get current app version
 */
const getAppVersion = async (req, res) => {
    try {
        const versionDoc = await appVersion_service_1.default.getAppVersion();
        res.status(200).json({
            version: versionDoc.version,
            downloadUrl: versionDoc.downloadUrl,
        });
    }
    catch (error) {
        console.error('Error getting app version:', error);
        res.status(500).json({ message: 'Failed to get app version.' });
    }
};
exports.getAppVersion = getAppVersion;
/**
 * Update app version (Admin only)
 */
const updateAppVersion = async (req, res) => {
    try {
        console.log('📝 Update version request received:', req.body);
        const { version, downloadUrl } = req.body;
        if (!version || !downloadUrl) {
            console.warn('⚠️ Missing version or downloadUrl');
            return res.status(400).json({ message: 'Version and download URL are required.' });
        }
        console.log('✅ Updating version to:', version);
        const updatedVersion = await appVersion_service_1.default.updateAppVersion(version, downloadUrl);
        console.log('✅ Version updated successfully:', updatedVersion);
        return res.status(200).json({
            message: 'App version updated successfully.',
            version: updatedVersion.version,
            downloadUrl: updatedVersion.downloadUrl,
        });
    }
    catch (error) {
        console.error('❌ Error updating app version:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update app version.';
        return res.status(500).json({ message: errorMessage });
    }
};
exports.updateAppVersion = updateAppVersion;
