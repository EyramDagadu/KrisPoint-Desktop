<!-- src/lib/components/VoiceTest.svelte -->
<script>
    import { onMount } from 'svelte';
    import { voiceCommandService } from '../services/VoiceCommandService.js';
    import { reportData, uiState, reportActions, uiActions } from '../stores/reportStore.js';

    let isSupported = false;
    let isListening = false;
    let status = 'Initializing...';
    let lastCommand = '';
    let testResults = [];

    onMount(() => {
        // Check if voice commands are supported
        isSupported = voiceCommandService.isVoiceSupported();
        
        if (isSupported) {
            status = 'Voice commands ready';
            
            // Set up callbacks for testing
            voiceCommandService.setCallbacks({
                onStart: () => {
                    isListening = true;
                    status = 'Listening...';
                },
                onEnd: () => {
                    isListening = false;
                    status = 'Processing...';
                    setTimeout(() => {
                        status = 'Ready';
                    }, 1000);
                },
                onResult: (transcript) => {
                    lastCommand = transcript;
                    status = `Received: "${transcript}"`;
                    
                    // Add to test results
                    testResults = [...testResults, {
                        timestamp: new Date().toLocaleTimeString(),
                        command: transcript,
                        success: true
                    }].slice(-10); // Keep last 10 results
                },
                onError: (error) => {
                    isListening = false;
                    status = `Error: ${error}`;
                    
                    // Add error to test results
                    testResults = [...testResults, {
                        timestamp: new Date().toLocaleTimeString(),
                        command: 'ERROR',
                        success: false,
                        error
                    }].slice(-10);
                }
            });
        } else {
            status = 'Voice recognition not supported in this browser';
        }
    });

    function toggleVoice() {
        if (!isSupported) {
            alert('Voice recognition is not supported in your browser. Please use Chrome, Firefox, or Edge.');
            return;
        }

        const success = voiceCommandService.toggleListening();
        if (!success) {
            alert('Failed to start voice recognition. Please check your microphone permissions.');
        }
    }

    function testCommand(command) {
        // Simulate voice command for testing
        voiceCommandService.processCommand(command);
        testResults = [...testResults, {
            timestamp: new Date().toLocaleTimeString(),
            command: command + ' (manual test)',
            success: true
        }].slice(-10);
    }

    function clearResults() {
        testResults = [];
    }

    function clearReport() {
        reportActions.clearReport();
    }
</script>

<div class="voice-test">
    <div class="test-header">
        <h2>🎤 Voice Command Testing</h2>
        <div class="status-indicator" class:listening={isListening} class:supported={isSupported}>
            {status}
        </div>
    </div>

    <div class="test-controls">
        <button 
            class="voice-btn" 
            class:listening={isListening} 
            on:click={toggleVoice}
            disabled={!isSupported}
        >
            {isListening ? '🔴 Stop Listening' : '🎤 Start Voice Recognition'}
        </button>

        <button class="clear-btn" on:click={clearResults}>
            Clear Test Results
        </button>

        <button class="clear-btn" on:click={clearReport}>
            Clear Report
        </button>
    </div>

    <div class="test-grid">
        <!-- Test Buttons -->
        <div class="test-section">
            <h3>Quick Test Commands</h3>
            <div class="test-buttons">
                <button class="test-cmd-btn" on:click={() => testCommand('go to findings')}>
                    Go to Findings
                </button>
                <button class="test-cmd-btn" on:click={() => testCommand('macro normal lungs')}>
                    Macro Normal Lungs
                </button>
                <button class="test-cmd-btn" on:click={() => testCommand('start bullet')}>
                    Start Bullet
                </button>
                <button class="test-cmd-btn" on:click={() => testCommand('clinical correlation')}>
                    Clinical Correlation
                </button>
                <button class="test-cmd-btn" on:click={() => testCommand('template ct head normal')}>
                    Template CT Head
                </button>
                <button class="test-cmd-btn" on:click={() => testCommand('save report')}>
                    Save Report
                </button>
            </div>
        </div>

        <!-- Current State Display -->
        <div class="test-section">
            <h3>Current State</h3>
            <div class="state-display">
                <div class="state-item">
                    <strong>Current Section:</strong> {$uiState.currentSection}
                </div>
                <div class="state-item">
                    <strong>Last Command:</strong> {lastCommand || 'None'}
                </div>
                <div class="state-item">
                    <strong>Voice Enabled:</strong> {$uiState.isVoiceEnabled ? 'Yes' : 'No'}
                </div>
                <div class="state-item">
                    <strong>Listening:</strong> {isListening ? 'Yes' : 'No'}
                </div>
            </div>
        </div>
    </div>

    <!-- Test Results -->
    <div class="test-section">
        <h3>Test Results</h3>
        <div class="results-list">
            {#each testResults as result}
                <div class="result-item" class:success={result.success} class:error={!result.success}>
                    <span class="timestamp">{result.timestamp}</span>
                    <span class="command">{result.command}</span>
                    {#if result.error}
                        <span class="error-msg">Error: {result.error}</span>
                    {/if}
                </div>
            {/each}
            {#if testResults.length === 0}
                <div class="no-results">
                    No test results yet. Try the voice commands above or speak a command.
                </div>
            {/if}
        </div>
    </div>

    <!-- Current Report Content -->
    <div class="test-section">
        <h3>Current Report Content</h3>
        <div class="report-preview">
            <div class="section-preview">
                <strong>Comparison:</strong> {$reportData.comparison || '(empty)'}
            </div>
            <div class="section-preview">
                <strong>Technique:</strong> {$reportData.technique || '(empty)'}
            </div>
            <div class="section-preview">
                <strong>Findings:</strong> {$reportData.findings || '(empty)'}
            </div>
            <div class="section-preview">
                <strong>Impression:</strong> {$reportData.impression || '(empty)'}
            </div>
        </div>
    </div>

    <!-- Command Reference -->
    <div class="test-section">
        <h3>Available Voice Commands</h3>
        <div class="commands-reference">
            <div class="command-category">
                <h4>Navigation</h4>
                <ul>
                    <li>"Go to comparison/technique/findings/impression"</li>
                    <li>"Next section"</li>
                </ul>
            </div>
            <div class="command-category">
                <h4>Macros</h4>
                <ul>
                    <li>"Macro normal lungs/heart/brain/chest"</li>
                    <li>"Clinical correlation"</li>
                    <li>"Normal limits"</li>
                    <li>"No acute"</li>
                </ul>
            </div>
            <div class="command-category">
                <h4>Templates</h4>
                <ul>
                    <li>"Template CT Head Normal"</li>
                    <li>"Template Chest X-ray Normal"</li>
                    <li>"Template CT Abdomen Normal"</li>
                </ul>
            </div>
            <div class="command-category">
                <h4>Formatting</h4>
                <ul>
                    <li>"Start bullet" / "Bullet point"</li>
                    <li>"Start numbering"</li>
                    <li>"Next line"</li>
                    <li>"New paragraph"</li>
                </ul>
            </div>
            <div class="command-category">
                <h4>Actions</h4>
                <ul>
                    <li>"Save report"</li>
                    <li>"Clear section"</li>
                </ul>
            </div>
        </div>
    </div>
</div>

<style>
    .voice-test {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        font-family: system-ui, sans-serif;
    }

    .test-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #dee2e6;
    }

    .test-header h2 {
        margin: 0;
        color: #333;
    }

    .status-indicator {
        padding: 0.5rem 1rem;
        border-radius: 8px;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        font-weight: 500;
        font-size: 0.9rem;
    }

    .status-indicator.listening {
        background: #dc3545;
        color: white;
        animation: pulse 1.5s infinite;
    }

    .status-indicator.supported {
        background: #28a745;
        color: white;
    }

    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
    }

    .test-controls {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
    }

    .voice-btn {
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        font-weight: 600;
        border: 2px solid #007bff;
        border-radius: 8px;
        background: white;
        color: #007bff;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .voice-btn:hover {
        background: #007bff;
        color: white;
    }

    .voice-btn.listening {
        background: #dc3545;
        border-color: #dc3545;
        color: white;
    }

    .voice-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .clear-btn {
        padding: 0.5rem 1rem;
        border: 1px solid #6c757d;
        border-radius: 6px;
        background: white;
        color: #6c757d;
        cursor: pointer;
        font-size: 0.9rem;
    }

    .clear-btn:hover {
        background: #6c757d;
        color: white;
    }

    .test-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-bottom: 2rem;
    }

    .test-section {
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .test-section h3 {
        margin: 0 0 1rem 0;
        color: #333;
        font-size: 1.1rem;
        font-weight: 600;
    }

    .test-buttons {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.5rem;
    }

    .test-cmd-btn {
        padding: 0.5rem 1rem;
        border: 1px solid #28a745;
        border-radius: 6px;
        background: white;
        color: #28a745;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s ease;
    }

    .test-cmd-btn:hover {
        background: #28a745;
        color: white;
    }

    .state-display {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .state-item {
        padding: 0.5rem;
        background: #f8f9fa;
        border-radius: 4px;
        font-size: 0.9rem;
    }

    .results-list {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        background: #f8f9fa;
    }

    .result-item {
        display: flex;
        gap: 1rem;
        padding: 0.5rem 1rem;
        border-bottom: 1px solid #dee2e6;
        font-size: 0.9rem;
    }

    .result-item.success {
        background: #d4edda;
        border-left: 3px solid #28a745;
    }

    .result-item.error {
        background: #f8d7da;
        border-left: 3px solid #dc3545;
    }

    .timestamp {
        font-family: monospace;
        color: #6c757d;
        min-width: 80px;
    }

    .command {
        flex: 1;
        font-weight: 500;
    }

    .error-msg {
        color: #dc3545;
        font-style: italic;
    }

    .no-results {
        padding: 2rem;
        text-align: center;
        color: #6c757d;
        font-style: italic;
    }

    .report-preview {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .section-preview {
        padding: 0.75rem;
        background: #f8f9fa;
        border-radius: 6px;
        font-size: 0.9rem;
        border-left: 3px solid #007bff;
    }

    .section-preview strong {
        color: #007bff;
        display: block;
        margin-bottom: 0.5rem;
    }

    .commands-reference {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
    }

    .command-category h4 {
        margin: 0 0 0.5rem 0;
        color: #007bff;
        font-size: 1rem;
    }

    .command-category ul {
        margin: 0;
        padding-left: 1.5rem;
        list-style: disc;
    }

    .command-category li {
        margin-bottom: 0.25rem;
        font-size: 0.9rem;
        font-family: monospace;
        color: #6c757d;
    }

    /* Responsive design */
    @media (max-width: 768px) {
        .voice-test {
            padding: 1rem;
        }

        .test-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
        }

        .test-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
        }

        .test-buttons {
            grid-template-columns: 1fr;
        }

        .test-controls {
            justify-content: center;
        }

        .commands-reference {
            grid-template-columns: 1fr;
        }

        .result-item {
            flex-direction: column;
            gap: 0.25rem;
        }

        .timestamp {
            min-width: auto;
        }
    }
</style>