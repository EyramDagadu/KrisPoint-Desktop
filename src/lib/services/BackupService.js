// BackupService.js - Export and import all app data for backup/restore
import { browser } from '$app/environment';

class BackupService {
    constructor() {
        if (!browser) {
            throw new Error('BackupService can only be used in browser environment');
        }
    }

    /**
     * Export all localStorage data to a downloadable JSON file
     * @returns {Object} { success: boolean, filename?: string, error?: string }
     */
    exportAllData() {
        try {
            const allData = {};
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            
            // Capture ALL localStorage data
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                allData[key] = localStorage.getItem(key);
            }

            // Create JSON blob
            const jsonString = JSON.stringify(allData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const filename = `krispoint-backup-${timestamp}.json`;
            link.download = filename;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            URL.revokeObjectURL(url);
            
            return { 
                success: true, 
                filename,
                itemCount: Object.keys(allData).length,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Backup export error:', error);
            return { 
                success: false, 
                error: 'Failed to export backup. Please try again.' 
            };
        }
    }

    /**
     * Import and restore localStorage data from a backup file
     * @param {File} file - The backup JSON file
     * @returns {Promise<Object>} { success: boolean, itemCount?: number, error?: string }
     */
    async importData(file) {
        try {
            if (!file) {
                return { success: false, error: 'No file provided' };
            }

            if (!file.name.endsWith('.json')) {
                return { success: false, error: 'Invalid file type. Please select a JSON backup file.' };
            }

            const text = await file.text();
            const data = JSON.parse(text);

            if (!data || typeof data !== 'object') {
                return { success: false, error: 'Invalid backup file format' };
            }

            // Clear existing localStorage
            localStorage.clear();

            // Restore all data
            let itemCount = 0;
            for (const [key, value] of Object.entries(data)) {
                if (value !== null && value !== undefined) {
                    localStorage.setItem(key, value);
                    itemCount++;
                }
            }

            return { 
                success: true, 
                itemCount,
                message: `Successfully restored ${itemCount} items from backup`
            };
        } catch (error) {
            console.error('Backup import error:', error);
            return { 
                success: false, 
                error: 'Failed to import backup. The file may be corrupted or invalid.' 
            };
        }
    }

    /**
     * Get backup metadata without importing
     * @param {File} file - The backup JSON file
     * @returns {Promise<Object>} { success: boolean, metadata?: Object, error?: string }
     */
    async getBackupInfo(file) {
        try {
            if (!file || !file.name.endsWith('.json')) {
                return { success: false, error: 'Invalid file' };
            }

            const text = await file.text();
            const data = JSON.parse(text);

            // Extract useful metadata
            const users = data['KRISPOINT_AUTH_USERS'] 
                ? JSON.parse(data['KRISPOINT_AUTH_USERS']) 
                : [];
            
            const reportKeys = Object.keys(data).filter(k => k.includes('_reports_index') || k.includes('_report_'));
            
            return {
                success: true,
                metadata: {
                    totalItems: Object.keys(data).length,
                    users: users.map(u => ({ username: u.username, fullName: u.fullName })),
                    reportCount: reportKeys.length,
                    hasSettings: Object.keys(data).some(k => k.includes('settings')),
                    hasMacros: Object.keys(data).some(k => k.includes('macros')),
                    hasSignature: Object.keys(data).some(k => k.includes('signature'))
                }
            };
        } catch (error) {
            return { 
                success: false, 
                error: 'Unable to read backup file' 
            };
        }
    }

    /**
     * Clear all app data (for reset functionality)
     * @returns {Object} { success: boolean, clearedItems: number }
     */
    clearAllData() {
        try {
            const itemCount = localStorage.length;
            localStorage.clear();
            
            return { 
                success: true, 
                clearedItems: itemCount,
                message: 'All app data has been cleared'
            };
        } catch (error) {
            console.error('Clear data error:', error);
            return { 
                success: false, 
                error: 'Failed to clear app data' 
            };
        }
    }
}

export const backupService = new BackupService();
