// @ts-nocheck
// src/lib/services/SettingsService.js
import { browser } from '$app/environment';
import { userStorageService } from './UserStorageService.js';

class SettingsService {
  constructor() {
    this.settings = this.getDefaultSettings();
    if (browser) {
      this.loadSettings();
    }
  }

  getDefaultSettings() {
    return {
      general: {
        theme: 'light',
        autoSave: true,
        autoSaveInterval: 1.5, // 1.5 seconds after last edit
        showConfirmation: true
      },
      voice: {
        enabled: true,
        continuous: true,
        confidenceThreshold: 0.7,
        accentAdaptation: true,
        contributeTrainingData: false,
        quickButtonMacroIds: [
          'macro_default_4', // Normal Limits
          'macro_default_5', // No Acute
          'macro_default_3'  // Clinical Correlation
        ]
      },
      reports: {
        defaultTemplate: 'blank',
        exportQuality: 'high'
      },
      interface: {
        fontSize: 'medium',
        tooltips: true,
        animations: true
      },
      clinical: {
        institutionName: '',
        department: 'Radiology',
        userName: '',
        credentials: 'MD',
        signature: '',
        worklistIntegration: false,
        pacsIntegration: false
      },
      privacy: {
        rememberPatients: false,
        autoLogout: 30,
        encryptData: true,
        shareUsageStats: false
      },
      ai: {
        enabled: false,
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'mistral:7b',
        autoGenerateImpressions: false
      }
    };
  }

  loadSettings() {
    if (!browser) return;

    try {
      const saved = userStorageService.getItem('krispoint-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = { ...this.settings, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  saveSettings(newSettings) {
    if (!browser) return;

    try {
      this.settings = { ...this.settings, ...newSettings };
      
      // Always enforce encryption for medical data compliance (not optional)
      if (this.settings.privacy) {
        this.settings.privacy.encryptData = true;
      }
      
      userStorageService.setItem('krispoint-settings', JSON.stringify(this.settings));
      
      // Apply settings to individual services
      this.applySettingsToServices();
      
      // Dispatch event to notify components (like tooltips) of settings changes
      window.dispatchEvent(new CustomEvent('settingsChanged', {
        detail: this.settings
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  async applySettingsToServices() {
    if (!browser) return;

    try {
      // Apply theme settings
      await this.applyThemeSettings();
      
      // Apply voice settings  
      await this.applyVoiceSettings();
      
      // Apply interface settings
      this.applyInterfaceSettings();

      // Apply autosave settings
      this.applyAutosaveSettings();

    } catch (error) {
      console.error('Error applying settings to services:', error);
    }
  }

  async applyThemeSettings() {
    try {
      const { themeService } = await import('./ThemeService.js');
      if (themeService && this.settings.general.theme) {
        // Save to the format ThemeService expects (user-specific)
        userStorageService.setItem('krishPoint_theme', this.settings.general.theme);
        themeService.setTheme(this.settings.general.theme);
      }
    } catch (error) {
      console.error('Error applying theme settings:', error);
    }
  }

  async applyVoiceSettings() {
    try {
      // Apply to WhisperVoiceService (current offline voice engine)
      const { whisperVoiceService } = await import('./WhisperVoiceService');
      if (whisperVoiceService) {
        // Apply Whisper-specific settings
        if (this.settings.voice.enabled) {
          // Configure Whisper service with user settings
          whisperVoiceService.setConfidenceThreshold(this.settings.voice.confidenceThreshold || 0.7);
        } else {
          // Stop voice recognition when disabled
          if (whisperVoiceService.isListening) {
            whisperVoiceService.stopListening();
          }
        }
      }

      // Apply to EnhancedVoiceService (manages Whisper integration)
      const { enhancedVoiceService } = await import('./EnhancedVoiceService.js');
      if (enhancedVoiceService) {
        // Enable or disable the service
        if (this.settings.voice.enabled) {
          // Update confidence threshold for command processing
          enhancedVoiceService.confidenceThreshold = this.settings.voice.confidenceThreshold || 0.7;
        } else {
          // Stop voice recognition when disabled
          if (enhancedVoiceService.isListening || (whisperVoiceService && whisperVoiceService.isListening)) {
            enhancedVoiceService.stopListening();
          }
        }
      }

      // Dispatch custom event to notify voice components of settings changes
      if (browser) {
        window.dispatchEvent(new CustomEvent('voiceSettingsChanged', { 
          detail: { 
            enabled: this.settings.voice.enabled,
            ...this.settings.voice 
          }
        }));
      }

    } catch (error) {
      console.error('Error applying voice settings:', error);
    }
  }

  applyInterfaceSettings() {
    // Apply CSS custom properties for interface settings
    const root = document.documentElement;
    
    // Font size
    const fontSizeMap = {
      'small': '14px',
      'medium': '16px', 
      'large': '18px',
      'extra-large': '20px'
    };
    
    if (fontSizeMap[this.settings.interface.fontSize]) {
      const fontSize = fontSizeMap[this.settings.interface.fontSize];
      root.style.setProperty('--base-font-size', fontSize);
    }

    // Animations
    if (!this.settings.interface.animations) {
      root.style.setProperty('--animation-duration', '0ms');
    } else {
      root.style.setProperty('--animation-duration', '200ms');
    }
  }

  getSetting(category, key) {
    return this.settings[category]?.[key];
  }

  updateSetting(category, key, value) {
    if (!this.settings[category]) {
      this.settings[category] = {};
    }
    this.settings[category][key] = value;
  }

  getAllSettings() {
    return { ...this.settings };
  }

  applyAutosaveSettings() {
    // Store autosave settings in localStorage for components to access (user-specific)
    if (browser) {
      const autosaveConfig = {
        enabled: this.settings.general.autoSave,
        interval: this.settings.general.autoSaveInterval * 1000 // Convert to milliseconds
      };
      userStorageService.setItem('krispoint-autosave-config', JSON.stringify(autosaveConfig));
      
      // Dispatch custom event to notify components of autosave config changes
      window.dispatchEvent(new CustomEvent('autosaveSettingsChanged', { 
        detail: autosaveConfig 
      }));
    }
  }

  getAutosaveSettings() {
    return {
      enabled: this.settings.general.autoSave,
      debounceMs: this.settings.general.autoSaveInterval * 1000 // Convert to milliseconds
    };
  }

  resetToDefaults() {
    if (!browser) return;
    
    this.settings = this.getDefaultSettings();
    userStorageService.removeItem('krispoint-settings');
    this.applySettingsToServices();
  }

  exportSettings() {
    return JSON.stringify(this.settings, null, 2);
  }

  importSettings(settingsJson) {
    try {
      const imported = JSON.parse(settingsJson);
      this.saveSettings(imported);
      return true;
    } catch (error) {
      console.error('Error importing settings:', error);
      return false;
    }
  }
}

// Export singleton instance
export const settingsService = browser ? new SettingsService() : null;
export { SettingsService };