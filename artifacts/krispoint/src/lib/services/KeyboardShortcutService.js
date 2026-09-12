// @ts-nocheck
// Keyboard Shortcut Management Service for Medical Reporting
import { browser } from '$app/environment';
import { userStorageService } from './UserStorageService.js';

export class KeyboardShortcutService {
  constructor() {
    this.shortcuts = new Map();
    this.activeModifiers = new Set();
    this.isEnabled = true;
    this.listeners = new Map();
    this.boundKeyDownHandler = null;
    this.boundKeyUpHandler = null;
    this.eventsBound = false;
    this.setupDefaultShortcuts();
    
    // Only bind events in browser environment
    if (browser) {
      this.bindEvents();
    }
  }

  setupDefaultShortcuts() {
    // Document shortcuts
    this.addShortcut('ctrl+s', 'Save Report', () => this.trigger('saveReport'));
    this.addShortcut('ctrl+n', 'New Report', () => this.trigger('newReport'));
    this.addShortcut('ctrl+o', 'Open History', () => this.trigger('openHistory'));
    this.addShortcut('ctrl+p', 'Print/Export PDF', () => this.trigger('exportPDF'));
    this.addShortcut('ctrl+z', 'Undo', () => this.trigger('undo'));
    this.addShortcut('ctrl+y', 'Redo', () => this.trigger('redo'));

    // Navigation shortcuts
    this.addShortcut('ctrl+1', 'Go to Clinical History', () => this.trigger('goToSection', 'clinicalHistory'));
    this.addShortcut('ctrl+2', 'Go to Technique', () => this.trigger('goToSection', 'technique'));
    this.addShortcut('ctrl+3', 'Go to Findings', () => this.trigger('goToSection', 'findings'));
    this.addShortcut('ctrl+4', 'Go to Impression', () => this.trigger('goToSection', 'impression'));
    this.addShortcut('tab', 'Next Section', () => this.trigger('nextSection'));
    this.addShortcut('shift+tab', 'Previous Section', () => this.trigger('previousSection'));

    // Voice shortcuts
    this.addShortcut('ctrl+space', 'Toggle Voice Recognition', () => this.trigger('toggleVoice'));
    this.addShortcut('ctrl+shift+v', 'Toggle Voice Recognition (Alt)', () => this.trigger('toggleVoice'));
    this.addShortcut('ctrl+shift+m', 'Insert Macro', () => this.trigger('openMacros'));
    this.addShortcut('ctrl+shift+t', 'Choose Template', () => this.trigger('openTemplates'));

    // Formatting shortcuts
    this.addShortcut('ctrl+b', 'Bold Text', () => this.trigger('formatText', 'bold'));
    this.addShortcut('ctrl+i', 'Italic Text', () => this.trigger('formatText', 'italic'));
    this.addShortcut('ctrl+u', 'Underline Text', () => this.trigger('formatText', 'underline'));
    this.addShortcut('ctrl+shift+c', 'Clear Formatting', () => this.trigger('clearFormatting'));

    // Quick phrases
    this.addShortcut('ctrl+shift+n', 'Insert "Normal"', () => this.trigger('insertQuickPhrase', 'within normal limits'));
    this.addShortcut('ctrl+shift+a', 'Insert "No Acute"', () => this.trigger('insertQuickPhrase', 'No acute abnormality identified'));
    this.addShortcut('ctrl+shift+r', 'Insert "Recommend"', () => this.trigger('insertQuickPhrase', 'Clinical correlation is recommended'));
    this.addShortcut('ctrl+shift+s', 'Insert "Stable"', () => this.trigger('insertQuickPhrase', 'Stable appearance compared to prior study'));

    // Application shortcuts
    this.addShortcut('f1', 'Help/Shortcuts', () => this.trigger('showHelp'));
    this.addShortcut('f11', 'Toggle Fullscreen', () => this.trigger('toggleFullscreen'));
    this.addShortcut('ctrl+comma', 'Settings', () => this.trigger('openSettings'));
    this.addShortcut('escape', 'Close Modal/Cancel', () => this.trigger('closeModal'));

    // Medical reporting shortcuts
    this.addShortcut('ctrl+shift+d', 'Insert Date/Time', () => this.trigger('insertDateTime'));
    this.addShortcut('ctrl+shift+p', 'Insert Patient Info', () => this.trigger('insertPatientInfo'));
    this.addShortcut('ctrl+alt+c', 'Copy Section', () => this.trigger('copySection'));
    this.addShortcut('ctrl+alt+v', 'Paste Section', () => this.trigger('pasteSection'));
  }

  addShortcut(key, description, callback) {
    const normalizedKey = this.normalizeKey(key);
    this.shortcuts.set(normalizedKey, {
      key: normalizedKey,
      originalKey: key,
      description,
      callback,
      enabled: true
    });
  }

  removeShortcut(key) {
    const normalizedKey = this.normalizeKey(key);
    return this.shortcuts.delete(normalizedKey);
  }

  normalizeKey(key) {
    return key.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/cmd/g, 'ctrl')  // Mac compatibility
      .replace(/command/g, 'ctrl')
      .replace(/option/g, 'alt')
      .split('+')
      .sort((a, b) => {
        const order = ['ctrl', 'alt', 'shift'];
        const aIndex = order.indexOf(a);
        const bIndex = order.indexOf(b);
        if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      })
      .join('+');
  }

  bindEvents() {
    if (!browser) return;
    
    // Prevent duplicate bindings
    if (this.eventsBound) {
      console.log('🔧 KeyboardShortcutService events already bound, skipping');
      return;
    }
    
    console.log('🔧 KeyboardShortcutService.bindEvents() called - setting up event listeners');

    // Store bound handlers so we can remove them later
    this.boundKeyDownHandler = (event) => {
      console.log('🔧 Document keydown event captured:', {
        key: event.key,
        ctrl: event.ctrlKey,
        serviceEnabled: this.isEnabled
      });
      
      if (!this.isEnabled) {
        console.log('🔧 Service disabled, ignoring keydown');
        return;
      }
      
      // Handle the shortcut first, then prevent default if it was handled
      const handled = this.handleKeyDown(event);
      
      console.log('🔧 Shortcut handling result:', {
        handled,
        willPreventDefault: handled
      });
      
      // Only prevent default if we actually handled the shortcut
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
        console.log('🔧 Event prevented and propagation stopped');
      }
    };

    this.boundKeyUpHandler = (event) => {
      this.handleKeyUp(event);
    };

    document.addEventListener('keydown', this.boundKeyDownHandler);
    document.addEventListener('keyup', this.boundKeyUpHandler);
    
    this.eventsBound = true;
    console.log('🔧 Event listeners bound successfully');
  }
  
  unbindEvents() {
    if (!browser || !this.eventsBound) return;
    
    if (this.boundKeyDownHandler) {
      document.removeEventListener('keydown', this.boundKeyDownHandler);
      this.boundKeyDownHandler = null;
    }
    
    if (this.boundKeyUpHandler) {
      document.removeEventListener('keyup', this.boundKeyUpHandler);
      this.boundKeyUpHandler = null;
    }
    
    this.eventsBound = false;
    console.log('🔧 KeyboardShortcutService event listeners removed');
  }

  handleKeyDown(event) {
    console.log('🔧 KeyboardShortcutService.handleKeyDown called', {
      key: event.key,
      ctrl: event.ctrlKey,
      alt: event.altKey,
      shift: event.shiftKey,
      target: event.target.tagName,
      targetContentEditable: event.target.contentEditable
    });

    // Skip if user is typing in an input field (unless it's a global shortcut)
    const isTyping = this.isTypingContext(event.target);
    const isGlobal = this.isGlobalShortcut(event);
    
    // Special case: Allow TipTap editor to handle its own shortcuts
    const isTipTapEditor = event.target?.classList?.contains('tiptap-editor') || 
                           event.target?.closest?.('.tiptap-editor');
    const isTipTapShortcut = ['ctrl+b', 'ctrl+i', 'ctrl+u', 'ctrl+z', 'ctrl+y'].includes(this.getKeyFromEvent(event));
    
    if (isTipTapEditor && isTipTapShortcut) {
      console.log('🎨 Letting TipTap handle its own shortcut:', this.getKeyFromEvent(event));
      return false; // Don't handle it - let TipTap do it
    }
    
    if (isTyping && !isGlobal) {
      console.log('🔧 Skipping shortcut - user is typing in input field');
      return false;
    }

    const key = this.getKeyFromEvent(event);
    const shortcut = this.shortcuts.get(key);
    
    console.log('🔧 Key processing:', {
      detectedKey: key,
      shortcutFound: !!shortcut,
      shortcutEnabled: shortcut?.enabled,
      allShortcuts: Array.from(this.shortcuts.keys())
    });

    if (shortcut && shortcut.enabled) {
      try {
        console.log('🔧 Executing shortcut callback for:', key);
        shortcut.callback();
        this.logShortcutUsage(key);
        console.log('🔧 Shortcut executed successfully:', key);
        return true; // Indicate that we handled the shortcut
      } catch (error) {
        console.error('🔧 Error executing shortcut:', key, error);
        return false;
      }
    }
    
    console.log('🔧 No shortcut handled for key:', key);
    return false; // Indicate that we didn't handle the shortcut
  }

  handleKeyUp(event) {
    // Track modifier key releases for complex shortcuts
    const modifiers = ['ctrl', 'alt', 'shift', 'meta'];
    modifiers.forEach(mod => {
      if (!event[mod + 'Key']) {
        this.activeModifiers.delete(mod);
      }
    });
  }

  getKeyFromEvent(event) {
    const parts = [];
    
    // Null check for event and event.key
    if (!event || !event.key) {
      console.warn('🔧 Invalid event object passed to getKeyFromEvent:', event);
      return 'unknown';
    }
    
    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    
    let key = event.key.toLowerCase();
    
    // Special key mappings
    const keyMap = {
      ' ': 'space',
      'arrowup': 'up',
      'arrowdown': 'down',
      'arrowleft': 'left',
      'arrowright': 'right',
      'delete': 'del',
      'escape': 'escape'
    };
    
    key = keyMap[key] || key;
    parts.push(key);
    
    return parts.join('+');
  }

  isTypingContext(element) {
    if (!element) return false;
    
    const typingTags = ['input', 'textarea', 'select'];
    const tagName = element.tagName?.toLowerCase();
    
    // Check if it's a TipTap editor - allow shortcuts there!
    if (element.classList?.contains('tiptap-editor') || 
        element.closest?.('.tiptap-editor')) {
      console.log('🎯 TipTap editor detected - allowing shortcuts');
      return false; // Not a blocking typing context
    }
    
    return (
      typingTags.includes(tagName) ||
      element.contentEditable === 'true' ||
      element.getAttribute('role') === 'textbox'
    );
  }

  isGlobalShortcut(event) {
    const key = this.getKeyFromEvent(event);
    const globalShortcuts = [
      'f1', 'f11', 'ctrl+s', 'ctrl+n', 'ctrl+o', 'ctrl+p',
      'ctrl+space', 'ctrl+shift+v', 'escape', 'ctrl+comma'
    ];
    return globalShortcuts.includes(key);
  }

  isFormattingShortcut(event) {
    const key = this.getKeyFromEvent(event);
    // Let TipTap handle its own formatting shortcuts natively
    // Only intercept non-TipTap shortcuts
    const formattingShortcuts = [
      'ctrl+shift+c'  // Clear formatting - not a TipTap default
    ];
    return formattingShortcuts.includes(key);
  }

  // Event system
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  trigger(event, ...args) {
    console.log('🔧 KeyboardShortcutService.trigger called:', {
      event,
      args,
      hasListeners: this.listeners.has(event),
      listenerCount: this.listeners.get(event)?.size || 0
    });
    
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback, index) => {
        try {
          console.log(`🔧 Executing listener ${index} for event:`, event);
          callback(...args);
          console.log(`🔧 Listener ${index} executed successfully`);
        } catch (error) {
          console.error(`🔧 Error in shortcut callback ${index}:`, error);
        }
      });
    } else {
      console.log('🔧 No listeners found for event:', event);
    }
  }

  // Shortcut management
  enableShortcut(key) {
    const normalizedKey = this.normalizeKey(key);
    const shortcut = this.shortcuts.get(normalizedKey);
    if (shortcut) {
      shortcut.enabled = true;
    }
  }

  disableShortcut(key) {
    const normalizedKey = this.normalizeKey(key);
    const shortcut = this.shortcuts.get(normalizedKey);
    if (shortcut) {
      shortcut.enabled = false;
    }
  }

  getAllShortcuts() {
    return Array.from(this.shortcuts.values()).map(shortcut => ({
      key: shortcut.originalKey,
      description: shortcut.description,
      enabled: shortcut.enabled
    }));
  }

  getShortcutsByCategory() {
    const categories = {
      'Document': [],
      'Navigation': [],
      'Voice': [],
      'Formatting': [],
      'Quick Phrases': [],
      'Application': [],
      'Medical': []
    };

    this.shortcuts.forEach(shortcut => {
      const desc = shortcut.description;
      let category = 'Application';

      if (desc.includes('Report') || desc.includes('Save') || desc.includes('New') || desc.includes('Print')) {
        category = 'Document';
      } else if (desc.includes('Go to') || desc.includes('Section')) {
        category = 'Navigation';
      } else if (desc.includes('Voice') || desc.includes('Macro') || desc.includes('Template')) {
        category = 'Voice';
      } else if (desc.includes('Bold') || desc.includes('Italic') || desc.includes('Format')) {
        category = 'Formatting';
      } else if (desc.includes('Insert "')) {
        category = 'Quick Phrases';
      } else if (desc.includes('Patient') || desc.includes('Date') || desc.includes('Copy Section')) {
        category = 'Medical';
      }

      categories[category].push({
        key: shortcut.originalKey,
        description: shortcut.description,
        enabled: shortcut.enabled
      });
    });

    return categories;
  }

  // Customization
  customizeShortcut(oldKey, newKey, description) {
    const normalizedOldKey = this.normalizeKey(oldKey);
    const shortcut = this.shortcuts.get(normalizedOldKey);
    
    if (shortcut) {
      // Remove old shortcut
      this.shortcuts.delete(normalizedOldKey);
      
      // Add new shortcut with same callback
      this.addShortcut(newKey, description || shortcut.description, shortcut.callback);
      
      this.saveCustomizations();
      return true;
    }
    return false;
  }

  // Persistence
  saveCustomizations() {
    try {
      const customizations = {};
      this.shortcuts.forEach((shortcut, key) => {
        customizations[key] = {
          originalKey: shortcut.originalKey,
          description: shortcut.description,
          enabled: shortcut.enabled
        };
      });
      
      userStorageService.setItem('krishPoint_shortcuts', JSON.stringify(customizations));
    } catch (error) {
      console.error('Error saving shortcut customizations:', error);
    }
  }

  loadCustomizations() {
    try {
      const saved = userStorageService.getItem('krishPoint_shortcuts');
      if (saved) {
        const customizations = JSON.parse(saved);
        
        Object.entries(customizations).forEach(([key, config]) => {
          const shortcut = this.shortcuts.get(key);
          if (shortcut) {
            shortcut.enabled = config.enabled;
            if (config.description) {
              shortcut.description = config.description;
            }
          }
        });
      }
    } catch (error) {
      console.error('Error loading shortcut customizations:', error);
    }
  }

  // Analytics
  logShortcutUsage(key) {
    try {
      const usage = JSON.parse(userStorageService.getItem('krishPoint_shortcutUsage') || '{}');
      usage[key] = (usage[key] || 0) + 1;
      usage._lastUsed = Date.now();
      userStorageService.setItem('krishPoint_shortcutUsage', JSON.stringify(usage));
    } catch (error) {
      console.error('Error logging shortcut usage:', error);
    }
  }

  getUsageStatistics() {
    try {
      const usage = JSON.parse(userStorageService.getItem('krishPoint_shortcutUsage') || '{}');
      const stats = Object.entries(usage)
        .filter(([key]) => key !== '_lastUsed')
        .map(([key, count]) => ({
          key,
          shortcut: this.shortcuts.get(key)?.originalKey || key,
          description: this.shortcuts.get(key)?.description || 'Unknown',
          count
        }))
        .sort((a, b) => b.count - a.count);
      
      return {
        mostUsed: stats.slice(0, 10),
        totalUsage: stats.reduce((sum, stat) => sum + stat.count, 0),
        lastUsed: usage._lastUsed ? new Date(usage._lastUsed) : null
      };
    } catch (error) {
      console.error('Error getting usage statistics:', error);
      return { mostUsed: [], totalUsage: 0, lastUsed: null };
    }
  }

  // Help and training
  getConflictingShortcuts() {
    const conflicts = [];
    const keys = new Set();
    
    this.shortcuts.forEach((shortcut, key) => {
      if (keys.has(key)) {
        conflicts.push(key);
      }
      keys.add(key);
    });
    
    return conflicts;
  }

  suggestShortcuts(feature) {
    const suggestions = {
      'voice': ['ctrl+shift+v', 'ctrl+shift+m'],
      'navigation': ['ctrl+1', 'ctrl+2', 'ctrl+3', 'ctrl+4'],
      'formatting': ['ctrl+b', 'ctrl+i', 'ctrl+u'],
      'document': ['ctrl+s', 'ctrl+n', 'ctrl+o', 'ctrl+p']
    };
    
    return suggestions[feature] || [];
  }

  // System integration
  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  isShortcutEnabled(key) {
    const normalizedKey = this.normalizeKey(key);
    const shortcut = this.shortcuts.get(normalizedKey);
    return shortcut ? shortcut.enabled : false;
  }

  // Export/Import
  exportShortcuts() {
    return {
      shortcuts: Array.from(this.shortcuts.entries()).map(([key, shortcut]) => ({
        key,
        originalKey: shortcut.originalKey,
        description: shortcut.description,
        enabled: shortcut.enabled
      })),
      usage: this.getUsageStatistics(),
      exportDate: new Date(),
      version: '1.0'
    };
  }

  importShortcuts(data) {
    try {
      if (data.shortcuts) {
        // Clear existing shortcuts
        this.shortcuts.clear();
        
        // Import new shortcuts
        data.shortcuts.forEach(shortcut => {
          // Reconstruct callbacks based on description patterns
          const callback = this.reconstructCallback(shortcut.description);
          
          this.shortcuts.set(shortcut.key, {
            key: shortcut.key,
            originalKey: shortcut.originalKey,
            description: shortcut.description,
            enabled: shortcut.enabled,
            callback
          });
        });
        
        this.saveCustomizations();
        return true;
      }
    } catch (error) {
      console.error('Error importing shortcuts:', error);
    }
    return false;
  }

  reconstructCallback(description) {
    // Basic callback reconstruction based on description
    if (description.includes('Save')) return () => this.trigger('saveReport');
    if (description.includes('New')) return () => this.trigger('newReport');
    if (description.includes('Voice')) return () => this.trigger('toggleVoice');
    if (description.includes('Go to')) {
      const section = description.toLowerCase().includes('history') ? 'clinicalHistory' :
                    description.toLowerCase().includes('technique') ? 'technique' :
                    description.toLowerCase().includes('findings') ? 'findings' :
                    description.toLowerCase().includes('impression') ? 'impression' : 'findings';
      return () => this.trigger('goToSection', section);
    }
    
    // Default callback
    return () => console.log('Shortcut triggered:', description);
  }

  // Cleanup
  destroy() {
    this.unbindEvents();
    this.shortcuts.clear();
    this.listeners.clear();
    this.activeModifiers.clear();
    this.isEnabled = false;
    console.log('🔧 KeyboardShortcutService destroyed');
  }
}

// Create and export singleton instance (only in browser)
export const keyboardShortcutService = browser ? new KeyboardShortcutService() : null;