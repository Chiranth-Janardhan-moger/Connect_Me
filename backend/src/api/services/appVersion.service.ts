import AppVersion from '../../models/appVersion.model';

class AppVersionService {
    /**
     * Get the current app version
     */
    async getAppVersion() {
        // Get the latest version (there should only be one document)
        let versionDoc = await AppVersion.findOne().sort({ updatedAt: -1 });
        
        // If no version exists, create a default one
        if (!versionDoc) {
            versionDoc = await AppVersion.create({
                version: '1.0.0',
                downloadUrl: '',
            });
        }
        
        return versionDoc;
    }

    /**
     * Update the app version
     */
    async updateAppVersion(version: string, downloadUrl: string) {
        if (!version || !downloadUrl) {
            throw new Error('Version and download URL are required.');
        }

        // Delete all existing versions and create a new one
        await AppVersion.deleteMany({});
        
        const newVersion = await AppVersion.create({
            version,
            downloadUrl,
            updatedAt: new Date(),
        });

        return newVersion;
    }
}

export default new AppVersionService();
