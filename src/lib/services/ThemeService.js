// @ts-nocheck
// Theme Management Service for Professional Medical Interface
import { browser } from '$app/environment';
import { userStorageService } from './UserStorageService.js';

export class ThemeService {
  constructor() {
    this.currentTheme = 'light';
    this.customThemes = new Map();
    this.themeListeners = new Set();
    
    // Only initialize in browser environment
    if (browser) {
      this.initialize();
    } else {
      // Set up basic themes for SSR
      this.setupDefaultThemes();
    }
  }

  initialize() {
    if (!browser) return;
    
    this.setupDefaultThemes();
    this.loadSavedTheme();
    this.applySystemPreferences();
    this.setupMediaQueryListener();
  }

  setupDefaultThemes() {
    // Light theme (Medical Professional)
    this.addTheme('light', {
      name: 'Medical Professional',
      type: 'light',
      colors: {
        // Primary colors
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        primaryLight: '#dbeafe',
        
        // Background colors
        background: '#ffffff',
        backgroundSecondary: '#f8fafc',
        backgroundTertiary: '#f1f5f9',
        
        // Surface colors
        surface: '#ffffff',
        surfaceElevated: '#ffffff',
        surfaceHover: '#f8fafc',
        
        // Text colors
        textPrimary: '#1e293b',
        textSecondary: '#475569',
        textMuted: '#64748b',
        textDisabled: '#94a3b8',
        
        // Border colors
        border: '#e2e8f0',
        borderLight: '#f1f5f9',
        borderFocus: '#3b82f6',
        
        // Status colors
        success: '#10b981',
        successLight: '#d1fae5',
        warning: '#f59e0b',
        warningLight: '#fef3c7',
        error: '#ef4444',
        errorLight: '#fef2f2',
        info: '#3b82f6',
        infoLight: '#dbeafe',
        
        // Medical specific colors
        criticalHigh: '#dc2626',
        criticalMedium: '#ea580c',
        normal: '#10b981',
        abnormal: '#f59e0b',
        
        // Voice/AI colors
        voiceActive: '#8b5cf6',
        voiceInactive: '#64748b',
        aiAssist: '#06b6d4'
      },
      fonts: {
        primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        mono: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
        medical: '"Source Sans Pro", Arial, sans-serif'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem'
      }
    });

    // Dark theme (Medical Night Mode)
    this.addTheme('dark', {
      name: 'Medical Night Mode',
      type: 'dark',
      colors: {
        // Primary colors
        primary: '#60a5fa',
        primaryHover: '#3b82f6',
        primaryLight: '#1e3a8a',
        
        // Background colors
        background: '#0f172a',
        backgroundSecondary: '#1e293b',
        backgroundTertiary: '#334155',
        
        // Surface colors
        surface: '#1e293b',
        surfaceElevated: '#334155',
        surfaceHover: '#475569',
        
        // Text colors
        textPrimary: '#f8fafc',
        textSecondary: '#cbd5e1',
        textMuted: '#94a3b8',
        textDisabled: '#64748b',
        
        // Border colors
        border: '#334155',
        borderLight: '#475569',
        borderFocus: '#60a5fa',
        
        // Status colors
        success: '#34d399',
        successLight: '#064e3b',
        warning: '#fbbf24',
        warningLight: '#78350f',
        error: '#f87171',
        errorLight: '#7f1d1d',
        info: '#60a5fa',
        infoLight: '#1e3a8a',
        
        // Medical specific colors
        criticalHigh: '#f87171',
        criticalMedium: '#fb923c',
        normal: '#34d399',
        abnormal: '#fbbf24',
        
        // Voice/AI colors
        voiceActive: '#a78bfa',
        voiceInactive: '#64748b',
        aiAssist: '#22d3ee'
      },
      fonts: {
        primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        mono: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
        medical: '"Source Sans Pro", Arial, sans-serif'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)'
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem'
      }
    });

  }

  addTheme(id, theme) {
    this.customThemes.set(id, {
      id,
      ...theme,
      createdAt: new Date(),
      isCustom: !['light', 'dark'].includes(id)
    });
  }

  getTheme(id) {
    return this.customThemes.get(id);
  }

  getAllThemes() {
    return Array.from(this.customThemes.values());
  }

  getCurrentTheme() {
    return this.getTheme(this.currentTheme);
  }

  setTheme(themeId) {
    const theme = this.getTheme(themeId);
    if (!theme) {
      console.warn('Theme not found:', themeId);
      return false;
    }

    this.currentTheme = themeId;
    this.applyTheme(theme);
    this.saveThemePreference();
    this.notifyThemeChange(theme);
    
    return true;
  }

  applyTheme(theme) {
    if (!browser) return;

    const root = document.documentElement;

    // Apply color variables
    Object.entries(theme.colors).forEach(([name, value]) => {
      root.style.setProperty(`--color-${this.kebabCase(name)}`, value);
    });

    // Apply font variables
    Object.entries(theme.fonts).forEach(([name, value]) => {
      root.style.setProperty(`--font-${this.kebabCase(name)}`, value);
    });

    // Apply shadow variables
    Object.entries(theme.shadows).forEach(([name, value]) => {
      root.style.setProperty(`--shadow-${name}`, value);
    });

    // Apply border radius variables
    Object.entries(theme.borderRadius).forEach(([name, value]) => {
      root.style.setProperty(`--radius-${name}`, value);
    });

    // Set theme class on body
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '')
      .trim();
    document.body.classList.add(`theme-${theme.id}`);

    // Set data attribute for CSS targeting
    document.body.setAttribute('data-theme', theme.id);
    document.body.setAttribute('data-theme-type', theme.type);
  }

  toggleTheme() {
    const nextTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(nextTheme);
  }

  // System preference detection
  applySystemPreferences() {
    if (!browser) return;

    const savedTheme = userStorageService.getItem('krishPoint_theme');
    if (!savedTheme && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      
      if (prefersDark) {
        this.setTheme('dark');
      } else {
        this.setTheme('light');
      }
    }
  }

  setupMediaQueryListener() {
    if (!browser || !window.matchMedia) return;

    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');

    const handleSystemChange = () => {
      // Only auto-switch if user hasn't manually set a theme
      const savedTheme = userStorageService.getItem('krishPoint_theme');
      if (!savedTheme) {
        this.applySystemPreferences();
      }
    };

    darkModeQuery.addListener(handleSystemChange);
    highContrastQuery.addListener(handleSystemChange);
  }

  // Custom theme creation
  createCustomTheme(baseThemeId, customizations, name) {
    const baseTheme = this.getTheme(baseThemeId);
    if (!baseTheme) return null;

    const customThemeId = this.generateThemeId(name);
    const customTheme = {
      ...baseTheme,
      id: customThemeId,
      name: name || `Custom ${baseTheme.name}`,
      isCustom: true,
      baseTheme: baseThemeId,
      customizations
    };

    // Apply customizations
    if (customizations.colors) {
      customTheme.colors = { ...customTheme.colors, ...customizations.colors };
    }
    if (customizations.fonts) {
      customTheme.fonts = { ...customTheme.fonts, ...customizations.fonts };
    }

    this.addTheme(customThemeId, customTheme);
    this.saveCustomThemes();
    
    return customThemeId;
  }

  updateCustomTheme(themeId, customizations) {
    const theme = this.getTheme(themeId);
    if (!theme || !theme.isCustom) return false;

    Object.assign(theme, customizations);
    this.saveCustomThemes();
    
    if (this.currentTheme === themeId) {
      this.applyTheme(theme);
    }
    
    return true;
  }

  deleteCustomTheme(themeId) {
    const theme = this.getTheme(themeId);
    if (!theme || !theme.isCustom) return false;

    this.customThemes.delete(themeId);
    this.saveCustomThemes();

    // Switch to default theme if current theme was deleted
    if (this.currentTheme === themeId) {
      this.setTheme('light');
    }

    return true;
  }

  // Theme scheduling
  scheduleTheme(themeId, startTime, endTime) {
    const schedule = {
      themeId,
      startTime, // Format: "HH:MM"
      endTime,   // Format: "HH:MM"
      active: true
    };

    this.saveSchedule(schedule);
    this.checkSchedule();
    
    // Set up interval to check schedule every minute
    if (this.scheduleInterval) {
      clearInterval(this.scheduleInterval);
    }
    
    this.scheduleInterval = setInterval(() => {
      this.checkSchedule();
    }, 60000); // Check every minute
  }

  checkSchedule() {
    try {
      const schedule = browser ? JSON.parse(userStorageService.getItem('krishPoint_themeSchedule') || '{}') : {};
      if (!schedule.active) return;

      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const isInSchedule = this.isTimeInRange(currentTime, schedule.startTime, schedule.endTime);
      
      if (isInSchedule && this.currentTheme !== schedule.themeId) {
        this.setTheme(schedule.themeId);
      } else if (!isInSchedule && this.currentTheme === schedule.themeId) {
        // Switch back to default or previous theme
        const defaultTheme = this.getDefaultThemeForTime();
        this.setTheme(defaultTheme);
      }
    } catch (error) {
      console.error('Error checking theme schedule:', error);
    }
  }

  isTimeInRange(current, start, end) {
    if (start <= end) {
      return current >= start && current <= end;
    } else {
      // Handle overnight range (e.g., 22:00 to 06:00)
      return current >= start || current <= end;
    }
  }

  getDefaultThemeForTime() {
    if (typeof window === 'undefined') return 'light';
    
    const hour = new Date().getHours();
    const isDarkTime = hour < 7 || hour > 18;
    
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return isDarkTime ? 'dark' : 'light';
    }
    
    return 'light';
  }

  // Accessibility features
  getAccessibilityInfo() {
    const theme = this.getCurrentTheme();
    if (!theme) return null;

    return {
      contrastRatio: this.calculateContrastRatio(theme.colors.textPrimary, theme.colors.background),
      colorBlindSafe: this.isColorBlindSafe(theme),
      fontSize: this.getFontSize(),
      reducedMotion: this.prefersReducedMotion()
    };
  }

  calculateContrastRatio(foreground, background) {
    // Simplified contrast ratio calculation
    // In a real implementation, you'd use a proper color library
    const fg = this.hexToRgb(foreground);
    const bg = this.hexToRgb(background);
    
    if (!fg || !bg) return 1;
    
    const fgLum = this.getLuminance(fg);
    const bgLum = this.getLuminance(bg);
    
    const lighter = Math.max(fgLum, bgLum);
    const darker = Math.min(fgLum, bgLum);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  isColorBlindSafe(theme) {
    // Check if theme uses distinguishable colors for color-blind users
    // This is a simplified check
    return theme.type === 'high-contrast';
  }

  prefersReducedMotion() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Event system
  onThemeChange(callback) {
    this.themeListeners.add(callback);
    return () => this.themeListeners.delete(callback);
  }

  notifyThemeChange(theme) {
    this.themeListeners.forEach(callback => {
      try {
        callback(theme);
      } catch (error) {
        console.error('Error in theme change callback:', error);
      }
    });
  }

  // Persistence
  saveThemePreference() {
    if (!browser) return;
    
    try {
      userStorageService.setItem('krishPoint_theme', this.currentTheme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }

  loadSavedTheme() {
    if (!browser) {
      this.setTheme('light');
      return;
    }
    
    try {
      const saved = userStorageService.getItem('krishPoint_theme');
      if (saved && this.getTheme(saved)) {
        this.setTheme(saved);
      } else {
        this.setTheme('light');
      }
    } catch (error) {
      console.error('Error loading saved theme:', error);
      this.setTheme('light');
    }
  }

  saveCustomThemes() {
    if (!browser) return;
    
    try {
      const customThemes = Array.from(this.customThemes.values())
        .filter(theme => theme.isCustom);
      userStorageService.setItem('krishPoint_customThemes', JSON.stringify(customThemes));
    } catch (error) {
      console.error('Error saving custom themes:', error);
    }
  }

  loadCustomThemes() {
    if (!browser) return;
    
    try {
      const saved = userStorageService.getItem('krishPoint_customThemes');
      if (saved) {
        const customThemes = JSON.parse(saved);
        customThemes.forEach(theme => {
          this.customThemes.set(theme.id, theme);
        });
      }
    } catch (error) {
      console.error('Error loading custom themes:', error);
    }
  }

  saveSchedule(schedule) {
    if (!browser) return;
    
    try {
      userStorageService.setItem('krishPoint_themeSchedule', JSON.stringify(schedule));
    } catch (error) {
      console.error('Error saving theme schedule:', error);
    }
  }

  // Utility methods
  kebabCase(str) {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }

  generateThemeId(name) {
    const base = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `custom-${base}-${Date.now()}`;
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  getLuminance(rgb) {
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  getFontSize() {
    if (typeof document === 'undefined') return 16;
    return parseInt(getComputedStyle(document.documentElement).fontSize);
  }

  // Export/Import
  exportThemes() {
    return {
      themes: Array.from(this.customThemes.values()),
      currentTheme: this.currentTheme,
      exportDate: new Date(),
      version: '1.0'
    };
  }

  importThemes(data) {
    try {
      if (data.themes) {
        data.themes.forEach(theme => {
          this.customThemes.set(theme.id, theme);
        });
        this.saveCustomThemes();
        return true;
      }
    } catch (error) {
      console.error('Error importing themes:', error);
    }
    return false;
  }

  // Cleanup
  destroy() {
    if (this.scheduleInterval) {
      clearInterval(this.scheduleInterval);
    }
    this.themeListeners.clear();
    this.customThemes.clear();
  }
}

// Create and export singleton instance (only in browser)
export const themeService = browser ? new ThemeService() : null;