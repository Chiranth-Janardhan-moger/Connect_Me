import type { Request, Response } from 'express';
import appVersionService from '../services/appVersion.service';

/**
 * Get current app version
 */
export const getAppVersion = async (req: Request, res: Response) => {
    try {
        const versionDoc = await appVersionService.getAppVersion();
        res.status(200).json({
            version: versionDoc.version,
            downloadUrl: versionDoc.downloadUrl,
        });
    } catch (error) {
        console.error('Error getting app version:', error);
        res.status(500).json({ message: 'Failed to get app version.' });
    }
};

/**
 * Update app version (Admin only)
 */
export const updateAppVersion = async (req: Request, res: Response) => {
    try {
        const { version, downloadUrl } = req.body;

        if (!version || !downloadUrl) {
            return res.status(400).json({ message: 'Version and download URL are required.' });
        }

        const updatedVersion = await appVersionService.updateAppVersion(version, downloadUrl);

        res.status(200).json({
            message: 'App version updated successfully.',
            version: updatedVersion.version,
            downloadUrl: updatedVersion.downloadUrl,
        });
    } catch (error) {
        console.error('Error updating app version:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update app version.';
        res.status(500).json({ message: errorMessage });
    }
};
