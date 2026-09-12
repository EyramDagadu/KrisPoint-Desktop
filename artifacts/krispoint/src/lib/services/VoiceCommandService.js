// src/lib/services/VoiceCommandService.js
import { get } from 'svelte/store';
import { reportData, uiState, reportActions, uiActions } from '../stores/reportStore.js';
import { browser } from '$app/environment';
import { userStorageService } from './UserStorageService.js';

class VoiceCommandService {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isSupported = false;
        this.callbacks = {
            onResult: null,
            onError: null,
            onStart: null,
            onEnd: null
        };
        
        this.voiceCommandPool = 'system';
        this.cachedTemplates = [];
        this.cachedMacros = [];
        this.cacheLoaded = false;

        // ONLY initialize in browser environment
        if (browser) {
            this.initializeRecognition();
            this.setupCommands();
            this.loadVoiceCommandCache();
        } else {
            console.log('VoiceCommandService: Skipping initialization on server');
        }
    }
    
    async loadVoiceCommandCache() {
        try {
            const settingsRes = await fetch('/api/user-settings', {
                credentials: 'include'
            });
            
            if (settingsRes.ok) {
                const settingsData = await settingsRes.json();
                if (settingsData.success && settingsData.settings) {
                    this.voiceCommandPool = settingsData.settings.voiceCommandPool || 'system';
                }
            }
            
            const [templatesRes, macrosRes] = await Promise.all([
                fetch(`/api/templates?scope=${this.voiceCommandPool}`, {
                    credentials: 'include'
                }),
                fetch(`/api/macros?scope=${this.voiceCommandPool}`, {
                    credentials: 'include'
                })
            ]);
            
            if (templatesRes.ok) {
                const data = await templatesRes.json();
                if (data.success) {
                    this.cachedTemplates = (data.templates || []).filter(t => t.voiceCommand);
                }
            }
            
            if (macrosRes.ok) {
                const data = await macrosRes.json();
                if (data.success) {
                    this.cachedMacros = (data.macros || []).filter(m => m.voiceCommand);
                }
            }
            
            this.cacheLoaded = true;
            console.log(`Voice commands loaded from ${this.voiceCommandPool} pool: ${this.cachedTemplates.length} templates, ${this.cachedMacros.length} macros`);
        } catch (error) {
            console.error('Error loading voice command cache:', error);
        }
    }
    
    async refreshVoiceCommandCache() {
        this.cacheLoaded = false;
        await this.loadVoiceCommandCache();
    }

    initializeRecognition() {
        // Check if we're in browser
        if (!browser) return;
        
        // Check if browser supports speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported');
            this.isSupported = false;
            return;
        }

        this.isSupported = true;
        this.recognition = new SpeechRecognition();
        
        // Configure recognition settings
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        // Set up event handlers
        this.recognition.onstart = () => {
            this.isListening = true;
            console.log('Voice recognition started');
            if (this.callbacks.onStart) this.callbacks.onStart();
        };

        this.recognition.onend = () => {
            this.isListening = false;
            console.log('Voice recognition ended');
            if (this.callbacks.onEnd) this.callbacks.onEnd();
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.trim();
            console.log('Voice command received:', transcript);
            
            this.processCommand(transcript);
            if (this.callbacks.onResult) this.callbacks.onResult(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            if (this.callbacks.onError) this.callbacks.onError(event.error);
        };
    }

    setupCommands() {
        // Define command patterns and their actions
        this.commandPatterns = [
            // Navigation commands
            {
                pattern: /go to (comparison|technique|findings|impression)/i,
                action: (matches) => {
                    const section = matches[1].toLowerCase();
                    uiActions.setCurrentSection(section);
                    this.speakFeedback(`Navigating to ${section} section`);
                }
            },
            {
                pattern: /next section/i,
                action: () => {
                    const sections = ['comparison', 'technique', 'findings', 'impression'];
                    const currentSection = get(uiActions.getCurrentSection()) || 'comparison';
                    const currentIndex = sections.indexOf(currentSection);
                    const nextIndex = (currentIndex + 1) % sections.length;
                    uiActions.setCurrentSection(sections[nextIndex]);
                    this.speakFeedback(`Moving to ${sections[nextIndex]} section`);
                }
            },

            // Template commands
            {
                pattern: /template (.*)/i,
                action: (matches) => {
                    const templateName = matches[1].toLowerCase();
                    this.loadTemplate(templateName);
                }
            },

            // Macro commands
            {
                pattern: /macro (.*)/i,
                action: (matches) => {
                    const macroName = matches[1].toLowerCase();
                    this.insertMacro(macroName);
                }
            },

            // Formatting commands
            {
                pattern: /(start bullet|bullet point|new bullet)/i,
                action: () => {
                    this.insertText('\n• ');
                    this.speakFeedback('Bullet point created');
                }
            },
            {
                pattern: /(start numbering|numbered list)/i,
                action: () => {
                    this.insertText('\n1. ');
                    this.speakFeedback('Numbered list started');
                }
            },
            {
                pattern: /next line/i,
                action: () => {
                    this.insertText('\n');
                }
            },
            {
                pattern: /new paragraph/i,
                action: () => {
                    this.insertText('\n\n');
                }
            },

            // Common phrases
            {
                pattern: /clinical correlation/i,
                action: () => {
                    this.insertText('Clinical correlation is recommended. ');
                    this.speakFeedback('Clinical correlation phrase inserted');
                }
            },
            {
                pattern: /normal limits/i,
                action: () => {
                    this.insertText('within normal limits ');
                }
            },
            {
                pattern: /no acute/i,
                action: () => {
                    this.insertText('No acute ');
                }
            },

            // Report actions
            {
                pattern: /(save draft|save report)/i,
                action: () => {
                    this.saveReport();
                    this.speakFeedback('Report saved as draft');
                }
            },
            {
                pattern: /clear section/i,
                action: () => {
                    const currentSection = get(uiActions.getCurrentSection()) || 'comparison';
                    reportActions.updateSection(currentSection, '');
                    this.speakFeedback(`${currentSection} section cleared`);
                }
            },

            // Dictation mode
            {
                pattern: /dictate (.*)/i,
                action: (matches) => {
                    const text = matches[1];
                    this.insertText(text + ' ');
                }
            }
        ];
    }

    processCommand(transcript) {
        const command = transcript.toLowerCase().trim();
        
        // Find matching command pattern
        for (const commandPattern of this.commandPatterns) {
            const matches = command.match(commandPattern.pattern);
            if (matches) {
                try {
                    commandPattern.action(matches);
                    return;
                } catch (error) {
                    console.error('Error executing command:', error);
                    this.speakFeedback('Sorry, there was an error with that command');
                }
            }
        }

        // If no specific command matches, treat as dictation
        if (command.length > 0) {
            this.insertText(transcript + ' ');
        }
    }

    insertMacro(macroName) {
        const normalizedName = macroName.toLowerCase().trim();
        
        const macro = this.cachedMacros.find(m => 
            m.voiceCommand && m.voiceCommand.toLowerCase() === normalizedName
        );
        
        if (macro && macro.content) {
            this.insertText(macro.content + ' ');
            this.speakFeedback(`${macro.name} macro inserted`);
        } else {
            const fallbackMacros = {
                'normal lungs': 'The lungs are clear bilaterally without focal consolidation, pneumothorax, or pleural effusion.',
                'normal heart': 'The heart size is normal. No pericardial effusion.',
                'normal abdomen': 'The liver, spleen, pancreas, and kidneys appear normal in size and attenuation.',
                'normal brain': 'No acute intracranial abnormality. Brain parenchyma appears normal.',
                'normal chest': 'Heart size is normal. Lungs are clear. No pleural effusion or pneumothorax.',
                'no fracture': 'No acute fracture or dislocation identified.',
                'unremarkable': 'The examination is unremarkable.',
                'recommend follow up': 'Recommend clinical correlation and follow-up as clinically indicated.',
                'comparison': 'Compared to prior study dated '
            };
            
            const fallbackText = fallbackMacros[normalizedName];
            if (fallbackText) {
                this.insertText(fallbackText + ' ');
                this.speakFeedback(`${macroName} macro inserted`);
            } else {
                this.speakFeedback(`Macro ${macroName} not found`);
            }
        }
    }

    loadTemplate(templateName) {
        console.log('Loading template with voice command:', templateName);
        const normalizedName = templateName.toLowerCase().trim();
        
        const template = this.cachedTemplates.find(t => 
            t.voiceCommand && t.voiceCommand.toLowerCase() === normalizedName
        );
        
        console.log('Template found:', template);
        
        if (template && template.content) {
            console.log('Loading template content');
            const currentSection = get(uiActions.getCurrentSection()) || 'findings';
            reportActions.updateSection(currentSection, template.content);
            this.speakFeedback(`${template.name} template loaded`);
        } else {
            console.log('Template not found for voice command:', templateName);
            this.speakFeedback(`Template ${templateName} not found`);
        }
    }
    insertText(text) {
        // Only run in browser
        if (!browser) return;
        
        const currentSection = get(uiActions.getCurrentSection()) || 'comparison';
        const currentContent = get(reportActions.getSection(currentSection)) || '';
        reportActions.updateSection(currentSection, currentContent + text);
    }

    saveReport() {
        // Only run in browser
        if (!browser) return;
        
        // Save to localStorage for now
        const reportData = get(reportActions.getFullReport());
        const timestamp = new Date().toISOString();
        
        userStorageService.setItem('krispoint_current_report', JSON.stringify({
            ...reportData,
            savedAt: timestamp
        }));

        console.log('Report saved to localStorage');
    }

    speakFeedback(text) {
        // Only run in browser
        if (!browser) return;
        
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.volume = 0.5;
            utterance.rate = 1.2;
            utterance.pitch = 1;
            speechSynthesis.speak(utterance);
        }
    }

    // Public methods for controlling recognition
    startListening() {
        if (!browser) return false;
        if (!this.isSupported) {
            console.warn('Speech recognition not supported');
            return false;
        }

        if (!this.isListening) {
            this.recognition.start();
        }
        return true;
    }

    stopListening() {
        if (!browser) return;
        if (this.isListening && this.recognition) {
            this.recognition.stop();
        }
    }

    toggleListening() {
        if (!browser) return false;
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
        return this.isListening;
    }

    // Method to set callbacks
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    // Check if voice recognition is supported
    isVoiceSupported() {
        return this.isSupported;
    }

    // Get current listening status
    getListeningStatus() {
        return this.isListening;
    }
}

// Create and export singleton instance
export const voiceCommandService = new VoiceCommandService();