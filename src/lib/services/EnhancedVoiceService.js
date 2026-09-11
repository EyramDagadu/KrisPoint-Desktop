// Enhanced Voice Recognition Service for Medical Radiology Reporting
import { get } from 'svelte/store';
import { reportActions, uiActions, reportData, uiState } from '../stores/reportStore.js';
import { macroStore } from '../stores/macroStore.js';
import { medicalTermsProcessor } from '../services/MedicalTermsProcessor.js';
import { whisperVoiceService } from '../services/WhisperVoiceService';
import { browser } from '$app/environment';

// Helper function to get the currently active TipTap editor
// Checks for addendum editor first (if open), then main editor
function getActiveEditor() {
    // Check if addendum workspace is visible/open
    const addendumWorkspace = document.querySelector('.addendum-workspace');
    const isAddendumOpen = addendumWorkspace && addendumWorkspace.offsetParent !== null;
    
    // If addendum workspace is open and editor exists, use it
    if (isAddendumOpen && window.addendumTiptapEditor && !window.addendumTiptapEditor.isDestroyed) {
        console.log('🎤 Using addendum editor for voice input');
        return window.addendumTiptapEditor;
    }
    
    // Otherwise use main editor
    if (window.tiptapEditor && !window.tiptapEditor.isDestroyed) {
        console.log('🎤 Using main TipTap editor for voice input');
        return window.tiptapEditor;
    }
    
    return null;
}

export class EnhancedVoiceService {
    constructor() {
        this.isListening = false;
        this.isPaused = false;
        this.errorCount = 0;
        this.maxErrors = 3;
        this.confidenceThreshold = 0.7;
        this.lastCommand = null;
        this.retryAttempts = 0;
        this.maxRetries = 3;
        this.selectedText = null; // For text selection and deletion commands
        
        // Whisper integration
        this.whisperEnabled = false;
        this.whisperInitialized = false;
        this.useWhisperPrimary = false; // Whether to use Whisper as primary engine
        
        // Deduplication to prevent paragraph compression from duplicate transcriptions
        this.lastTranscription = '';
        this.lastTranscriptionTime = 0;
        this.deduplicationWindow = 1500; // ms - reject same text within this window
        
        this.callbacks = {
            onResult: null,
            onError: null,
            onStart: null,
            onEnd: null,
            onStatusChange: null,
            onCommandExecuted: null
        };

        // Medical terminology for better recognition accuracy
        this.medicalTerms = new Set([
            'pneumothorax', 'consolidation', 'atelectasis', 'effusion', 'hemorrhage',
            'infarction', 'ischemia', 'edema', 'mass', 'lesion', 'nodule', 'opacity',
            'infiltrate', 'pleural', 'pericardial', 'cardiac', 'pulmonary', 'hepatic',
            'renal', 'splenic', 'pancreatic', 'biliary', 'osseous', 'fracture',
            'dislocation', 'stenosis', 'dilatation', 'thrombosis', 'embolism',
            'radiology', 'radiologist', 'examination', 'findings', 'impression',
            'comparison', 'technique', 'contrast', 'without', 'within', 'normal',
            'abnormal', 'acute', 'chronic', 'bilateral', 'unilateral', 'anterior',
            'posterior', 'superior', 'inferior', 'medial', 'lateral'
        ]);

        // Enhanced medical commands with context awareness
        this.commandPatterns = [];

        // Initialize only in browser - OFFLINE ONLY for patient security
        if (browser) {
            this.setupEnhancedCommands();
            this.setupWhisperCallbacks();
        }
    }

    // REMOVED: Web Speech API initialization - SECURITY RISK for patient data
    // Only offline Whisper recognition is used to protect patient privacy

    // REMOVED: setupEventHandlers() - All Web Speech API handlers removed for patient security

    // Setup Whisper callbacks for integration with voice service
    setupWhisperCallbacks() {
        if (!whisperVoiceService) return;

        // Set up Whisper callbacks to integrate with existing voice service
        whisperVoiceService.setCallback('onResult', (result) => {
            // Accept transcription if text exists (backend doesn't always send isFinal flag)
            if (result && result.text) {
                const now = Date.now();
                const normalizedText = result.text.trim().toLowerCase();
                
                // DEDUPLICATION: Reject duplicate transcriptions within time window
                // This prevents paragraph compression from multiple rapid identical insertions
                if (normalizedText === this.lastTranscription.trim().toLowerCase() && 
                    (now - this.lastTranscriptionTime) < this.deduplicationWindow) {
                    console.log('🔄 Duplicate transcription rejected:', result.text);
                    return; // Skip duplicate
                }
                
                // Update deduplication tracking
                this.lastTranscription = result.text;
                this.lastTranscriptionTime = now;
                
                console.log('🎤 Received transcription:', result.text);
                
                // Forward transcription directly to component callback
                // Component will handle command vs dictation logic
                if (this.callbacks.onResult) {
                    console.log('✍️ Forwarding to component callback');
                    this.callbacks.onResult({
                        transcript: result.text,
                        confidence: result.confidence || 0.9,
                        source: 'voice-medical'
                    });
                } else {
                    console.error('❌ Callback not set! Trying direct insertion as fallback...');
                    // Fallback: try to insert text directly
                    this.insertText(result.text + ' ');
                }
            }
        });

        whisperVoiceService.setCallback('onPartialResult', (result) => {
            // Handle partial results for real-time feedback
            console.log('Voice partial result:', result.text);
        });

        whisperVoiceService.setCallback('onError', (error) => {
            console.error('Voice recognition error:', error);
            this.handleError(`Speech recognition error: ${error}`);
        });

        whisperVoiceService.setCallback('onStatusChange', (status) => {
            console.log('Voice recognition status:', status);
            if (status === 'listening') {
                this.isListening = true;
                uiActions.setListening(true);
                this.notifyStatusChange('Voice recognition active');
            } else if (status === 'stopped') {
                this.isListening = false;
                uiActions.setListening(false);
                this.notifyStatusChange('Voice recognition stopped');
            } else if (status === 'disconnected') {
                this.isListening = false;
                this.whisperInitialized = false; // CRITICAL: Reset flag so UI shows disconnected
                uiActions.setListening(false);
                this.notifyStatusChange('Voice connection lost - please reconnect');
            } else if (status === 'initialized' || status === 'reconnected' || status === 'reconnected-listening') {
                // Re-set initialized flag on successful reconnection
                this.whisperInitialized = true;
                this.notifyStatusChange(status === 'reconnected-listening' ? 'Reconnected and listening' : 'Voice ready');
            } else if (status.includes('reconnecting')) {
                // Pass through reconnecting status for UI
                this.notifyStatusChange(status);
            }
        });

        // REMOVED: onCommand callback - was causing double execution
        // Commands are now processed only once in the component's onResult handler
        // This prevents toggle commands (bold/underline) from canceling themselves out
    }

    // Enable/disable voice recognition as primary engine
    setWhisperPrimary(enabled) {
        this.useWhisperPrimary = enabled && this.whisperEnabled;
        console.log(`Voice recognition primary mode: ${this.useWhisperPrimary ? 'enabled' : 'disabled'}`);
        
        if (this.useWhisperPrimary) {
            uiActions.showInfoNotification('Using voice recognition');
        } else {
            uiActions.showInfoNotification('Voice recognition disabled');
        }
    }

    // Check if voice recognition is available for use
    isWhisperAvailable() {
        return whisperVoiceService && whisperVoiceService.isSupported && (this.whisperInitialized || !this.whisperEnabled);
    }

    // Initialize voice recognition - OFFLINE ONLY for patient security
    async initializeWhisper() {
        // Check if voice recognition is supported first (don't gate on whisperEnabled flag)
        if (!whisperVoiceService || !whisperVoiceService.isSupported) {
            console.log('Voice recognition not supported in this environment');
            return false;
        }

        try {
            console.log('Initializing voice recognition...');
            
            // Show loading status to user
            this.notifyStatusChange('Loading voice model... (30-120s)');
            
            // Setup callbacks if not already done
            this.setupWhisperCallbacks();
            
            const initialized = await whisperVoiceService.initialize();
            if (initialized) {
                this.whisperEnabled = true;  // Set flag after successful initialization
                this.whisperInitialized = true;
                console.log('✓ Voice recognition initialized successfully');
                this.notifyStatusChange('Voice model ready!');
                uiActions.showSuccessNotification('Voice recognition ready - click Dictate to start');
                return true;
            }
        } catch (error) {
            console.error('Voice recognition initialization failed:', error);
            this.notifyStatusChange('Connection failed');
            uiActions.showErrorNotification('Voice recognition failed - check server connection');
        }

        console.log('Offline-only mode: no fallback to cloud services for patient security');
        return false;
    }

    setupEnhancedCommands() {
        console.log('🔧 Setting up enhanced commands...');
        this.commandPatterns = [
            // Navigation commands with context awareness - more flexible matching
            {
                pattern: /(?:go to|switch to|move to|navigate to)\s+(comparison|technique|findings?|impression)/i,
                action: (matches) => {
                    let section = matches[1].toLowerCase();
                    // Handle "finding" -> "findings"
                    if (section === 'finding') section = 'findings';
                    
                    console.log(`[VOICE DEBUG] 🎯 Navigation command triggered - moving to section: ${section}`);
                    console.log(`[VOICE DEBUG] Available sections: comparison, technique, findings, impression`);
                    
                    uiActions.setCurrentSection(section);
                    // Use requestAnimationFrame for better timing
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            console.log(`[VOICE DEBUG] 🚀 About to call navigateToSection(${section})`);
                            this.navigateToSection(section);
                        });
                    });
                    this.notifyCommandExecuted(`Navigate to ${section}`);
                },
                description: 'Navigate to report section'
            },
            
            // Smart section navigation
            {
                pattern: /(?:next section|move forward)/i,
                action: () => {
                    const sections = ['comparison', 'technique', 'findings', 'impression'];
                    const currentState = get(uiState);
                    const currentSection = currentState.activeSection || 'comparison';
                    const currentIndex = sections.indexOf(currentSection);
                    const nextSection = sections[(currentIndex + 1) % sections.length];
                    
                    uiActions.setCurrentSection(nextSection);
                    // Navigate cursor to end of last sentence in next section
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            this.navigateToSection(nextSection);
                        });
                    });
                    this.notifyCommandExecuted(`Next section: ${nextSection}`);
                },
                description: 'Move to next section'
            },

            {
                pattern: /(?:previous section|go back)/i,
                action: () => {
                    const sections = ['comparison', 'technique', 'findings', 'impression'];
                    const currentState = get(uiState);
                    const currentSection = currentState.activeSection || 'comparison';
                    const currentIndex = sections.indexOf(currentSection);
                    const prevSection = sections[(currentIndex - 1 + sections.length) % sections.length];
                    
                    uiActions.setCurrentSection(prevSection);
                    // Navigate cursor to end of last sentence in previous section
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            this.navigateToSection(prevSection);
                        });
                    });
                    this.notifyCommandExecuted(`Previous section: ${prevSection}`);
                },
                description: 'Move to previous section'
            },

            // Enhanced macro commands
            {
                pattern: /macro\s+(.+)/i,
                action: async (matches) => {
                    const macroName = matches[1].toLowerCase().trim();
                    await this.insertMacroByName(macroName);
                },
                description: 'Insert macro by name using "macro [name]"'
            },

            // Template loading commands
            {
                pattern: /template\s+(.+)/i,
                action: async (matches) => {
                    const templateName = matches[1].toLowerCase().trim();
                    await this.loadTemplate(templateName);
                },
                description: 'Load medical template by voice command'
            },


            // Formatting commands
            {
                pattern: /(?:new paragraph|paragraph break)/i,
                action: () => {
                    // Use TipTap's proper paragraph insertion at caret position
                    const editor = getActiveEditor();
                    if (editor) {
                        try {
                            // Insert hard breaks at caret position to create new paragraph
                            editor.chain().focus().setHardBreak().setHardBreak().run();
                            this.notifyCommandExecuted('New paragraph');
                            return;
                        } catch (error) {
                            console.warn('TipTap paragraph insertion failed:', error);
                        }
                    }
                    // Fallback: insertText handles caret position
                    this.insertText('\n\n');
                    this.notifyCommandExecuted('New paragraph');
                },
                description: 'Insert paragraph break'
            },

            {
                pattern: /(?:new line|line break)/i,
                action: () => {
                    // Use TipTap's hard break command at caret position
                    const editor = getActiveEditor();
                    if (editor) {
                        try {
                            editor.chain().focus().setHardBreak().run();
                            this.notifyCommandExecuted('New line');
                            return;
                        } catch (error) {
                            console.warn('TipTap line break insertion failed:', error);
                        }
                    }
                    // Fallback: insertText handles caret position
                    this.insertText('\n');
                    this.notifyCommandExecuted('New line');
                },
                description: 'Insert line break'
            },

            {
                pattern: /(?:bullet point|start bullet)/i,
                action: () => {
                    // Use TipTap's bullet list feature at caret position
                    const editor = getActiveEditor();
                    if (editor) {
                        try {
                            editor.chain().focus().toggleBulletList().run();
                            this.notifyCommandExecuted('Bullet point');
                            return;
                        } catch (error) {
                            console.warn('TipTap bullet list failed:', error);
                        }
                    }
                    // Fallback: insertText handles caret position
                    this.insertText('\n• ');
                    this.notifyCommandExecuted('Bullet point');
                },
                description: 'Insert bullet point'
            },

            // ===== PUNCTUATION COMMANDS =====
            // HYBRID APPROACH: Whisper auto-handles periods (.) and commas (,) naturally
            // Manual commands for special punctuation: ?, !, :, ;, quotes, brackets
            // These commands automatically strip trailing auto-punctuation before inserting
            
            {
                pattern: /(?:question\s+mark)\s*$/i,
                action: () => {
                    this.stripTrailingPunctuation();  // Remove Whisper's auto punctuation
                    this.insertPunctuation('?');
                    this.notifyCommandExecuted('Question mark');
                },
                description: 'Insert question mark'
            },

            {
                pattern: /(?:exclamation\s+mark|exclamation\s+point)\s*$/i,
                action: () => {
                    this.stripTrailingPunctuation();  // Remove Whisper's auto punctuation
                    this.insertPunctuation('!');
                    this.notifyCommandExecuted('Exclamation mark');
                },
                description: 'Insert exclamation mark'
            },

            {
                pattern: /(?:insert colon|punctuation colon)\s*$/i,
                action: () => {
                    this.stripTrailingPunctuation();  // Remove Whisper's auto punctuation
                    this.insertPunctuation(':');
                    this.notifyCommandExecuted('Colon');
                },
                description: 'Insert colon (use "insert colon" to avoid anatomical "colon")'
            },

            {
                pattern: /semicolon\s*$/i,
                action: () => {
                    this.stripTrailingPunctuation();  // Remove Whisper's auto punctuation
                    this.insertPunctuation(';');
                    this.notifyCommandExecuted('Semicolon');
                },
                description: 'Insert semicolon'
            },

            {
                pattern: /open quote/i,
                action: (matches, isStandalone) => {
                    this.insertText('"');
                    this.notifyCommandExecuted('Open quote');
                },
                description: 'Insert opening quote'
            },

            {
                pattern: /close quote/i,
                action: (matches, isStandalone) => {
                    this.insertText(isStandalone ? '"' : '" ');
                    this.notifyCommandExecuted('Close quote');
                },
                description: 'Insert closing quote'
            },

            {
                pattern: /open brackets/i,
                action: () => {
                    this.insertText('(');
                    this.notifyCommandExecuted('Open brackets');
                },
                description: 'Insert opening brackets'
            },

            {
                pattern: /close brackets/i,
                action: () => {
                    this.insertText(') ');
                    this.notifyCommandExecuted('Close brackets');
                },
                description: 'Insert closing brackets'
            },

            // ===== ENHANCED FORMATTING COMMANDS =====
            {
                pattern: /(?:bold that|make that bold)/i,
                action: () => {
                    this.formatTextOrPhrase('bold');
                    this.notifyCommandExecuted('Bold text');
                },
                description: 'Bold selected text or last phrase'
            },

            {
                pattern: /(?:italicize that|make that italic)/i,
                action: () => {
                    this.formatTextOrPhrase('italic');
                    this.notifyCommandExecuted('Italicize text');
                },
                description: 'Italicize selected text or last phrase'
            },

            {
                pattern: /(?:underline that|make that underlined)/i,
                action: () => {
                    this.formatTextOrPhrase('underline');
                    this.notifyCommandExecuted('Underline text');
                },
                description: 'Underline selected text or last phrase'
            },

            // ===== EDITING & NAVIGATION COMMANDS =====
            {
                pattern: /(?:delete that|remove that)/i,
                action: () => {
                    // Delete highlighted text only (not last phrase)
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount > 0 && selection.toString().trim()) {
                        // Use TipTap's deleteSelection for proper formatting preservation
                        const editor = getActiveEditor();
                        if (editor) {
                            try {
                                editor.chain().focus().deleteSelection().run();
                                uiActions.showInfoNotification('Deleted highlighted text');
                                this.notifyCommandExecuted('Delete highlighted text');
                            } catch (error) {
                                console.error('TipTap delete failed:', error);
                                // Fallback to execCommand
                                document.execCommand('delete');
                                uiActions.showInfoNotification('Deleted highlighted text');
                                this.notifyCommandExecuted('Delete highlighted text');
                            }
                        } else {
                            // Fallback for legacy editor
                            document.execCommand('delete');
                            uiActions.showInfoNotification('Deleted highlighted text');
                            this.notifyCommandExecuted('Delete highlighted text');
                        }
                    } else {
                        uiActions.showErrorNotification('No text highlighted. Please highlight text first.');
                    }
                },
                description: 'Delete highlighted text'
            },

            {
                pattern: /(?:go to start|beginning of document)/i,
                action: () => {
                    this.goToDocumentStart();
                    this.notifyCommandExecuted('Go to document start');
                },
                description: 'Go to start of document'
            },

            {
                pattern: /(?:go to end|end of document)/i,
                action: () => {
                    this.goToDocumentEnd();
                    this.notifyCommandExecuted('Go to document end');
                },
                description: 'Go to end of document'
            },

            // Report management - Draft save
            {
                pattern: /save draft/i,
                action: () => {
                    reportActions.save();
                    uiActions.showSuccessNotification('Draft saved');
                    this.notifyCommandExecuted('Save report');
                },
                description: 'Save current report as draft'
            },

            // Report management - Finalize
            {
                pattern: /(?:finalize report|finalize)/i,
                action: () => {
                    reportActions.finalizeReport();
                    uiActions.showSuccessNotification('Report finalized');
                },
                description: 'Finalize and save report'
            },

            {
                pattern: /(?:clear section|delete section)/i,
                action: () => {
                    const currentState = get(uiState);
                    const activeSection = currentState.activeSection || 'findings';
                    
                    console.log(`🗑️ Clearing section: ${activeSection}`);
                    
                    // Update store to clear the section
                    reportActions.updateSection(activeSection, '');
                    
                    // CRITICAL FIX: Clear TipTap editor content
                    const editor = getActiveEditor();
                    if (editor) {
                        try {
                            editor.chain()
                                .focus()
                                .clearContent()
                                .run();
                            console.log('✅ Section cleared in editor');
                        } catch (error) {
                            console.error('Failed to clear editor:', error);
                        }
                    }
                    
                    uiActions.showInfoNotification(`${activeSection} section cleared`);
                    this.notifyCommandExecuted(`Clear ${activeSection}`);
                },
                description: 'Clear current section'
            },

            // Voice control commands
            {
                pattern: /(?:stop listening|pause|stop dictation)/i,
                action: () => {
                    this.stopListening();
                    uiActions.showInfoNotification('Voice recognition paused');
                    this.notifyCommandExecuted('Stop listening');
                },
                description: 'Stop voice recognition'
            }
        ];
        console.log(`✅ Enhanced commands setup complete: ${this.commandPatterns.length} patterns registered`);
    }

    processCommand(transcript, confidence = 1.0) {
        // Strip trailing punctuation that Whisper auto-adds (. , ! ?)
        let command = transcript.toLowerCase().trim();
        command = command.replace(/[.,!?]+$/, '');
        
        this.lastCommand = { text: transcript, confidence, timestamp: new Date() };

        console.log(`🔍 Processing command: "${transcript}" → cleaned: "${command}"`);
        console.log(`📊 Total command patterns available: ${this.commandPatterns.length}`);

        // Try to match command patterns
        for (let i = 0; i < this.commandPatterns.length; i++) {
            const commandPattern = this.commandPatterns[i];
            const matches = command.match(commandPattern.pattern);
            
            if (matches) {
                console.log(`✅ MATCHED: ${commandPattern.description}`);
                console.log(`🎯 Pattern: ${commandPattern.pattern}`);
                console.log(`🎯 Executing action...`);
                try {
                    // Execute command action
                    commandPattern.action(matches);
                    console.log(`✅ Action executed successfully!`);
                    return true;
                } catch (error) {
                    console.error('❌ Voice command execution error:', error);
                    console.error('Error stack:', error.stack);
                    uiActions.showErrorNotification('Sorry, there was an error with that command');
                    return false;
                }
            }
        }

        console.log(`❌ No command pattern matched for: "${command}"`);
        // No command pattern matched - return false so caller can handle as dictation
        return false;
    }
    
    stripTrailingPunctuation() {
        // Remove trailing auto-punctuation (. , ! ? ; :) before inserting manual punctuation
        if (!browser) return;
        
        // Try to use TipTap editor if available
        if (window.tiptapEditor) {
            try {
                const text = window.tiptapEditor.getText();
                const lastChar = text[text.length - 1];
                
                if (/[.,!?;:]/.test(lastChar)) {
                    // Use TipTap's deleteRange to remove last character safely
                    const { from, to } = window.tiptapEditor.state.selection;
                    window.tiptapEditor.chain()
                        .focus()
                        .command(({ tr }) => {
                            // Delete the last character from the document
                            const docSize = tr.doc.content.size;
                            if (docSize > 2) {
                                tr.delete(docSize - 2, docSize - 1);
                            }
                            return true;
                        })
                        .run();
                    console.log(`✂️ Removed trailing punctuation: "${lastChar}"`);
                }
                return;
            } catch (error) {
                console.error('TipTap punctuation strip error:', error);
            }
        }
        
        // Fallback: use Selection API (safer than textContent)
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        
        const range = sel.getRangeAt(0);
        const editor = range.commonAncestorContainer;
        
        // Get text content to check last character
        const text = (editor.textContent || '').trim();
        if (text.length === 0) return;
        
        const lastChar = text[text.length - 1];
        if (/[.,!?;:]/.test(lastChar)) {
            // Move selection to before last character and delete it
            try {
                const newRange = document.createRange();
                newRange.setStart(editor, editor.textContent.length - 1);
                newRange.setEnd(editor, editor.textContent.length);
                newRange.deleteContents();
                console.log(`✂️ Removed trailing punctuation: "${lastChar}"`);
            } catch (error) {
                console.warn('Could not remove trailing punctuation:', error);
            }
        }
    }

    // Insert punctuation at caret position with NO extra spaces
    insertPunctuation(punctuationMark) {
        if (!browser) return;

        // First try TipTap editor (preferred)
        if (window.tiptapEditor) {
            try {
                // Insert punctuation directly at cursor position with no spaces
                window.tiptapEditor.chain().focus().insertContent(punctuationMark).run();
                console.log(`✅ Inserted punctuation "${punctuationMark}" at caret`);
                return;
            } catch (error) {
                console.warn('TipTap punctuation insertion failed, falling back:', error);
            }
        }

        // Fallback: use Selection API to insert at caret
        const editor = document.querySelector('[contenteditable="true"]');
        if (editor) {
            try {
                editor.focus();
                const selection = window.getSelection();
                let range;

                // Create a range if none exists
                if (selection.rangeCount === 0) {
                    range = document.createRange();
                    range.setStart(editor, 0);
                    range.setEnd(editor, 0);
                    selection.addRange(range);
                } else {
                    range = selection.getRangeAt(0);
                }

                // Delete any selected content first
                range.deleteContents();
                
                // Create text node with ONLY the punctuation mark (no spaces)
                const textNode = document.createTextNode(punctuationMark);
                range.insertNode(textNode);
                
                // Move cursor to after the inserted punctuation
                range.setStartAfter(textNode);
                range.setEndAfter(textNode);
                selection.removeAllRanges();
                selection.addRange(range);
                
                // Trigger input event to sync with store
                const event = new Event('input', { bubbles: true });
                editor.dispatchEvent(event);
                
                console.log(`✅ Inserted punctuation "${punctuationMark}" at caret (fallback)`);
                return;
            } catch (error) {
                console.error('Failed to insert punctuation at caret:', error);
            }
        }

        // Last resort fallback: append to current section content
        const currentState = get(uiState);
        const currentData = get(reportData);
        
        if (currentData.content !== undefined) {
            const currentContent = currentData.content || '';
            reportActions.updateContent(currentContent + punctuationMark);
        } else {
            const activeSection = currentState.activeSection || 'comparison';
            const sections = ['comparison', 'technique', 'findings', 'impression'];
            if (sections.includes(activeSection)) {
                const currentContent = currentData[activeSection] || '';
                reportActions.updateSection(activeSection, currentContent + punctuationMark);
            }
        }
    }

    async insertMacroByName(macroName) {
        const searchTerm = macroName.toLowerCase().trim();
        console.log(`🔍 Searching for macro with voice command: "${searchTerm}"`);
        
        // Get user's macro scope preference
        let macroScope = 'system';
        try {
            const settingsResponse = await fetch('/api/user-settings', {
                credentials: 'include'
            });
            if (settingsResponse.ok) {
                const settingsData = await settingsResponse.json();
                macroScope = settingsData.settings?.macroScope || 'system';
            }
        } catch (error) {
            console.warn('Failed to fetch user settings, using system scope:', error);
        }
        
        console.log(`📂 Using macro scope: ${macroScope}`);
        
        // First, check macroStore (which includes locally loaded macros from the selected scope)
        const macros = get(macroStore);
        const storeMacro = macros.find(m => 
            m.name.toLowerCase().includes(searchTerm) ||
            m.voiceCommand?.toLowerCase().includes(searchTerm) ||
            (m.voiceCommand && searchTerm.includes(m.voiceCommand.toLowerCase()))
        );

        if (storeMacro) {
            this.insertText(storeMacro.content + ' ');
            uiActions.showSuccessNotification(`${storeMacro.name} macro inserted`);
            this.notifyCommandExecuted(`Macro: ${storeMacro.name}`);
            return;
        }
        
        // Fetch macros from the selected scope
        try {
            const response = await fetch(`/api/macros?scope=${macroScope}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.macros) {
                    const dbMacro = data.macros.find(m => 
                        m.voiceCommand && (
                            m.voiceCommand.toLowerCase() === searchTerm ||
                            m.voiceCommand.toLowerCase().includes(searchTerm) ||
                            searchTerm.includes(m.voiceCommand.toLowerCase())
                        )
                    );
                    
                    if (dbMacro) {
                        console.log(`📋 Found ${macroScope} macro: ${dbMacro.name}`);
                        this.insertText(dbMacro.content + ' ');
                        uiActions.showSuccessNotification(`${dbMacro.name} macro inserted`);
                        this.notifyCommandExecuted(`Macro: ${dbMacro.name}`);
                        return;
                    }
                }
            }
        } catch (error) {
            console.warn(`Failed to fetch ${macroScope} macros:`, error);
        }
        
        uiActions.showErrorNotification(`Macro "${macroName}" not found in ${macroScope} pool`);
    }

    async loadTemplate(templateName) {
        const searchTerm = templateName.toLowerCase().trim();
        console.log(`🔍 Searching for template with voice command: "${searchTerm}"`);
        
        // Get user's template scope preference
        let templateScope = 'system';
        try {
            const settingsResponse = await fetch('/api/user-settings', {
                credentials: 'include'
            });
            if (settingsResponse.ok) {
                const settingsData = await settingsResponse.json();
                templateScope = settingsData.settings?.templateScope || 'system';
            }
        } catch (error) {
            console.warn('Failed to fetch user settings, using system scope:', error);
        }
        
        console.log(`📂 Using template scope: ${templateScope}`);
        
        // Fetch templates from the selected scope
        try {
            const response = await fetch(`/api/templates?scope=${templateScope}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.templates) {
                    // Find template by voice command (partial match for flexibility)
                    const dbTemplate = data.templates.find(t => 
                        t.voiceCommand && (
                            t.voiceCommand.toLowerCase() === searchTerm ||
                            t.voiceCommand.toLowerCase().includes(searchTerm) ||
                            searchTerm.includes(t.voiceCommand.toLowerCase())
                        )
                    );
                    
                    if (dbTemplate) {
                        console.log(`📋 Found ${templateScope} template: ${dbTemplate.name}`);
                        this.insertDatabaseTemplate(dbTemplate);
                        return;
                    }
                }
            }
        } catch (error) {
            console.warn(`Failed to fetch ${templateScope} templates:`, error);
        }
        
        // No template found - all templates are now in the database
        uiActions.showErrorNotification(`Template "${templateName}" not found in ${templateScope} pool`);
    }
    
    insertDatabaseTemplate(dbTemplate) {
        // Database templates store content directly
        const content = dbTemplate.content || '';
        
        if (window.tiptapEditor) {
            try {
                window.tiptapEditor.chain()
                    .focus()
                    .clearContent()
                    .insertContent(content)
                    .run();
                console.log('✅ Database template loaded into editor');
            } catch (error) {
                console.error('Failed to insert template into editor:', error);
            }
        }
        
        uiActions.showSuccessNotification(`${dbTemplate.name} template loaded`);
        this.notifyCommandExecuted(`Template: ${dbTemplate.name}`);
    }
    
    applySmartCapitalization(text) {
        if (!text || text.length === 0) return text;
        
        // Get the current editor content to check context
        let previousContent = '';
        
        // Try to get content from TipTap
        if (window.tiptapEditor) {
            try {
                previousContent = window.tiptapEditor.getText();
            } catch (error) {
                // Fallback to other methods
            }
        }
        
        // If TipTap didn't work, try contenteditable
        if (!previousContent) {
            const editor = document.querySelector('[contenteditable="true"]');
            if (editor) {
                previousContent = editor.textContent || '';
            }
        }
        
        // If still no content, try the store
        if (!previousContent) {
            const currentData = get(reportData);
            if (currentData.content !== undefined) {
                previousContent = currentData.content || '';
            } else {
                const currentState = get(uiState);
                const activeSection = currentState.activeSection || 'findings';
                previousContent = currentData[activeSection] || '';
            }
        }
        
        // Determine if we need to capitalize
        const shouldCapitalize = this.shouldCapitalizeNext(previousContent);
        
        if (shouldCapitalize) {
            // Capitalize first letter of text
            return text.charAt(0).toUpperCase() + text.slice(1);
        }
        
        return text;
    }
    
    shouldCapitalizeNext(previousContent) {
        // Always capitalize if no previous content (start of document)
        if (!previousContent || previousContent.trim().length === 0) {
            return true;
        }
        
        // Get the last few characters (trim whitespace on the right)
        const trimmed = previousContent.trimEnd();
        
        if (trimmed.length === 0) {
            return true; // Empty content, capitalize
        }
        
        const lastChar = trimmed[trimmed.length - 1];
        
        // Capitalize after sentence-ending punctuation AND colons (NOT commas)
        const sentenceEnders = ['.', '?', '!', ':', '\n'];
        return sentenceEnders.includes(lastChar);
    }

    insertText(text) {
        if (!browser) return;

        // Apply enhanced medical intelligence corrections before inserting
        let enhancedText = medicalTermsProcessor.processText(text);
        
        // Smart capitalization: Auto-capitalize after sentence endings or at start
        enhancedText = this.applySmartCapitalization(enhancedText);

        // First try TipTap editor (preferred) - check both main and addendum editors
        const activeEditor = getActiveEditor();
        if (activeEditor) {
            try {
                activeEditor.chain().focus().insertContent(enhancedText).run();
                return;
            } catch (error) {
                console.warn('TipTap insertion failed, falling back:', error);
            }
        }

        // Then try contenteditable editor (legacy)
        const editor = document.querySelector('[contenteditable="true"]');
        
        if (editor) {
            // Focus the editor if it's not already focused
            if (document.activeElement !== editor) {
                editor.focus();
                
                // Wait a moment for focus to take effect
                setTimeout(() => {
                    this.insertTextAtCaret(editor, enhancedText);
                }, 10);
                return;
            } else {
                // Editor is already focused, insert immediately
                this.insertTextAtCaret(editor, enhancedText);
                return;
            }
        }

        // Fallback to appending text if no editor found
        const currentState = get(uiState);
        const currentData = get(reportData);
        
        // Check if we're using the single content field (SimpleReportEditor)
        if (currentData.content !== undefined) {
            // SimpleReportEditor uses single content field
            const currentContent = currentData.content || '';
            reportActions.updateContent(currentContent + text);
        } else {
            // Section-based editor
            const activeSection = currentState.activeSection || 'comparison';
            const sections = ['comparison', 'technique', 'findings', 'impression'];
            if (sections.includes(activeSection)) {
                const currentContent = currentData[activeSection] || '';
                reportActions.updateSection(activeSection, currentContent + text);
            }
        }
    }

    insertTextAtCaret(editor, text) {
        const selection = window.getSelection();
        let range;

        // Create a range if none exists
        if (selection.rangeCount === 0) {
            range = document.createRange();
            range.setStart(editor, 0);
            range.setEnd(editor, 0);
            selection.addRange(range);
        } else {
            range = selection.getRangeAt(0);
        }

        // Delete any selected content first
        range.deleteContents();
        
        // Create text node and insert it
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        
        // Move cursor to end of inserted text
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Trigger input event to sync with store
        const event = new Event('input', { bubbles: true });
        editor.dispatchEvent(event);
    }

    // ===== HELPER METHODS FOR NEW VOICE COMMANDS =====
    
    formatLastPhrase(formatType) {
        if (!browser) return;
        
        const currentState = get(uiState);
        const currentData = get(reportData);
        
        const formatMarkers = {
            'bold': ['**', '**'],
            'italic': ['*', '*'],
            'underline': ['_', '_']
        };
        
        const markers = formatMarkers[formatType] || ['', ''];
        
        // Get current content
        let content = '';
        let isSection = false;
        let activeSection = '';
        
        if (currentData.content !== undefined) {
            content = currentData.content || '';
        } else {
            activeSection = currentState.activeSection || 'comparison';
            content = currentData[activeSection] || '';
            isSection = true;
        }
        
        if (!content.trim()) {
            return;
        }
        
        // Find the last phrase (last sentence or last few words)
        const sentences = content.split(/([.!?]\s+)/);
        if (sentences.length >= 1) {
            // Get the last non-empty text part (not delimiter)
            let lastPartIndex = sentences.length - 1;
            while (lastPartIndex >= 0 && !sentences[lastPartIndex].trim()) {
                lastPartIndex--;
            }
            
            // Ensure we're targeting text, not a delimiter (odd indices are delimiters)
            if (lastPartIndex >= 0 && lastPartIndex % 2 === 1 && lastPartIndex > 0) {
                lastPartIndex--; // Move to the preceding text segment
            }
            
            if (lastPartIndex >= 0 && sentences[lastPartIndex].trim()) {
                const lastPart = sentences[lastPartIndex].trim();
                const words = lastPart.split(/\s+/);
                
                // Format last 3-5 words or the whole sentence if it's short
                const wordsToFormat = words.length <= 5 ? words : words.slice(-3);
                const phraseToFormat = wordsToFormat.join(' ');
                const formattedPhrase = `${markers[0]}${phraseToFormat}${markers[1]}`;
                
                // Replace the last occurrence of the phrase (not first occurrence)
                const lastOccurrenceIndex = lastPart.lastIndexOf(phraseToFormat);
                if (lastOccurrenceIndex === -1) {
                    return;
                }
                
                const beforePhrase = lastPart.substring(0, lastOccurrenceIndex);
                const afterPhrase = lastPart.substring(lastOccurrenceIndex + phraseToFormat.length);
                const newLastPart = beforePhrase + formattedPhrase + afterPhrase;
                sentences[lastPartIndex] = newLastPart;
                
                const newContent = sentences.join('');
                
                // Update content
                if (isSection) {
                    reportActions.updateSection(activeSection, newContent);
                } else {
                    reportActions.updateContent(newContent);
                }
                
                return;
            }
        }
        
        // Silent - visual formatting is sufficient feedback
    }

    // Get selected text from the active editor
    getSelectedText() {
        if (!browser) return null;
        
        try {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const selectedText = selection.toString().trim();
                if (selectedText) {
                    return {
                        text: selectedText,
                        range: selection.getRangeAt(0)
                    };
                }
            }
        } catch (error) {
            console.warn('Error getting selected text:', error);
        }
        
        return null;
    }

    // Enhanced formatting that works on selected text OR last phrase
    formatTextOrPhrase(formatType) {
        if (!browser) return;
        
        // PRIORITY 1: Try TipTap editor first with native formatting commands
        if (window.tiptapEditor) {
            try {
                const selection = window.tiptapEditor.state.selection;
                const hasSelection = !selection.empty;
                
                if (hasSelection) {
                    // There's selected text - use TipTap's native formatting commands
                    console.log(`📝 Formatting selected text as ${formatType}`);
                    let commandChain = window.tiptapEditor.chain().focus();
                    
                    switch (formatType) {
                        case 'bold':
                            commandChain.toggleBold().run();
                            break;
                        case 'italic':
                            commandChain.toggleItalic().run();
                            break;
                        case 'underline':
                            commandChain.toggleUnderline().run();
                            break;
                    }
                    return;
                } else {
                    // No selection - format last phrase by selecting it first
                    console.log(`📝 Formatting last phrase as ${formatType}`);
                    this.formatLastPhraseInTipTap(formatType);
                    return;
                }
            } catch (error) {
                console.warn('TipTap formatting failed, falling back:', error);
            }
        }
        
        // FALLBACK 1: Try contenteditable editor with execCommand
        const editor = document.querySelector('[contenteditable="true"]');
        if (editor) {
            const selection = window.getSelection();
            const hasSelection = selection && selection.rangeCount > 0 && !selection.isCollapsed;
            
            if (hasSelection) {
                // There's selected text - use document.execCommand to format it
                try {
                    editor.focus();
                    
                    let commandSuccess = false;
                    switch (formatType) {
                        case 'bold':
                            commandSuccess = document.execCommand('bold', false, null);
                            break;
                        case 'italic':
                            commandSuccess = document.execCommand('italic', false, null);
                            break;
                        case 'underline':
                            commandSuccess = document.execCommand('underline', false, null);
                            break;
                    }
                    
                    if (commandSuccess) {
                        // Trigger input event to sync with store
                        const event = new Event('input', { bubbles: true });
                        editor.dispatchEvent(event);
                        return;
                    }
                } catch (error) {
                    console.warn('Error formatting selected text:', error);
                }
            } else {
                // No selection - format last phrase
                this.formatLastPhraseInEditor(formatType, editor);
                return;
            }
        }
        
        // FALLBACK 2: For section-based editors, use the markdown approach
        this.formatLastPhrase(formatType);
    }

    // Format last phrase in TipTap editor
    formatLastPhraseInTipTap(formatType) {
        if (!browser || !window.tiptapEditor) return;
        
        try {
            const text = window.tiptapEditor.getText();
            if (!text.trim()) return;
            
            // Find the last phrase (last sentence or last few words)
            const sentences = text.split(/[.!?]\s+/);
            let lastPhrase = '';
            
            if (sentences.length > 1) {
                lastPhrase = sentences[sentences.length - 1].trim();
            } else {
                const words = text.trim().split(/\s+/);
                const wordsToFormat = words.length <= 5 ? words : words.slice(-3);
                lastPhrase = wordsToFormat.join(' ');
            }
            
            if (!lastPhrase) return;
            
            // Find last occurrence of phrase and select it
            const lastIndex = text.lastIndexOf(lastPhrase);
            if (lastIndex === -1) return;
            
            // TipTap/ProseMirror uses 0-based indexing like JavaScript
            const from = lastIndex;
            const to = from + lastPhrase.length;
            
            // Select the phrase and apply formatting
            let commandChain = window.tiptapEditor.chain().focus()
                .setTextSelection({ from, to });
            
            switch (formatType) {
                case 'bold':
                    commandChain.toggleBold().run();
                    break;
                case 'italic':
                    commandChain.toggleItalic().run();
                    break;
                case 'underline':
                    commandChain.toggleUnderline().run();
                    break;
            }
            
            console.log(`✅ Formatted last phrase "${lastPhrase}" as ${formatType}`);
        } catch (error) {
            console.error('Error formatting last phrase in TipTap:', error);
        }
    }

    // Format last phrase in contenteditable editor using proper HTML formatting
    formatLastPhraseInEditor(formatType, editor) {
        if (!browser || !editor) return;
        
        try {
            editor.focus();
            
            // Get the text content to find the last phrase
            const textContent = editor.textContent || '';
            if (!textContent.trim()) {
                return;
            }
            
            // Find the last phrase (last sentence or last few words)
            const sentences = textContent.split(/[.!?]\s+/);
            let lastPhrase = '';
            
            if (sentences.length > 1) {
                // Multiple sentences - get last complete sentence
                lastPhrase = sentences[sentences.length - 1].trim();
            } else {
                // Single sentence - get last 3-5 words
                const words = textContent.trim().split(/\s+/);
                const wordsToFormat = words.length <= 5 ? words : words.slice(-3);
                lastPhrase = wordsToFormat.join(' ');
            }
            
            if (!lastPhrase) {
                return;
            }
            
            // Find and select the last occurrence of this phrase
            const selection = window.getSelection();
            const range = document.createRange();
            
            // Use TreeWalker to find text nodes containing our phrase
            const walker = document.createTreeWalker(
                editor,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            
            let lastMatch = null;
            let node;
            while (node = walker.nextNode()) {
                const nodeText = node.textContent || '';
                const phraseIndex = nodeText.lastIndexOf(lastPhrase);
                if (phraseIndex !== -1) {
                    lastMatch = {
                        node: node,
                        start: phraseIndex,
                        end: phraseIndex + lastPhrase.length
                    };
                }
            }
            
            if (lastMatch) {
                // Select the text range
                range.setStart(lastMatch.node, lastMatch.start);
                range.setEnd(lastMatch.node, lastMatch.end);
                selection.removeAllRanges();
                selection.addRange(range);
                
                // Apply formatting using execCommand
                let commandSuccess = false;
                switch (formatType) {
                    case 'bold':
                        commandSuccess = document.execCommand('bold', false, null);
                        break;
                    case 'italic':
                        commandSuccess = document.execCommand('italic', false, null);
                        break;
                    case 'underline':
                        commandSuccess = document.execCommand('underline', false, null);
                        break;
                }
                
                if (commandSuccess) {
                    // Clear selection and trigger input event to sync with store
                    selection.removeAllRanges();
                    const event = new Event('input', { bubbles: true });
                    editor.dispatchEvent(event);
                }
            }
            
        } catch (error) {
            console.warn('Error formatting last phrase in editor:', error);
        }
    }

    deleteLastPhrase() {
        if (!browser) return;
        
        const currentState = get(uiState);
        const currentData = get(reportData);
        
        // Get current content
        let content = '';
        let isSection = false;
        let activeSection = '';
        
        if (currentData.content !== undefined) {
            content = currentData.content || '';
        } else {
            activeSection = currentState.activeSection || 'comparison';
            content = currentData[activeSection] || '';
            isSection = true;
        }
        
        if (!content.trim()) {
            return;
        }
        
        // Find the last sentence or phrase to delete
        // Split by sentence endings but keep the delimiters for proper rejoining
        const sentenceParts = content.split(/([.!?]\s*)/);
        let deletedText = '';
        
        if (sentenceParts.length >= 3) {
            // Multiple sentences - remove last sentence with its punctuation
            deletedText = sentenceParts[sentenceParts.length - 3] + (sentenceParts[sentenceParts.length - 2] || '');
            sentenceParts.splice(-3, 2); // Remove last sentence and punctuation
        } else if (sentenceParts.length === 1) {
            // Single sentence without ending punctuation - remove last few words
            const words = content.trim().split(/\s+/);
            if (words.length > 3) {
                deletedText = words.slice(-3).join(' ');
                const newContent = words.slice(0, -3).join(' ');
                
                // Update content
                if (isSection) {
                    reportActions.updateSection(activeSection, newContent);
                } else {
                    reportActions.updateContent(newContent);
                }
                
                uiActions.showInfoNotification(`Deleted: ${deletedText}`);
                return;
            } else {
                // Clear entire content if only 1-3 words
                deletedText = content.trim();
                if (isSection) {
                    reportActions.updateSection(activeSection, '');
                } else {
                    reportActions.updateContent('');
                }
                
                uiActions.showInfoNotification(`Deleted: ${deletedText}`);
                return;
            }
        } else {
            // Single sentence with punctuation
            deletedText = sentenceParts[0];
            sentenceParts.splice(0, 2); // Remove sentence and punctuation
        }
        
        const newContent = sentenceParts.join('').trim();
        
        // Update content
        if (isSection) {
            reportActions.updateSection(activeSection, newContent);
        } else {
            reportActions.updateContent(newContent);
        }
        
        if (deletedText) {
            uiActions.showInfoNotification(`Deleted: ${deletedText.trim()}`);
        }
    }

    selectText(textToSelect) {
        if (!browser) return;
        
        const currentState = get(uiState);
        const currentData = get(reportData);
        
        // Get current content
        let content = '';
        let isSection = false;
        let activeSection = '';
        
        if (currentData.content !== undefined) {
            content = currentData.content || '';
        } else {
            activeSection = currentState.activeSection || 'comparison';
            content = currentData[activeSection] || '';
            isSection = true;
        }
        
        if (!content.trim()) {
            return; // No content to select from
            return;
        }
        
        // Find the text to select (case-insensitive)
        const searchText = textToSelect.toLowerCase();
        const contentLower = content.toLowerCase();
        const index = contentLower.indexOf(searchText);
        
        if (index !== -1) {
            // Store selection for deletion
            this.selectedText = {
                text: content.substring(index, index + textToSelect.length),
                startIndex: index,
                endIndex: index + textToSelect.length,
                originalText: textToSelect,
                isSection: isSection,
                activeSection: activeSection
            };
            
            uiActions.showInfoNotification(`Selected: ${this.selectedText.text}`);
        } else {
            // Try partial matching with words
            const words = textToSelect.toLowerCase().split(/\s+/);
            for (const word of words) {
                if (word.length > 2) { // Only try words longer than 2 characters
                    const wordIndex = contentLower.indexOf(word);
                    if (wordIndex !== -1) {
                        // Find word boundaries
                        let startIndex = wordIndex;
                        let endIndex = wordIndex + word.length;
                        
                        // Extend to word boundaries
                        while (startIndex > 0 && /\w/.test(content[startIndex - 1])) {
                            startIndex--;
                        }
                        while (endIndex < content.length && /\w/.test(content[endIndex])) {
                            endIndex++;
                        }
                        
                        this.selectedText = {
                            text: content.substring(startIndex, endIndex),
                            startIndex: startIndex,
                            endIndex: endIndex,
                            originalText: textToSelect,
                            isSection: isSection,
                            activeSection: activeSection
                        };
                        
                        uiActions.showInfoNotification(`Selected: ${this.selectedText.text}`);
                        return;
                    }
                }
            }
            
            uiActions.showErrorNotification(`Could not find: ${textToSelect}`);
            this.selectedText = null;
        }
    }

    deleteSelectedText() {
        if (!browser) return;
        
        if (!this.selectedText) {
            uiActions.showErrorNotification('No text selected. Use "select" command first.');
            return;
        }
        
        const currentState = get(uiState);
        const currentData = get(reportData);
        
        // Get current content
        let content = '';
        
        if (this.selectedText.isSection) {
            content = currentData[this.selectedText.activeSection] || '';
        } else {
            content = currentData.content || '';
        }
        
        // Validate selection is still valid
        const expectedText = content.substring(this.selectedText.startIndex, this.selectedText.endIndex);
        if (expectedText !== this.selectedText.text) {
            uiActions.showErrorNotification('Content has changed. Please select text again.');
            this.selectedText = null;
            return;
        }
        
        // Remove the selected text
        const beforeText = content.substring(0, this.selectedText.startIndex);
        const afterText = content.substring(this.selectedText.endIndex);
        let newContent = beforeText + afterText;
        
        // Clean up only duplicate spaces locally around deletion point (preserve newlines/formatting)
        const cleanupStart = Math.max(0, this.selectedText.startIndex - 10);
        const cleanupEnd = Math.min(newContent.length, this.selectedText.startIndex + 10);
        const beforeCleanup = newContent.substring(0, cleanupStart);
        const toCleanup = newContent.substring(cleanupStart, cleanupEnd);
        const afterCleanup = newContent.substring(cleanupEnd);
        
        // Only normalize excessive spaces, preserve single spaces and newlines
        const cleanedMiddle = toCleanup.replace(/[ \t]+/g, ' ');
        newContent = beforeCleanup + cleanedMiddle + afterCleanup;
        
        // Update content
        if (this.selectedText.isSection) {
            reportActions.updateSection(this.selectedText.activeSection, newContent);
        } else {
            reportActions.updateContent(newContent);
        }
        
        uiActions.showInfoNotification(`Deleted: ${this.selectedText.text}`);
        this.selectedText = null; // Clear selection
    }

    goToDocumentStart() {
        if (!browser) return;
        
        const currentState = get(uiState);
        const currentData = get(reportData);
        
        // Navigate to the first section
        const sections = ['comparison', 'technique', 'findings', 'impression'];
        const firstSection = sections[0];
        
        uiActions.setCurrentSection(firstSection);
        
        // Clear any text selection
        this.selectedText = null;
        
        // CRITICAL FIX: Move cursor to start of TipTap editor
        const activeEditor = getActiveEditor();
        if (activeEditor) {
            try {
                activeEditor.chain()
                    .focus()
                    .setTextSelection(0) // Move to position 0 (start)
                    .run();
                console.log('✅ Cursor moved to document start');
                
                // Scroll to the cursor position to ensure it's visible
                setTimeout(() => {
                    const editorEl = document.querySelector('[contenteditable="true"]');
                    if (editorEl) {
                        editorEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 50);
            } catch (error) {
                console.error('Failed to move cursor to start:', error);
            }
        }
        
        // For comprehensive feedback, indicate which section we're in
        let content = '';
        if (currentData.content !== undefined) {
            content = currentData.content || '';
            uiActions.showInfoNotification('Moved to document start');
        } else {
            content = currentData[firstSection] || '';
            uiActions.showInfoNotification(`Moved to ${firstSection}`);
        }
    }

    goToDocumentEnd() {
        if (!browser) return;
        
        const currentState = get(uiState);
        const currentData = get(reportData);
        
        // Navigate to the last section with content, or the last section
        const sections = ['comparison', 'technique', 'findings', 'impression'];
        let lastSectionWithContent = sections[sections.length - 1];
        
        // Find the last section that has content
        if (currentData.content === undefined) {
            for (let i = sections.length - 1; i >= 0; i--) {
                if (currentData[sections[i]] && currentData[sections[i]].trim()) {
                    lastSectionWithContent = sections[i];
                    break;
                }
            }
        }
        
        uiActions.setCurrentSection(lastSectionWithContent);
        
        // Clear any text selection
        this.selectedText = null;
        
        // CRITICAL FIX: Move cursor to end of TipTap editor
        const activeEditor = getActiveEditor();
        if (activeEditor) {
            try {
                const docSize = activeEditor.state.doc.content.size;
                activeEditor.chain()
                    .focus()
                    .setTextSelection(docSize - 1) // Move to end (doc size - 1)
                    .run();
                console.log('✅ Cursor moved to document end');
                
                // Scroll to the cursor position to ensure it's visible (like goToStart)
                setTimeout(() => {
                    const editorEl = document.querySelector('[contenteditable="true"]');
                    if (editorEl) {
                        editorEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    }
                }, 50);
            } catch (error) {
                console.error('Failed to move cursor to end:', error);
            }
        }
        
        // For comprehensive feedback, indicate which section we're in
        let content = '';
        if (currentData.content !== undefined) {
            content = currentData.content || '';
            uiActions.showInfoNotification('Moved to document end');
        } else {
            content = currentData[lastSectionWithContent] || '';
            uiActions.showInfoNotification(`Moved to ${lastSectionWithContent}`);
        }
    }

    handleLowConfidence(transcript, confidence) {
        console.warn(`Low confidence recognition: "${transcript}" (${(confidence * 100).toFixed(1)}%)`);
        uiActions.showErrorNotification('I\'m not sure I understood that. Please try again.');
    }

    handleError(errorMessage) {
        console.error('Voice recognition error:', errorMessage);
        this.notifyStatusChange(`Error: ${errorMessage}`);
        
        if (this.errorCount >= this.maxErrors) {
            uiActions.showErrorNotification('Voice recognition is having trouble. Please check your microphone and try again.');
        }
    }

    navigateToSection(sectionName) {
        if (!browser) return;

        const editor = document.querySelector('[contenteditable="true"]');
        if (!editor) {
            console.warn(`No editor found for navigation to ${sectionName}`);
            uiActions.showErrorNotification('No text editor found');
            return;
        }

        // Simple approach: focus editor and scroll to section
        editor.focus();
        
        // Get the editor content as HTML to preserve structure
        const content = editor.innerHTML || '';
        
        // Look for section headers in a simple way
        const sectionPatterns = {
            'findings': /(<[^>]*>)?\s*FINDINGS?\s*:?/i,
            'impression': /(<[^>]*>)?\s*IMPRESSION\s*:?/i,
            'comparison': /(<[^>]*>)?\s*COMPARISON\s*:?/i,
            'technique': /(<[^>]*>)?\s*TECHNIQUE\s*:?/i
        };

        const pattern = sectionPatterns[sectionName];
        if (!pattern) {
            console.warn(`Unknown section: ${sectionName}`);
            return;
        }

        // Try to find the section in the content
        const match = content.match(pattern);
        if (!match) {
            // Section not found - create it at the end
            console.log(`Section ${sectionName} not found, moving to end`);
            this.simpleMoveToEnd(editor);
            return;
        }

        // Found section - position cursor at END of section content
        this.navigateToEndOfSection(editor, sectionName, match);
    }

    navigateToEndOfSection(editor, sectionName, match) {
        try {
            // Get plain text content to find positions
            const plainText = editor.textContent || editor.innerText || '';
            const sectionHeaderText = match[0].replace(/<[^>]*>/g, '').trim();
            
            // Find where this section header appears in plain text
            const headerPosition = plainText.toLowerCase().indexOf(sectionHeaderText.toLowerCase());
            
            if (headerPosition === -1) {
                this.simpleMoveToEnd(editor);
                setTimeout(() => {
                    this.scrollToCaretPosition(editor);
                }, 100);
                return;
            }
            
            // Find the start of the next section or end of document
            const sections = ['comparison', 'technique', 'findings', 'impression'];
            let nextSectionPosition = plainText.length; // Default to end of document
            
            // Look for the next section header after this one
            for (const nextSection of sections) {
                if (nextSection === sectionName) continue;
                
                const nextPattern = new RegExp(`\\b${nextSection}\\s*:?`, 'i');
                const nextMatch = plainText.substring(headerPosition + sectionHeaderText.length).match(nextPattern);
                
                if (nextMatch && nextMatch.index !== undefined) {
                    const nextPos = headerPosition + sectionHeaderText.length + nextMatch.index;
                    if (nextPos < nextSectionPosition) {
                        nextSectionPosition = nextPos;
                    }
                }
            }
            
            // Find the end of the current section content (before next section)
            const sectionContent = plainText.substring(headerPosition + sectionHeaderText.length, nextSectionPosition);
            const trimmedContent = sectionContent.trim();
            
            if (trimmedContent) {
                // Position cursor at end of section content  
                const endPosition = headerPosition + sectionHeaderText.length + sectionContent.lastIndexOf(trimmedContent) + trimmedContent.length;
                this.setSimpleCursorPosition(editor, endPosition);
                console.log(`Navigated to END of ${sectionName} section at position ${endPosition}`);
            } else {
                // Empty section - position after header
                const endPosition = headerPosition + sectionHeaderText.length;
                this.setSimpleCursorPosition(editor, endPosition);
                console.log(`Navigated to empty ${sectionName} section at position ${endPosition}`);
            }
            
            // Enhanced scroll to caret position with delay for DOM updates
            setTimeout(() => {
                this.scrollToCaretPosition(editor);
            }, 100);
            
        } catch (error) {
            console.error('Navigation error:', error);
            this.simpleMoveToEnd(editor);
            setTimeout(() => {
                this.scrollToCaretPosition(editor);
            }, 100);
        }
    }

    setSimpleCursorPosition(editor, textPosition) {
        const selection = window.getSelection();
        const range = document.createRange();
        
        try {
            // Walk through text nodes to find the right position
            let currentPos = 0;
            const walker = document.createTreeWalker(
                editor,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            
            let targetNode = null;
            let targetOffset = 0;
            
            while (walker.nextNode()) {
                const node = walker.currentNode;
                const nodeLength = node.textContent.length;
                
                if (currentPos + nodeLength >= textPosition) {
                    targetNode = node;
                    targetOffset = textPosition - currentPos;
                    break;
                }
                currentPos += nodeLength;
            }
            
            if (targetNode) {
                range.setStart(targetNode, Math.min(targetOffset, targetNode.textContent.length));
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                editor.focus();
            } else {
                // Fallback to end
                this.simpleMoveToEnd(editor);
            }
        } catch (error) {
            console.error('Cursor positioning error:', error);
            this.simpleMoveToEnd(editor);
        }
    }

    simpleMoveToEnd(editor) {
        try {
            editor.focus();
            const selection = window.getSelection();
            const range = document.createRange();
            
            range.selectNodeContents(editor);
            range.collapse(false); // Collapse to end
            
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Scroll to cursor
            editor.scrollIntoView({ behavior: 'smooth', block: 'end' });
            
        } catch (error) {
            console.error('Error moving to end:', error);
        }
    }

    scrollToCursor() {
        if (!browser) return;
        
        console.log(`[VOICE DEBUG] 📍 Scrolling to cursor using temporary marker`);
        
        setTimeout(() => {
            try {
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) {
                    console.warn('[VOICE DEBUG] No selection found for scrolling');
                    // Fallback: focus the editor and scroll it into view
                    const editor = document.querySelector('[contenteditable="true"]');
                    if (editor) {
                        editor.focus();
                        editor.scrollIntoView({ block: 'center', behavior: 'smooth' });
                        console.log('[VOICE DEBUG] ✓ Fallback scroll to editor');
                    }
                    return;
                }
                
                // Get the current range at cursor position
                const range = selection.getRangeAt(0);
                
                console.log(`[VOICE DEBUG] Creating zero-width marker span`);
                
                // Create a zero-width marker span (NOT absolutely positioned)
                const marker = document.createElement('span');
                marker.style.width = '0';
                marker.style.height = '0';  
                marker.style.display = 'inline';
                marker.style.overflow = 'hidden';
                marker.style.pointerEvents = 'none';
                marker.setAttribute('data-scroll-marker', 'true');
                
                // Insert marker at current cursor position
                range.insertNode(marker);
                console.log(`[VOICE DEBUG] Marker inserted at cursor position`);
                
                // Scroll marker into view - this will scroll the editor's container
                marker.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest'
                });
                console.log(`[VOICE DEBUG] ✓ Scrolled marker into view`);
                
                // Position cursor immediately after the marker and remove it
                setTimeout(() => {
                    try {
                        // Create range positioned after the marker
                        const newRange = document.createRange();
                        newRange.setStartAfter(marker);
                        newRange.collapse(true);
                        
                        // Apply the new cursor position
                        selection.removeAllRanges();
                        selection.addRange(newRange);
                        
                        // Remove the marker
                        if (marker.parentNode) {
                            marker.parentNode.removeChild(marker);
                            console.log(`[VOICE DEBUG] ✓ Cursor positioned and marker removed`);
                        }
                    } catch (error) {
                        console.warn('[VOICE DEBUG] Error positioning cursor after marker:', error);
                        // Fallback: just remove the marker
                        if (marker.parentNode) {
                            marker.parentNode.removeChild(marker);
                        }
                    }
                }, 100); // Short delay to let scrolling start
                
            } catch (error) {
                console.warn('[VOICE DEBUG] Could not scroll to cursor:', error);
                // Clean up any markers that might be left behind
                const markers = document.querySelectorAll('[data-scroll-marker]');
                markers.forEach(marker => marker.remove());
            }
        }, 50); // Small delay to let cursor positioning complete
    }

    // Enhanced scroll to caret position implementation based on user specifications
    scrollToCaretPosition(editor) {
        if (!browser || !editor) return;
        
        console.log(`[VOICE DEBUG] 📍 Enhanced scroll to caret position starting`);
        
        try {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) {
                console.warn('[VOICE DEBUG] No selection found for enhanced scrolling');
                return;
            }
            
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            // Get the scrollable container (should be .editor-container)
            const scrollContainer = editor.closest('.editor-container') || editor.parentElement;
            if (!scrollContainer) {
                console.warn('[VOICE DEBUG] No scroll container found');
                return;
            }
            
            const containerRect = scrollContainer.getBoundingClientRect();
            
            // Calculate if caret is outside visible viewport
            const caretTop = rect.top;
            const caretBottom = rect.bottom;
            const containerTop = containerRect.top;
            const containerBottom = containerRect.bottom;
            
            console.log(`[VOICE DEBUG] Caret: ${caretTop}-${caretBottom}, Container: ${containerTop}-${containerBottom}`);
            
            // Check if caret is outside visible area
            const isAboveViewport = caretTop < containerTop;
            const isBelowViewport = caretBottom > containerBottom;
            
            if (isAboveViewport || isBelowViewport) {
                console.log(`[VOICE DEBUG] Caret outside viewport, scrolling...`);
                
                // Calculate scroll position to center the caret
                const containerHeight = containerRect.height;
                const scrollOffset = (caretTop - containerTop) - (containerHeight / 2);
                
                // Smooth scroll to position
                scrollContainer.scrollBy({
                    top: scrollOffset,
                    behavior: 'smooth'
                });
                
                console.log(`[VOICE DEBUG] ✓ Scrolled by ${scrollOffset}px to center caret`);
            } else {
                console.log(`[VOICE DEBUG] ✓ Caret already visible, no scroll needed`);
            }
            
        } catch (error) {
            console.warn('[VOICE DEBUG] Enhanced scroll error:', error);
            // Fallback to simple scroll
            editor.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    getErrorMessage(error) {
        const errorMessages = {
            'no-speech': 'No speech detected. Please try speaking again.',
            'audio-capture': 'Microphone access denied or unavailable.',
            'not-allowed': 'Microphone permission denied.',
            'network': 'Network error occurred.',
            'service-not-allowed': 'Speech service not allowed.',
            'bad-grammar': 'Grammar error in speech recognition.',
            'language-not-supported': 'Language not supported.'
        };
        
        return errorMessages[error] || 'Unknown speech recognition error occurred.';
    }

    speakFeedback(text) {
        if (!browser || !('speechSynthesis' in window)) return;

        // Pause recognition to prevent feedback loop - OFFLINE ONLY
        const wasListening = this.isListening || (whisperVoiceService && whisperVoiceService.isListening);
        if (wasListening && whisperVoiceService && whisperVoiceService.isListening) {
            whisperVoiceService.stopListening();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = 0.4; // Quieter for medical environment
        utterance.rate = 1.1;
        utterance.pitch = 1;
        
        // Resume recognition after speaking is done
        utterance.onend = () => {
            if (wasListening && !this.isPaused) {
                setTimeout(async () => {
                    if (!this.isPaused) {
                        await this.startListening();
                    }
                }, 500); // Short delay to prevent pickup
            }
        };
        
        speechSynthesis.speak(utterance);
    }

    notifyStatusChange(status) {
        if (this.callbacks.onStatusChange) {
            this.callbacks.onStatusChange(status);
        }
    }

    notifyCommandExecuted(command) {
        if (this.callbacks.onCommandExecuted) {
            this.callbacks.onCommandExecuted(command);
        }
    }

    // Public API methods - OFFLINE ONLY for patient security
    async startListening() {
        if (!browser) {
            console.warn('Not in browser environment');
            return false;
        }

        // Stop any currently running recognition first
        this.stopListening();
        this.isPaused = false;

        // SECURITY: Only use offline voice recognition - no cloud services for patient data
        if (!this.isWhisperAvailable()) {
            console.error('Offline speech recognition not available');
            uiActions.showErrorNotification('Voice recognition server required - please start the server');
            return false;
        }

        try {
            console.log('Starting secure offline speech recognition...');
            
            // Initialize voice recognition if not already done
            if (!this.whisperInitialized) {
                const initialized = await this.initializeWhisper();
                if (!initialized) {
                    console.error('Failed to initialize voice recognition');
                    uiActions.showErrorNotification('Unable to start voice recognition - check server connection');
                    return false;
                }
            }

            // Start voice recognition
            const started = await whisperVoiceService.startListening();
            if (started) {
                console.log('✓ Secure offline speech recognition active');
                uiActions.showSuccessNotification('Voice recognition active');
                return true;
            } else {
                console.error('Failed to start voice recognition');
                uiActions.showErrorNotification('Unable to start voice recognition - check connection');
                return false;
            }
        } catch (error) {
            console.error('Error with speech recognition:', error);
            uiActions.showErrorNotification('Voice recognition failed - patient data remains secure');
            return false;
        }
    }

    stopListening() {
        if (!browser) return;
        
        this.isPaused = true;
        
        // Stop offline voice recognition
        if (whisperVoiceService && whisperVoiceService.isListening) {
            whisperVoiceService.stopListening();
        }
        
        // Update UI state after stopping voice service
        uiActions.setListening(false);
        
        // Notify status change
        if (this.callbacks.onStatusChange) {
            this.callbacks.onStatusChange('stopped');
        }
    }

    async toggleListening() {
        if (this.isListening || (whisperVoiceService && whisperVoiceService.isListening)) {
            this.stopListening();
        } else {
            await this.startListening();
        }
        return whisperVoiceService ? whisperVoiceService.isListening : false;
    }

    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
        console.log('📞 Callbacks set:', Object.keys(this.callbacks).filter(k => this.callbacks[k] !== null));
    }

    isVoiceSupported() {
        return this.isWhisperAvailable();
    }

    getListeningStatus() {
        return whisperVoiceService ? whisperVoiceService.isListening : false;
    }

    getLastCommand() {
        return this.lastCommand;
    }

    resetErrors() {
        this.errorCount = 0;
        this.retryAttempts = 0;
        this.isPaused = false;
    }

    // Medical-specific helper methods
    getMedicalSuggestions(partialText) {
        const text = partialText.toLowerCase();
        return Array.from(this.medicalTerms)
            .filter(term => term.startsWith(text))
            .slice(0, 5);
    }

    getAvailableCommands() {
        return this.commandPatterns.map(pattern => ({
            description: pattern.description,
            pattern: pattern.pattern.toString()
        }));
    }
}

// Export singleton instance (only in browser)
export const enhancedVoiceService = browser ? new EnhancedVoiceService() : null;