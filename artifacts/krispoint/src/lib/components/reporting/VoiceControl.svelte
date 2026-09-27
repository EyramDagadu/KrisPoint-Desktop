<!-- src/lib/components/reporting/VoiceControl.svelte -->
<script>
  import { uiState } from '$lib/stores/reportStore';
  
  let isListening = false;
  let lastCommand = '';
  
  // Core voice commands - medical phrases are handled via user-created macros
  const voiceCommands = [
    { command: 'go to comparison', description: 'Navigate to Comparison section' },
    { command: 'go to findings', description: 'Navigate to Findings section' },
    { command: 'go to impression', description: 'Navigate to Impression section' },
    { command: 'go to technique', description: 'Navigate to Technique section' },
    { command: 'new paragraph', description: 'Insert paragraph break' },
    { command: 'bullet point', description: 'Insert bullet point' },
    { command: 'new line', description: 'Insert line break' },
    { command: 'insert macro [name]', description: 'Insert a user-created macro' },
    { command: 'save report', description: 'Save the current report' },
    { command: 'clear section', description: 'Clear current section' }
  ];
  
  function toggleVoice() {
    isListening = !isListening;
    
    if (isListening) {
      // Simulate voice recognition start
      console.log('Voice recognition started');
      // In a real implementation, you would integrate with Web Speech API
    } else {
      // Simulate voice recognition stop
      console.log('Voice recognition stopped');
    }
  }
  
  function simulateVoiceCommand(command) {
    lastCommand = command;
    // Simulate processing a voice command
    setTimeout(() => {
      if (lastCommand === command) {
        lastCommand = '';
      }
    }, 3000);
  }
</script>

<div class="voice-control">
  <div class="voice-header">
    <h3>Voice Commands</h3>
    <button 
      class="voice-toggle {isListening ? 'listening' : ''}" 
      on:click={toggleVoice}
      title={isListening ? 'Stop listening' : 'Start voice commands'}
    >
      <svg class="mic-icon" aria-hidden="true" viewBox="0 0 20 20" fill="none"><rect x="7" y="2.5" width="6" height="10" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5m-3 0h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      {isListening ? 'Listening...' : 'Voice Control'}
    </button>
  </div>
  
  {#if lastCommand}
    <div class="last-command">
      Last command: "{lastCommand}"
    </div>
  {/if}
  
  <div class="commands-list">
    <h4>Available Commands</h4>
    <div class="command-grid">
      {#each voiceCommands as cmd}
        <button 
          class="command-item" 
          on:click={() => simulateVoiceCommand(cmd.command)}
          title="Click to simulate this command"
        >
          <span class="command-text">"{cmd.command}"</span>
          <span class="command-desc">{cmd.description}</span>
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .voice-control {
    padding: 1rem;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .voice-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .voice-header h3 {
    margin: 0;
    font-size: 0.9rem;
    color: #2c3e50;
    font-weight: 600;
  }
  
  .voice-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    border: 1px solid #ddd;
    border-radius: 0.375rem;
    background: white;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
  }
  
  .voice-toggle:hover {
    background: #f8f9fa;
  }
  
  .voice-toggle.listening {
    background: #ffebee;
    border-color: #e57373;
    color: #c62828;
    animation: pulse 1.5s infinite;
  }
  
  .mic-icon {
    font-size: 1rem;
  }
  
  .last-command {
    padding: 0.5rem;
    background: #e3f2fd;
    border-radius: 0.25rem;
    margin-bottom: 1rem;
    font-size: 0.8rem;
    font-style: italic;
    text-align: center;
  }
  
  .commands-list h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.8rem;
    color: #546e7a;
    font-weight: 600;
  }
  
  .command-grid {
    display: grid;
    gap: 0.5rem;
  }
  
  .command-item {
    padding: 0.5rem;
    border: 1px solid #e9ecef;
    border-radius: 0.375rem;
    background: white;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .command-item:hover {
    background: #f8f9fa;
    border-color: #007bff;
    transform: translateY(-1px);
  }
  
  .command-text {
    font-weight: 500;
    color: #2c3e50;
    font-size: 0.75rem;
    font-family: 'Monaco', 'Menlo', monospace;
  }
  
  .command-desc {
    color: #78909c;
    font-size: 0.7rem;
  }
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
  
  @media (max-width: 768px) {
    .voice-header {
      flex-direction: column;
      gap: 0.5rem;
      align-items: stretch;
    }
    
    .command-grid {
      grid-template-columns: 1fr;
    }
  }
  .voice-control { color: var(--color-text-primary, #1e293b); }
  .voice-header h3, .commands-list h4 { color: var(--color-text-primary, #1e293b); }
  .voice-header, .commands-list, .command-item { background: var(--color-surface, #fff); border-color: var(--color-border, #dbe2ea); }
  .command-item { color: var(--color-text-primary, #1e293b); }
  .command-item:hover { background: var(--color-surface-hover, #f1f5f9); }
  .mic-icon { width: 1rem; height: 1rem; }
  :global(:focus-visible) { outline: 3px solid var(--color-primary, #3b82f6); outline-offset: 2px; }
  :global([data-theme="dark"]) .voice-header h3,
  :global([data-theme="dark"]) .commands-list h4,
  :global([data-theme="dark"]) .command-item { color: var(--color-text-primary, #f1f5f9); }
  :global([data-theme="dark"]) .voice-header,
  :global([data-theme="dark"]) .commands-list,
  :global([data-theme="dark"]) .command-item { background: var(--color-surface, #1e293b); border-color: var(--color-border, #475569); }
  :global([data-theme="dark"]) .command-item:hover { background: var(--color-surface-hover, #334155); }
  @media (max-width: 600px) { .voice-header { align-items: flex-start; flex-direction: column; gap: .75rem; } .command-grid { grid-template-columns: 1fr; } }
</style>