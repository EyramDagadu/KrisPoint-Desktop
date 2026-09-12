<!-- Enhanced Voice Control Component -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { uiState, uiActions } from '$lib/stores/reportStore.js';
  import { enhancedVoiceService } from '$lib/services/EnhancedVoiceService.js';
  import { macroStore } from '$lib/stores/macroStore.js';
  import Tooltip from '$lib/components/ui/Tooltip.svelte';
  
  // Use shared state from store instead of local state
  $: isListening = $uiState.isListening;
  let isSupported = false;
  let lastCommand = '';
  let statusMessage = 'Ready';
  let confidence = 0;
  let errorCount = 0;
  let showCommands = false;
  let voiceEnabled = true; // Track if voice recognition is enabled via settings
  let handleVoiceSettingsChange; // Store handler reference for cleanup
  
  // Connection state tracking - check actual service state on init
  let connectionStatus = 'disconnected'; // 'connected', 'disconnected', 'reconnecting', 'initializing'
  let isReconnecting = false;
  let reconnectAttempt = 0;
  let maxReconnectAttempts = 15;
  
  // Configurable quick buttons from macros - now supports mixed pools
  let quickButtonMacroIds = [];
  let quickButtonMacros = [];
  let showMacroPicker = false;
  let systemMacros = [];
  let personalMacros = [];
  let allMacros = []; // Combined for lookup
  let settingsServiceRef = null;
  let macrosLoading = false;
  
  // Update quick button macros when IDs or macro list changes
  $: {
    if (quickButtonMacroIds.length > 0 && allMacros.length > 0) {
      quickButtonMacros = quickButtonMacroIds
        .map(id => allMacros.find(m => m.id === id))
        .filter(m => m !== undefined);
    } else {
      quickButtonMacros = [];
    }
  }
  
  // Check if voice service is already initialized (e.g., returning to page)
  // Also responds to whisperInitialized changes (e.g., disconnect resets it to false)
  $: {
    if (enhancedVoiceService) {
      if (enhancedVoiceService.whisperInitialized) {
        connectionStatus = 'connected';
      } else if (connectionStatus === 'connected') {
        // Was connected but whisperInitialized became false - disconnected
        connectionStatus = 'disconnected';
      }
    }
  }
  
  onMount(async () => {
    // Check if offline voice recognition is supported - OFFLINE ONLY for patient security
    isSupported = enhancedVoiceService.isVoiceSupported();
    
    // Load both system and personal macros for mixed shortcut selection
    await loadMacrosFromApi();
    
    // Load settings to check if voice is enabled and quick button config
    try {
      const { settingsService } = await import('../../services/SettingsService.js');
      if (settingsService) {
        settingsServiceRef = settingsService;
        voiceEnabled = settingsService.settings.voice.enabled;
        // Load configured quick button macro IDs
        const savedIds = settingsService.settings.voice.quickButtonMacroIds || [];
        
        // Validate saved IDs against available macros - remove stale IDs
        const validIds = savedIds.filter(id => allMacros.some(m => m.id === id));
        quickButtonMacroIds = validIds;
        
        // If some IDs were invalid, update settings to remove stale ones
        if (validIds.length !== savedIds.length) {
          settingsService.updateVoiceSettings({ quickButtonMacroIds: validIds });
        }
      }
    } catch (error) {
      console.error('Error loading voice settings:', error);
    }
    
    // Listen for voice settings changes
    handleVoiceSettingsChange = (event) => {
      voiceEnabled = event.detail.enabled;
      
      // If voice is disabled and currently listening, stop
      if (!voiceEnabled && isListening) {
        enhancedVoiceService.stopListening();
        statusMessage = 'Voice recognition disabled';
      } else if (voiceEnabled && !isListening) {
        statusMessage = 'Ready';
      }
    };
    
    window.addEventListener('voiceSettingsChanged', handleVoiceSettingsChange);
    
    if (isSupported) {
      // Set up callbacks for enhanced voice service (OFFLINE ONLY)
      enhancedVoiceService.setCallbacks({
        onStart: () => {
          uiActions.setListening(true);
          statusMessage = 'Listening...';
          errorCount = 0;
        },
        
        onEnd: () => {
          uiActions.setListening(false);
          statusMessage = 'Ready';
        },
        
        onResult: (result) => {
          lastCommand = result.transcript;
          confidence = Math.round(result.confidence * 100);
          
          // Process the transcript as command or dictation
          const wasCommand = enhancedVoiceService.processCommand(result.transcript, result.confidence);
          
          if (!wasCommand) {
            // Not a command, insert as dictation text
            enhancedVoiceService.insertText(result.transcript + ' ');
          }
          
          // Clear last command after 4 seconds
          setTimeout(() => {
            if (lastCommand === result.transcript) {
              lastCommand = '';
              confidence = 0;
            }
          }, 4000);
        },
        
        onError: (error) => {
          errorCount++;
          statusMessage = `Error: ${error}`;
          uiActions.setListening(false);
          setTimeout(() => {
            if (statusMessage.includes('Error')) {
              statusMessage = 'Ready';
            }
          }, 3000);
        },
        
        onStatusChange: (status) => {
          statusMessage = status;
          
          // Parse status for connection state tracking
          // Match actual status strings from EnhancedVoiceService
          const statusLower = status.toLowerCase();
          
          if (statusLower.includes('ready') || 
              statusLower.includes('voice model ready') ||
              statusLower.includes('voice recognition active') ||
              statusLower === 'listening' ||
              statusLower.includes('reconnected')) {
            connectionStatus = 'connected';
            isReconnecting = false;
            reconnectAttempt = 0;
          } else if (statusLower === 'disconnected' || 
                     statusLower.includes('connection lost') ||
                     statusLower.includes('failed to connect') ||
                     statusLower.includes('server not running')) {
            connectionStatus = 'disconnected';
          } else if (statusLower.includes('reconnecting')) {
            connectionStatus = 'reconnecting';
            isReconnecting = true;
            // Extract attempt number from "reconnecting (X/Y)"
            const match = status.match(/\((\d+)\/(\d+)\)/);
            if (match) {
              reconnectAttempt = parseInt(match[1]);
              maxReconnectAttempts = parseInt(match[2]);
            }
          } else if (statusLower.includes('loading') || 
                     statusLower.includes('initializing') ||
                     statusLower.includes('connecting')) {
            connectionStatus = 'initializing';
          }
        },
        
        onCommandExecuted: (command) => {
          statusMessage = `✓ ${command}`;
          setTimeout(() => {
            if (statusMessage.startsWith('✓')) {
              statusMessage = 'Ready';
            }
          }, 2000);
        }
      });
      
      // CRITICAL UX FIX: Preload voice model on app startup (not when user clicks dictate!)
      // This eliminates 30-120s wait time when clicking dictate button
      if (voiceEnabled) {
        // Check if already initialized (e.g., returning to this page)
        if (enhancedVoiceService.whisperInitialized) {
          statusMessage = 'Voice ready - click Dictate to start';
          connectionStatus = 'connected';
          isReconnecting = false;
        } else {
          statusMessage = 'Initializing voice recognition...';
          connectionStatus = 'initializing';
          enhancedVoiceService.initializeWhisper().then(success => {
            if (success) {
              statusMessage = 'Voice model loaded - ready to dictate!';
              connectionStatus = 'connected';
              isReconnecting = false;
            } else {
              statusMessage = 'Voice model failed to load';
              connectionStatus = 'disconnected';
            }
          });
        }
      }
    } else {
      statusMessage = 'Voice recognition not supported';
    }
  });
  
  onDestroy(() => {
    // Clean up event listener
    if (handleVoiceSettingsChange) {
      window.removeEventListener('voiceSettingsChanged', handleVoiceSettingsChange);
    }
    
    // Stop voice if listening
    if (isListening) {
      enhancedVoiceService.stopListening();
    }
  });

  async function loadMacrosFromApi() {
    macrosLoading = true;
    try {
      // Load both system and personal macros in parallel for mixed selection
      const [systemRes, personalRes] = await Promise.all([
        fetch('/api/macros?scope=system', {
          credentials: 'include'
        }),
        fetch('/api/macros?scope=personal', {
          credentials: 'include'
        })
      ]);

      if (systemRes.ok) {
        const data = await systemRes.json();
        systemMacros = data.success ? data.macros.map(m => ({ ...m, _scope: 'system' })) : [];
      }

      if (personalRes.ok) {
        const data = await personalRes.json();
        personalMacros = data.success ? data.macros.map(m => ({ ...m, _scope: 'personal' })) : [];
      }

      // Combine for lookup
      allMacros = [...systemMacros, ...personalMacros];
    } catch (error) {
      console.error('Error loading macros from API:', error);
      systemMacros = [];
      personalMacros = [];
      allMacros = [];
    } finally {
      macrosLoading = false;
    }
  }

  // Get unique categories from macros for a given scope
  function getSystemCategories() {
    const categories = new Set();
    systemMacros.forEach(m => {
      if (m.category) categories.add(m.category);
    });
    return Array.from(categories).sort();
  }

  function getPersonalCategories() {
    const categories = new Set();
    personalMacros.forEach(m => {
      if (m.category) categories.add(m.category);
    });
    return Array.from(categories).sort();
  }
  
  function toggleVoice() {
    if (!isSupported || !voiceEnabled) {
      if (!voiceEnabled) {
        statusMessage = 'Voice recognition disabled in settings';
      }
      return;
    }
    
    if (isListening) {
      enhancedVoiceService.stopListening();
    } else {
      enhancedVoiceService.startListening();
    }
  }
  
  function resetErrors() {
    errorCount = 0;
    statusMessage = 'Ready';
  }
  
  async function manualReconnect() {
    if (isReconnecting) return;
    
    statusMessage = 'Manually reconnecting...';
    connectionStatus = 'reconnecting';
    isReconnecting = true;
    
    try {
      const success = await enhancedVoiceService.initializeWhisper();
      if (success) {
        connectionStatus = 'connected';
        statusMessage = 'Reconnected successfully!';
        isReconnecting = false;
      } else {
        connectionStatus = 'disconnected';
        statusMessage = 'Reconnection failed - check voice server';
        isReconnecting = false;
      }
    } catch (error) {
      connectionStatus = 'disconnected';
      statusMessage = 'Reconnection error: ' + error.message;
      isReconnecting = false;
    }
  }
  
  function disconnectVoice() {
    enhancedVoiceService.stopListening();
    connectionStatus = 'disconnected';
    statusMessage = 'Disconnected';
  }
  
  function executeQuickCommand(command) {
    if (!voiceEnabled) {
      statusMessage = 'Voice recognition disabled in settings';
      return;
    }
    // Execute quick command through enhanced voice service
    enhancedVoiceService.processCommand(command, 1.0);
  }
  
  // Insert macro content directly into the editor
  function insertMacroContent(macro) {
    if (!macro || !macro.content) return;
    
    // Process any variables in the macro content
    let content = macroStore.processContent(macro.content, {});
    
    // Insert content into the active editor
    enhancedVoiceService.insertText(content);
    
    // Show feedback
    statusMessage = `Inserted: ${macro.name}`;
    setTimeout(() => {
      if (statusMessage === `Inserted: ${macro.name}`) {
        statusMessage = 'Ready';
      }
    }, 2000);
  }
  
  // Toggle a macro in the quick buttons list
  function toggleMacroInQuickButtons(macroId) {
    const index = quickButtonMacroIds.indexOf(macroId);
    if (index >= 0) {
      // Remove from list
      quickButtonMacroIds = quickButtonMacroIds.filter(id => id !== macroId);
    } else {
      // Add to list (max 6 buttons)
      if (quickButtonMacroIds.length < 6) {
        quickButtonMacroIds = [...quickButtonMacroIds, macroId];
      } else {
        statusMessage = 'Maximum 6 quick buttons allowed';
        setTimeout(() => { statusMessage = 'Ready'; }, 2000);
        return;
      }
    }
    
    // Save to settings
    saveQuickButtonConfig();
  }
  
  // Save quick button configuration to settings
  function saveQuickButtonConfig() {
    if (!settingsServiceRef) return;
    
    const newSettings = {
      ...settingsServiceRef.settings,
      voice: {
        ...settingsServiceRef.settings.voice,
        quickButtonMacroIds: quickButtonMacroIds
      }
    };
    
    settingsServiceRef.saveSettings(newSettings);
  }
  
  // Get icon for macro category
  function getMacroIcon(macro) {
    const categoryIcons = {
      'General': '📝',
      'Chest': '🫁',
      'chest': '🫁',
      'Neuro': '🧠',
      'neuro': '🧠',
      'Abdomen': '🫃',
      'abdomen': '🫃',
      'MSK': '🦴',
      'msk': '🦴',
      'Musculoskeletal': '🦴',
      'musculoskeletal': '🦴',
      'Spine': '🦴',
      'spine': '🦴',
      'Procedures': '💉',
      'procedures': '💉',
      'Impressions': '💭',
      'impressions': '💭'
    };
    return categoryIcons[macro.category] || '📄';
  }

  // Expose toggleVoice function for parent component access
  export { toggleVoice };
</script>

<div class="voice-control">
  <div class="voice-header">
    <div class="voice-status">
      <div class="status-indicator {isListening ? 'listening' : ''} {!isSupported ? 'disabled' : ''}">
        <span class="mic-icon">🎤</span>
      </div>
      <div class="status-text">
        <div class="status-main">{statusMessage}</div>
        {#if confidence > 0}
          <div class="confidence">Confidence: {confidence}%</div>
        {/if}
      </div>
    </div>
    
    <div class="voice-controls">
      <!-- Connection status badge -->
      <div class="connection-badge {connectionStatus}">
        {#if connectionStatus === 'connected'}
          <span class="badge-icon">🟢</span> Connected
        {:else if connectionStatus === 'reconnecting'}
          <span class="badge-icon spinning">🔄</span> Reconnecting ({reconnectAttempt}/{maxReconnectAttempts})
        {:else if connectionStatus === 'initializing'}
          <span class="badge-icon spinning">⏳</span> Initializing...
        {:else}
          <span class="badge-icon">🔴</span> Disconnected
        {/if}
      </div>
      
      <div class="control-buttons">
        <Tooltip 
          text={isListening ? 'Stop voice dictation' : 'Start voice dictation'} 
          shortcut="Ctrl+Shift+V"
          position="bottom"
        >
          <button 
            class="voice-toggle {isListening ? 'listening' : ''}" 
            on:click={toggleVoice}
            disabled={!isSupported || connectionStatus !== 'connected'}
          >
            {isListening ? 'Stop' : 'Dictate'}
          </button>
        </Tooltip>
        
        <!-- Manual Reconnect Button - show when disconnected or can be used anytime -->
        {#if connectionStatus === 'disconnected' || connectionStatus === 'reconnecting'}
          <Tooltip text="Manually reconnect to voice server" position="bottom">
            <button 
              class="reconnect-btn" 
              on:click={manualReconnect}
              disabled={isReconnecting}
            >
              {isReconnecting ? '🔄 Reconnecting...' : '🔌 Reconnect'}
            </button>
          </Tooltip>
        {/if}
        
        {#if errorCount > 0}
          <Tooltip text="Reset voice recognition errors" position="bottom">
            <button class="reset-btn" on:click={resetErrors}>
              Reset
            </button>
          </Tooltip>
        {/if}
      </div>
    </div>
  </div>
  
  {#if lastCommand}
    <div class="last-command">
      <strong>Last command:</strong> "{lastCommand}"
      {#if confidence > 0}
        <span class="confidence-badge">{confidence}%</span>
      {/if}
    </div>
  {/if}
  
  {#if !isSupported}
    <div class="unsupported-message">
      <p>🚫 Medical voice recognition is not available.</p>
      <p>Please ensure your browser supports modern voice features.</p>
    </div>
  {:else}
    <div class="quick-commands">
      <div class="section-header">
        <h4>My Shortcuts</h4>
        <div class="section-controls">
          <Tooltip text="Configure my shortcuts (pick from system or personal macros)" position="left">
            <button 
              class="config-btn" 
              on:click={() => showMacroPicker = true}
            >
              ⚙️
            </button>
          </Tooltip>
          <Tooltip 
            text={showCommands ? 'Hide command reference' : 'Show command reference'} 
            position="left"
          >
            <button 
              class="toggle-commands" 
              on:click={() => showCommands = !showCommands}
            >
              {showCommands ? '−' : '+'}
            </button>
          </Tooltip>
        </div>
      </div>
      
      <div class="command-grid">
        {#if macrosLoading}
          <div class="no-buttons-hint">Loading macros...</div>
        {:else if quickButtonMacros.length === 0}
          <div class="no-buttons-hint">
            Click ⚙️ to add up to 6 shortcuts from system or personal macros
          </div>
        {:else}
          {#each quickButtonMacros as macro}
            <Tooltip text={`Insert: ${macro.content.substring(0, 50)}...`} position="top" delay={400}>
              <button 
                class="quick-command-btn" 
                on:click={() => insertMacroContent(macro)}
              >
                <span class="cmd-icon">{getMacroIcon(macro)}</span>
                <span class="cmd-label">{macro.name.length > 12 ? macro.name.substring(0, 10) + '...' : macro.name}</span>
              </button>
            </Tooltip>
          {/each}
        {/if}
      </div>
      
      {#if showCommands}
        <div class="all-commands">
          <h5>Complete Voice Commands Guide</h5>
          <div class="command-list">
            <div class="command-category">
              <strong>⚡ Smart Auto-Punctuation:</strong>
              <ul>
                <li><strong>Automatic:</strong> Periods (.), commas (,), and question marks (?) are inserted automatically by AI as you speak naturally</li>
                <li><strong>Manual commands below:</strong> Only for special punctuation (semicolons, colons, quotes, etc.) that AI doesn't auto-detect</li>
              </ul>
            </div>

            <div class="command-category">
              <strong>Smart Formatting (Automatic):</strong>
              <ul>
                <li>"19.5 centimeters" → 19.5cm (measurements)</li>
                <li>"5 to 10 millimeters" → 5-10mm (ranges)</li>
                <li>"approximately 5 cm" → ~5cm (modifiers)</li>
                <li>"up to 15 millimeters" → ≤15mm (limits)</li>
                <li>"January 15 twenty twenty five" → 15/01/2025 (dates - Ghana format)</li>
                <li>"today" / "yesterday" → DD/MM/YYYY (dates)</li>
                <li>"two o'clock position" → 2 o'clock (clock positions)</li>
              </ul>
            </div>
            
            <div class="command-category">
              <strong>Section Navigation:</strong>
              <ul>
                <li>"go to comparison" - Move to comparison section</li>
                <li>"go to technique" - Move to technique section</li>
                <li>"go to findings" - Move to findings section</li>
                <li>"go to impression" - Move to impression section</li>
                <li>"next section" - Move to next section</li>
                <li>"previous section" - Go back one section</li>
                <li>"go to start" - Jump to document start</li>
                <li>"go to end" - Jump to document end</li>
              </ul>
            </div>
            
            <div class="command-category">
              <strong>Manual Punctuation (Special Characters):</strong>
              <ul>
                <li>"question mark" - Insert ?</li>
                <li>"exclamation mark" - Insert !</li>
                <li>"semicolon" - Insert ;</li>
                <li>"insert colon" - Insert : (say "insert" to avoid anatomy term "colon")</li>
                <li>"open quote" / "close quote" - Insert " "</li>
                <li>"open brackets" / "close brackets" - Insert ( )</li>
                <li>"bullet point" - Start bullet list</li>
              </ul>
            </div>
            
            <div class="command-category">
              <strong>Text Formatting:</strong>
              <ul>
                <li>"bold that" - Bold last phrase or selected text</li>
                <li>"italicize that" - Italicize last phrase or selected text</li>
                <li>"underline that" - Underline last phrase or selected text</li>
                <li>"new paragraph" - Insert paragraph break</li>
                <li>"new line" - Insert line break</li>
              </ul>
            </div>
            
            <div class="command-category">
              <strong>Editing:</strong>
              <ul>
                <li>"delete that" - Delete highlighted text (highlight text first, then say "delete that")</li>
              </ul>
            </div>
            
            <div class="command-category">
              <strong>Templates & Macros:</strong>
              <ul>
                <li>"macro [name]" - Insert saved macro by name</li>
                <li>"template [name]" - Load medical template</li>
              </ul>
            </div>
            
            <div class="command-category">
              <strong>Report Actions:</strong>
              <ul>
                <li>"save draft" - Save current report as draft</li>
                <li>"finalize report" - Finalize and save report</li>
                <li>"clear section" - Clear current section</li>
                <li>"stop listening" - Pause voice recognition</li>
              </ul>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Macro Picker Modal -->
{#if showMacroPicker}
  <div class="modal-overlay" on:click={() => showMacroPicker = false} on:keydown={(e) => e.key === 'Escape' && (showMacroPicker = false)}>
    <div class="macro-picker-modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Configure My Shortcuts</h3>
        <button class="close-btn" on:click={() => showMacroPicker = false}>×</button>
      </div>
      
      <div class="modal-body">
        <p class="picker-hint">Select up to 6 macros from System or Personal. Click a macro to toggle it.</p>
        
        <div class="selected-count">
          <span class="count-badge {quickButtonMacroIds.length >= 6 ? 'full' : ''}">{quickButtonMacroIds.length}/6</span> selected
        </div>
        
        <!-- System Macros Section -->
        {#if systemMacros.length > 0}
          <div class="pool-section">
            <h4 class="pool-title">System Macros</h4>
            <div class="macro-categories">
              {#each getSystemCategories() as category}
                <div class="category-section">
                  <h5 class="category-title">{category}</h5>
                  <div class="macro-list">
                    {#each systemMacros.filter(m => m.category === category) as macro}
                      <button 
                        class="macro-item {quickButtonMacroIds.includes(macro.id) ? 'selected' : ''}"
                        on:click={() => toggleMacroInQuickButtons(macro.id)}
                        disabled={!quickButtonMacroIds.includes(macro.id) && quickButtonMacroIds.length >= 6}
                      >
                        <span class="macro-icon">{getMacroIcon(macro)}</span>
                        <div class="macro-info">
                          <span class="macro-name">{macro.name}</span>
                          <span class="macro-preview">{macro.content.substring(0, 40)}...</span>
                        </div>
                        {#if quickButtonMacroIds.includes(macro.id)}
                          <span class="check-mark">✓</span>
                        {/if}
                      </button>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Personal Macros Section -->
        {#if personalMacros.length > 0}
          <div class="pool-section">
            <h4 class="pool-title">Personal Macros</h4>
            <div class="macro-categories">
              {#each getPersonalCategories() as category}
                <div class="category-section">
                  <h5 class="category-title">{category}</h5>
                  <div class="macro-list">
                    {#each personalMacros.filter(m => m.category === category) as macro}
                      <button 
                        class="macro-item {quickButtonMacroIds.includes(macro.id) ? 'selected' : ''}"
                        on:click={() => toggleMacroInQuickButtons(macro.id)}
                        disabled={!quickButtonMacroIds.includes(macro.id) && quickButtonMacroIds.length >= 6}
                      >
                        <span class="macro-icon">{getMacroIcon(macro)}</span>
                        <div class="macro-info">
                          <span class="macro-name">{macro.name}</span>
                          <span class="macro-preview">{macro.content.substring(0, 40)}...</span>
                        </div>
                        {#if quickButtonMacroIds.includes(macro.id)}
                          <span class="check-mark">✓</span>
                        {/if}
                      </button>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {:else if systemMacros.length === 0}
          <div class="empty-pools">
            <p>No macros available. Create macros in the Macros page.</p>
          </div>
        {/if}
      </div>
      
      <div class="modal-footer">
        <button class="done-btn" on:click={() => showMacroPicker = false}>Done</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .voice-control {
    background: transparent;
    border-radius: 0.75rem;
    padding: 0;
    box-shadow: none;
    border: none;
    color: var(--color-text, #000000) !important;
  }
  
  .voice-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border, #f3f4f6);
    background: var(--color-surface, #ffffff);
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid var(--color-border, #e5e7eb);
  }
  
  .voice-status {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .status-indicator {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface-elevated, #ffffff);
    border: 2px solid var(--color-border, #e2e8f0);
    transition: all 0.3s ease;
    color: var(--color-text-primary, #1e293b);
  }
  
  .status-indicator.listening {
    background: var(--color-danger, #ffebee);
    border-color: var(--color-danger, #e57373);
    animation: pulse 1.5s infinite;
  }
  
  .status-indicator.disabled {
    background: var(--color-surface, #f5f5f5);
    border-color: var(--color-text-muted, #d6d3d1);
    opacity: 0.6;
  }
  
  .mic-icon {
    font-size: 1.2rem;
  }
  
  .status-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .status-main {
    font-weight: 600;
    color: var(--color-text-primary, #1e293b);
    font-size: 0.9rem;
  }
  
  .confidence {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #475569);
  }
  
  .voice-controls {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-end;
  }
  
  .control-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  
  .connection-badge {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
    font-size: 0.7rem;
    font-weight: 600;
    white-space: nowrap;
  }
  
  .connection-badge.connected {
    background: #dcfce7;
    color: #166534;
    border: 1px solid #86efac;
  }
  
  .connection-badge.disconnected {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  }
  
  .connection-badge.reconnecting {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
  }
  
  .connection-badge.initializing {
    background: #dbeafe;
    color: #1e40af;
    border: 1px solid #93c5fd;
  }
  
  .badge-icon {
    font-size: 0.65rem;
  }
  
  .badge-icon.spinning {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .reconnect-btn {
    padding: 0.5rem 0.75rem;
    border: 1px solid #3b82f6;
    border-radius: 0.5rem;
    background: #eff6ff;
    color: #1e40af;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
    white-space: nowrap;
  }
  
  .reconnect-btn:hover:not(:disabled) {
    background: #3b82f6;
    color: white;
    transform: translateY(-1px);
  }
  
  .reconnect-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  .voice-toggle {
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 0.5rem;
    background: var(--color-surface-elevated, #ffffff);
    color: var(--color-text-primary, #1e293b);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
  }
  
  .voice-toggle:hover:not(:disabled) {
    background: var(--color-primary, #f9fafb);
    border-color: var(--color-border, #9ca3af);
  }
  
  .voice-toggle.listening {
    background: var(--color-danger, #dc2626);
    color: white;
    border-color: var(--color-danger, #dc2626);
  }
  
  .voice-toggle:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .reset-btn {
    padding: 0.5rem;
    border: 1px solid var(--color-warning, #f59e0b);
    border-radius: 0.5rem;
    background: var(--color-warning-light, #fef3c7);
    color: var(--color-text-primary, #1e293b);
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 600;
    transition: all 0.2s;
  }
  
  .reset-btn:hover {
    background: var(--color-primary, #fde68a);
  }
  
  .last-command {
    padding: 0.75rem;
    background: var(--color-info-light, #dbeafe);
    border: 1px solid var(--color-primary, #3b82f6);
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-text-primary, #1e293b);
  }
  
  .confidence-badge {
    background: var(--color-success, #10b981);
    color: white;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .unsupported-message {
    text-align: center;
    padding: 2rem;
    color: var(--color-text-muted, #64748b);
  }
  
  .quick-commands {
    margin-top: 1rem;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  
  .section-header h4 {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-primary, #1e293b);
    font-weight: 600;
  }
  
  .toggle-commands {
    width: 24px;
    height: 24px;
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 0.25rem;
    background: var(--color-surface-elevated, #ffffff);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--color-text-secondary, #475569);
  }
  
  .command-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .quick-command-btn {
    padding: 0.75rem 0.5rem;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    background: var(--color-surface-elevated, #ffffff);
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    text-align: center;
    color: var(--color-text-primary, #1e293b);
  }
  
  .quick-command-btn:hover {
    background: var(--color-primary, #f8fafc);
    border-color: var(--color-primary, #3b82f6);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .cmd-icon {
    font-size: 1.2rem;
    color: var(--color-text-primary, #1e293b);
  }
  
  .cmd-label {
    font-size: 0.75rem;
    color: var(--color-text-primary, #1e293b);
    font-weight: 600;
  }
  
  .all-commands {
    background: var(--color-background-secondary, #f8fafc);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    padding: 1rem;
    margin-top: 1rem;
    color: var(--color-text-primary, #1e293b);
  }
  
  .all-commands h5 {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    color: var(--color-text-primary, #1e293b);
  }
  
  .command-list {
    display: grid;
    gap: 0.75rem;
    color: var(--color-text-primary, #1e293b);
  }
  
  .command-category {
    font-size: 0.8rem;
    color: var(--color-text-primary, #1e293b);
  }
  
  .command-category strong {
    color: var(--color-text-primary, #1e293b);
    display: block;
    margin-bottom: 0.25rem;
  }
  
  .command-category ul {
    margin: 0;
    padding-left: 1.25rem;
    color: var(--color-text-secondary, #475569);
  }
  
  .command-category li {
    margin-bottom: 0.125rem;
  }
  
  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.8; }
    100% { transform: scale(1); opacity: 1; }
  }
  
  @media (max-width: 768px) {
    .voice-header {
      flex-direction: column;
      gap: 0.75rem;
      align-items: stretch;
    }
    
    .voice-status {
      justify-content: center;
    }
    
    .command-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  /* Section controls with config button */
  .section-controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  
  .config-btn {
    background: transparent;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.375rem;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s;
  }
  
  .config-btn:hover {
    background: var(--color-surface-hover, #f3f4f6);
    border-color: var(--color-primary, #3b82f6);
  }
  
  .no-buttons-hint {
    grid-column: 1 / -1;
    text-align: center;
    color: var(--color-text-muted, #9ca3af);
    font-size: 0.875rem;
    padding: 1rem;
    background: var(--color-surface, #f9fafb);
    border-radius: 0.5rem;
    border: 1px dashed var(--color-border, #e5e7eb);
  }
  
  /* Macro Picker Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(2px);
  }
  
  .macro-picker-modal {
    background: var(--color-background, #ffffff);
    border-radius: 0.75rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
  }
  
  .modal-header h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary, #1e293b);
  }
  
  .close-btn {
    background: transparent;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--color-text-muted, #9ca3af);
    padding: 0;
    line-height: 1;
  }
  
  .close-btn:hover {
    color: var(--color-text-primary, #1e293b);
  }
  
  .modal-body {
    padding: 1rem 1.25rem;
    overflow-y: auto;
    flex: 1;
  }
  
  .picker-hint {
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary, #64748b);
  }
  
  .selected-count {
    margin-bottom: 1rem;
    font-size: 0.875rem;
    color: var(--color-text-secondary, #64748b);
  }
  
  .count-badge {
    display: inline-block;
    background: var(--color-primary, #3b82f6);
    color: white;
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    font-weight: 600;
  }
  
  .count-badge.full {
    background: var(--color-warning, #f59e0b);
  }
  
  .macro-categories {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .category-section {
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    overflow: hidden;
  }
  
  .category-title {
    margin: 0;
    padding: 0.5rem 0.75rem;
    background: var(--color-surface, #f9fafb);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-primary, #1e293b);
    border-bottom: 1px solid var(--color-border, #e5e7eb);
  }
  
  .macro-list {
    display: flex;
    flex-direction: column;
  }
  
  .macro-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.75rem;
    background: var(--color-background, #ffffff);
    border: none;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;
    width: 100%;
  }
  
  .macro-item:last-child {
    border-bottom: none;
  }
  
  .macro-item:hover:not(:disabled) {
    background: var(--color-surface-hover, #f3f4f6);
  }
  
  .macro-item.selected {
    background: var(--color-primary-light, #eff6ff);
    border-left: 3px solid var(--color-primary, #3b82f6);
  }
  
  .macro-item:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .macro-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }
  
  .macro-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }
  
  .macro-name {
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--color-text-primary, #1e293b);
  }
  
  .macro-preview {
    font-size: 0.75rem;
    color: var(--color-text-muted, #9ca3af);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .check-mark {
    color: var(--color-primary, #3b82f6);
    font-weight: bold;
    font-size: 1rem;
  }
  
  .modal-footer {
    padding: 0.75rem 1.25rem;
    border-top: 1px solid var(--color-border, #e5e7eb);
    display: flex;
    justify-content: flex-end;
  }
  
  .done-btn {
    background: var(--color-primary, #3b82f6);
    color: white;
    border: none;
    padding: 0.5rem 1.25rem;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
  }
  
  .done-btn:hover {
    background: var(--color-primary-dark, #2563eb);
  }

  .pool-section {
    margin-bottom: 1.5rem;
  }

  .pool-title {
    margin: 0 0 0.75rem 0;
    padding: 0.5rem 0.75rem;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: 0.375rem;
  }

  .empty-pools {
    text-align: center;
    padding: 2rem;
    color: var(--color-text-muted, #6b7280);
  }

  /* Dark mode styles */
  :global([data-theme="dark"]) .section-header h4 {
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .modal-content,
  :global([data-theme="dark"]) .macro-picker-modal {
    background: #1e293b;
    border-color: #334155;
  }

  :global([data-theme="dark"]) .modal-header {
    border-bottom-color: #334155;
  }

  :global([data-theme="dark"]) .modal-header h3 {
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .modal-footer {
    border-top-color: #334155;
  }

  :global([data-theme="dark"]) .picker-hint {
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .category-section {
    border-color: #334155;
  }

  :global([data-theme="dark"]) .category-title {
    background: #0f172a;
    color: #f1f5f9;
    border-bottom-color: #334155;
  }

  :global([data-theme="dark"]) .macro-item {
    background: #1e293b;
    border-bottom-color: #334155;
  }

  :global([data-theme="dark"]) .macro-item:hover:not(:disabled) {
    background: #334155;
  }

  :global([data-theme="dark"]) .macro-item.selected {
    background: #1e3a5f;
  }

  :global([data-theme="dark"]) .macro-name {
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .macro-preview {
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .all-commands h5,
  :global([data-theme="dark"]) .command-category strong {
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .command-category li {
    color: #cbd5e1;
  }

  :global([data-theme="dark"]) .no-buttons-hint {
    color: #94a3b8;
  }
</style>