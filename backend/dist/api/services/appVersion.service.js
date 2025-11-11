"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const appVersion_model_1 = __importDefault(require("../../models/appVersion.model"));
class AppVersionService {
    /**
     * Get the current app version
     */
    async getAppVersion() {
        // Get the latest version (there should only be one document)
        let versionDoc = await appVersion_model_1.default.findOne().sort({ updatedAt: -1 });
        // If no version exists, create a default one
        if (!versionDoc) {
            versionDoc = await appVersion_model_1.default.create({
                version: '1.0.0',
                downloadUrl: '',
            });
        }
        return versionDoc;
    }
    /**
     * Update the app version
     */
    async updateAppVersion(version, downloadUrl) {
        if (!version || !downloadUrl) {
            throw new Error('Version and download URL are required.');
        }
        // Delete all existing versions and create a new one
        await appVersion_model_1.default.deleteMany({});
        const newVersion = await appVersion_model_1.default.create({
            version,
            downloadUrl,
            updatedAt: new Date(),
        });
        return newVersion;
    }
}
exports.default = new AppVersionService();
