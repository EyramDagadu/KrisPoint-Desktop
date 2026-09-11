// macroStore.js - Enhanced macro data management with dynamic updates
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { userStorageService } from '../services/UserStorageService.js';

// Default macros that come pre-installed
const defaultMacros = [
  {
    id: 'macro_default_1',
    name: 'Normal Chest X-ray',
    voiceCommand: 'normal chest',
    content: 'The lungs are clear bilaterally without focal consolidation, effusion, or pneumothorax. The cardiac silhouette is normal in size and configuration. The mediastinal contours are unremarkable. No acute cardiopulmonary abnormalities.',
    category: 'Chest',
    variables: []
  },
  {
    id: 'macro_default_2',
    name: 'Normal Brain CT',
    voiceCommand: 'normal brain',
    content: 'No acute intracranial abnormalities. No hemorrhage, mass effect, or midline shift. The ventricles and sulci are normal in size and configuration. Gray-white matter differentiation is preserved.',
    category: 'Neuro',
    variables: []
  },
  {
    id: 'macro_default_3',
    name: 'Clinical Correlation',
    voiceCommand: 'clinical correlation',
    content: 'clinical correlation recommended',
    category: 'General',
    variables: []
  },
  {
    id: 'macro_default_4',
    name: 'Normal Limits',
    voiceCommand: 'normal limits',
    content: 'within normal limits',
    category: 'General',
    variables: []
  },
  {
    id: 'macro_default_5',
    name: 'No Acute',
    voiceCommand: 'no acute',
    content: 'no acute abnormality',
    category: 'General',
    variables: []
  },
  {
    id: 'macro_default_6',
    name: 'Follow-up Recommended',
    voiceCommand: 'follow up',
    content: 'Follow-up imaging in [TIMEFRAME] is recommended.',
    category: 'General',
    variables: ['TIMEFRAME']
  }
];

// Create writable store
const { subscribe, set, update } = writable(defaultMacros);

// Voice command service class
class VoiceCommandService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.macros = [];
    this.callbacks = {
      command: null,
      error: null
    };
    
    // Only setup speech recognition in browser
    if (browser) {
      this.setupSpeechRecognition();
    }
  }
  
  setupSpeechRecognition() {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }
    
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    
    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      console.log('Voice transcript:', transcript);
      
      this.processCommand(transcript);
    };
    
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      if (this.callbacks.error) {
        this.callbacks.error(event.error);
      }
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
    };
  }
  
  processCommand(transcript) {
    // Check for macro commands
    const macro = this.findMacroByVoiceCommand(transcript);
    if (macro) {
      if (this.callbacks.command) {
        this.callbacks.command({
          type: 'macro',
          transcript,
          macro
        });
      }
      return;
    }
    
    // Check for navigation commands
    if (transcript.includes('go to') || transcript.includes('switch to')) {
      const section = this.extractSection(transcript);
      if (section) {
        if (this.callbacks.command) {
          this.callbacks.command({
            type: 'navigation',
            transcript,
            section
          });
        }
        return;
      }
    }
    
    // Check for action commands
    if (transcript.includes('save report') || transcript === 'save') {
      if (this.callbacks.command) {
        this.callbacks.command({
          type: 'action',
          transcript,
          action: 'save'
        });
      }
      return;
    }
    
    if (transcript.includes('clear section') || transcript === 'clear') {
      if (this.callbacks.command) {
        this.callbacks.command({
          type: 'action',
          transcript,
          action: 'clear'
        });
      }
      return;
    }
    
    // If no specific command matches, treat as dictation
    if (this.callbacks.command) {
      this.callbacks.command({
        type: 'dictation',
        transcript,
        text: transcript
      });
    }
  }
  
  findMacroByVoiceCommand(transcript) {
    return this.macros.find(macro => 
      transcript.includes(macro.voiceCommand.toLowerCase())
    );
  }
  
  extractSection(transcript) {
    const sections = ['comparison', 'technique', 'findings', 'impression'];
    for (const section of sections) {
      if (transcript.includes(section)) {
        return section;
      }
    }
    return null;
  }
  
  updateMacros(macros) {
    this.macros = macros;
  }
  
  startListening() {
    if (!this.recognition) {
      console.warn('Speech recognition not available');
      return false;
    }
    
    if (this.isListening) {
      return false;
    }
    
    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      return false;
    }
  }
  
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
  
  isSupported() {
    return !!this.recognition;
  }
  
  onCommand(callback) {
    this.callbacks.command = callback;
  }
  
  onError(callback) {
    this.callbacks.error = callback;
  }
}

// Create voice command service instance
export const voiceCommandService = new VoiceCommandService();

// Macro store functions
export const macroStore = {
  subscribe,
  
  // Initialize the store with default macros and load custom ones
  init() {
    let customMacros = this.loadFromStorage();
    
    // Migration: Strip "macro " prefix from voice commands (for backward compatibility)
    customMacros = customMacros.map(macro => {
      if (macro.voiceCommand && macro.voiceCommand.toLowerCase().startsWith('macro ')) {
        return {
          ...macro,
          voiceCommand: macro.voiceCommand.replace(/^macro\s+/i, '')
        };
      }
      return macro;
    });
    
    // Save migrated macros back to storage
    if (customMacros.length > 0) {
      this.saveToStorage(customMacros);
    }
    
    const allMacros = [...defaultMacros, ...customMacros];
    set(allMacros);
    voiceCommandService.updateMacros(allMacros);
    return allMacros;
  },
  
  // Add a new macro
  addMacro(macro) {
    const newMacro = {
      ...macro,
      id: macro.id || `macro_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    console.log('📝 Adding new macro:', newMacro);
    
    update(macros => {
      const updated = [...macros, newMacro];
      console.log('✅ Updated macros count:', updated.length);
      console.log('✅ New macro in list:', updated.some(m => m.id === newMacro.id));
      voiceCommandService.updateMacros(updated);
      this.saveToStorage(updated.filter(m => !m.id.startsWith('macro_default_')));
      return updated;
    });
    
    return newMacro;
  },
  
  // Update an existing macro
  updateMacro(macroId, updates) {
    update(macros => {
      const updated = macros.map(macro => 
        macro.id === macroId 
          ? { ...macro, ...updates, modifiedAt: new Date().toISOString() }
          : macro
      );
      voiceCommandService.updateMacros(updated);
      this.saveToStorage(updated.filter(m => !m.id.startsWith('macro_default_')));
      return updated;
    });
  },
  
  // Delete a macro
  deleteMacro(macroId) {
    // Don't allow deletion of default macros
    if (macroId.startsWith('macro_default_')) {
      console.warn('Cannot delete default macros');
      return false;
    }
    
    update(macros => {
      const updated = macros.filter(macro => macro.id !== macroId);
      voiceCommandService.updateMacros(updated);
      this.saveToStorage(updated.filter(m => !m.id.startsWith('macro_default_')));
      return updated;
    });
    
    return true;
  },
  
  // Get macro by ID
  getMacro(macroId) {
    let foundMacro = null;
    this.subscribe(macros => {
      foundMacro = macros.find(macro => macro.id === macroId);
    })();
    return foundMacro;
  },
  
  // Get macros by category
  getMacrosByCategory(category) {
    let categoryMacros = [];
    this.subscribe(macros => {
      categoryMacros = macros.filter(macro => macro.category === category);
    })();
    return categoryMacros;
  },
  
  // Process macro content with variables
  processContent(content, variables = {}) {
    let processedContent = content;
    
    // Replace variables in the format [VARIABLE_NAME]
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\[${key}\\]`, 'g');
      processedContent = processedContent.replace(regex, variables[key]);
    });
    
    return processedContent;
  },
  
  // Search macros
  searchMacros(query) {
    let results = [];
    this.subscribe(macros => {
      const lowerQuery = query.toLowerCase();
      results = macros.filter(macro => 
        macro.name.toLowerCase().includes(lowerQuery) ||
        macro.voiceCommand.toLowerCase().includes(lowerQuery) ||
        macro.content.toLowerCase().includes(lowerQuery) ||
        macro.category.toLowerCase().includes(lowerQuery)
      );
    })();
    return results;
  },
  
  // Get all categories
  getCategories() {
    let categories = [];
    this.subscribe(macros => {
      categories = [...new Set(macros.map(macro => macro.category))].sort();
    })();
    return categories;
  },
  
  // Save custom macros to localStorage
  saveToStorage(customMacros) {
    if (typeof window === 'undefined') return;
    
    try {
      userStorageService.setItem('krispoint_custom_macros', JSON.stringify(customMacros));
      console.log('Macros saved to localStorage');
    } catch (error) {
      console.error('Error saving macros to localStorage:', error);
    }
  },
  
  // Load custom macros from localStorage
  loadFromStorage() {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = userStorageService.getItem('krispoint_custom_macros');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading macros from localStorage:', error);
      return [];
    }
  },
  
  // Export all macros
  exportMacros() {
    let allMacros = [];
    this.subscribe(macros => {
      allMacros = macros;
    })();
    
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      macros: allMacros
    };
    
    return JSON.stringify(exportData, null, 2);
  },
  
  // Import macros
  importMacros(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.macros || !Array.isArray(data.macros)) {
        throw new Error('Invalid macro data format');
      }
      
      const importedMacros = data.macros.map(macro => ({
        ...macro,
        id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        importedAt: new Date().toISOString()
      }));
      
      update(macros => {
        const updated = [...macros, ...importedMacros];
        voiceCommandService.updateMacros(updated);
        this.saveToStorage(updated.filter(m => !m.id.startsWith('macro_default_')));
        return updated;
      });
      
      return importedMacros.length;
    } catch (error) {
      console.error('Error importing macros:', error);
      throw error;
    }
  },
  
  // Reset to default macros
  resetToDefaults() {
    set(defaultMacros);
    voiceCommandService.updateMacros(defaultMacros);
    
    if (typeof window !== 'undefined') {
      userStorageService.removeItem('krispoint_custom_macros');
    }
  }
};