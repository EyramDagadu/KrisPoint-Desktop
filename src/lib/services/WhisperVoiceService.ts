// Streaming Speech Recognition Service for Medical Applications
import { browser } from '$app/environment';
import { voiceTrainingDataService } from './VoiceTrainingDataService';

declare global {
    interface Window {
        __KRISPOINT_VOICE_URL__?: string;
    }
}

export class WhisperVoiceService {
    // Property declarations for TypeScript
    isInitialized: boolean;
    isListening: boolean;
    isLoading: boolean;
    isSupported: boolean;
    websocket: WebSocket | null;
    mediaStream: MediaStream | null;
    audioContext: AudioContext | null;
    audioWorkletNode: AudioWorkletNode | null;
    source: MediaStreamAudioSourceNode | null;
    scriptProcessor: ScriptProcessorNode | null;
    serverUrl: string;
    sampleRate: number;
    confidenceThreshold: number;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    allowAutoReconnect: boolean;
    reconnectTimeoutId: number | null;
    connectionTimeoutId: number | null;
    wasListeningBeforeDisconnect: boolean;
    lastDisconnectTime: number;
    trainingDataEnabled: boolean;
    callbacks: {
        onResult?: ((result: {text: string, confidence: number, isFinal: boolean, source: string}) => void) | null;
        onPartialResult?: ((result: {text: string, confidence: number, isFinal: boolean, source: string}) => void) | null;
        onError?: ((error: string | Error) => void) | null;
        onModelLoaded?: (() => void) | null;
        onStatusChange?: ((status: string) => void) | null;
        onCommand?: ((command: string, text: string) => void) | null;
    };

    constructor() {
        this.isInitialized = false;
        this.isListening = false;
        this.isLoading = false;
        this.isSupported = false;
        this.websocket = null;
        this.mediaStream = null;
        this.audioContext = null;
        this.audioWorkletNode = null;
        this.source = null;
        this.scriptProcessor = null;

        // Configuration - Tauri publishes its authenticated URL at runtime.
        this.serverUrl = this.getWebSocketUrl();
        this.sampleRate = 16000;
        this.confidenceThreshold = 0.6;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 15; // Increased for sleep/wake recovery (up to ~2 minutes of retrying)
        this.allowAutoReconnect = false; // Will be set to true after successful initialization
        this.reconnectTimeoutId = null;
        this.connectionTimeoutId = null;
        this.wasListeningBeforeDisconnect = false;
        this.lastDisconnectTime = 0; // Track when disconnect happened for sleep detection
        this.trainingDataEnabled = false;
        
        // Callbacks
        this.callbacks = {
            onResult: null,
            onPartialResult: null,
            onError: null,
            onModelLoaded: null,
            onStatusChange: null,
            onCommand: null
        };

        // Initialize only in browser environment
        if (browser) {
            this.checkBrowserSupport();
        }
    }

    getWebSocketUrl(): string {
        if (browser && window.__KRISPOINT_VOICE_URL__) {
            return window.__KRISPOINT_VOICE_URL__;
        }

        // Hospital browser traffic stays same-origin so Vite can proxy it to
        // the private voice process without exposing its client token.
        if (browser && typeof window !== 'undefined') {
            const isSecure = window.location.protocol === 'https:';
            const protocol = isSecure ? 'wss' : 'ws';
            return `${protocol}://${window.location.host}/voice`;
        }
        
        return 'ws://localhost:5000/voice';
    }

    checkBrowserSupport() {
        try {
            // Check for WebSocket support
            if (typeof WebSocket === 'undefined') {
                console.warn('WebSocket not supported - voice recognition unavailable');
                this.isSupported = false;
                return;
            }

            // Check for Web Audio API support
            if (!window.AudioContext && !(window as any).webkitAudioContext) {
                console.warn('Web Audio API not supported - voice recognition unavailable');
                this.isSupported = false;
                return;
            }

            // Check for MediaDevices support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.warn('MediaDevices API not supported - voice recognition unavailable');
                this.isSupported = false;
                return;
            }

            this.isSupported = true;
            console.log('✅ Voice recognition supported');
        } catch (error) {
            console.error('Error checking speech recognition browser support:', error);
            this.isSupported = false;
        }
    }

    async initialize() {
        if (!this.isSupported || this.isInitialized) {
            return false;
        }

        // Tauri starts the optional voice process asynchronously during app
        // startup and publishes its dynamically selected loopback URL.
        this.serverUrl = await this.resolveServerUrl();
        this.isLoading = true;
        this.notifyStatusChange('initializing');

        try {
            console.log('Connecting to voice recognition server...');
            
            // Connect to WebSocket server
            await this.connectWebSocket();

            this.isInitialized = true;
            this.isLoading = false;
            this.allowAutoReconnect = true; // Enable auto-reconnect for unintentional disconnects
            this.notifyStatusChange('initialized');
            
            console.log('Voice service initialized successfully');
            return true;

        } catch (error) {
            console.error('Failed to initialize voice service:', error);
            this.isLoading = false;
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            this.notifyError('Failed to initialize speech recognition: ' + errorMsg);
            return false;
        }
    }

    async resolveServerUrl(): Promise<string> {
        if (!browser || !(window as any).__TAURI_INTERNALS__) {
            const response = await fetch('/api/voice/ticket', {
                credentials: 'same-origin',
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) {
                throw new Error('Unable to obtain voice connection ticket');
            }
            const body = await response.json() as { ticket?: string };
            if (!body.ticket) {
                throw new Error('Voice connection ticket was not issued');
            }
            const url = new URL(this.getWebSocketUrl());
            url.searchParams.set('ticket', body.ticket);
            return url.toString();
        }
        const { invoke } = await import('@tauri-apps/api/core');
        for (let attempt = 0; attempt < 120; attempt += 1) {
            const status = await invoke<{ url?: string }>('get_voice_server_status');
            if (status.url) {
                window.__KRISPOINT_VOICE_URL__ = status.url;
                return status.url;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        throw new Error('Local voice model did not become ready within two minutes');
    }

    async connectWebSocket(): Promise<void> {
        return new Promise((resolve, reject) => {
            let isSettled = false; // Track if promise is already resolved/rejected
            
            try {
                this.websocket = new WebSocket(this.serverUrl);

                this.websocket.onopen = () => {
                    console.log('✓ Connected to voice recognition server');
                    this.reconnectAttempts = 0;
                    
                    // Clear connection timeout on successful connection
                    if (this.connectionTimeoutId !== null) {
                        clearTimeout(this.connectionTimeoutId);
                        this.connectionTimeoutId = null;
                    }
                    
                    if (!isSettled) {
                        isSettled = true;
                        resolve();
                    }
                };

                this.websocket.onmessage = (event) => {
                    this.handleWebSocketMessage(event.data);
                };

                this.websocket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    
                    // Clear timeout on error
                    if (this.connectionTimeoutId !== null) {
                        clearTimeout(this.connectionTimeoutId);
                        this.connectionTimeoutId = null;
                    }
                    
                    if (!isSettled) {
                        isSettled = true;
                        reject(new Error('Failed to connect to voice recognition server'));
                    }
                };

                this.websocket.onclose = () => {
                    console.log('WebSocket connection closed');
                    
                    // Clear connection timeout to prevent stale timer from closing fresh socket
                    if (this.connectionTimeoutId !== null) {
                        clearTimeout(this.connectionTimeoutId);
                        this.connectionTimeoutId = null;
                    }
                    
                    // Track disconnect time to detect sleep/wake scenarios
                    const now = Date.now();
                    const timeSinceLastDisconnect = now - this.lastDisconnectTime;
                    const isSleepWake = timeSinceLastDisconnect > 30000; // 30+ seconds gap suggests computer slept
                    this.lastDisconnectTime = now;
                    
                    if (isSleepWake && this.reconnectAttempts > 0) {
                        console.log('🌙 Sleep/wake detected - resetting reconnect attempts for fresh start');
                        this.reconnectAttempts = 0; // Reset counter for sleep/wake recovery
                    }
                    
                    // Remember if we were listening before disconnect (for auto-resume)
                    // Use OR to preserve flag across multiple reconnection attempts
                    const wasListening = this.isListening;
                    
                    // Clean up resources immediately
                    this.cleanup();
                    this.isListening = false;
                    this.isInitialized = false;  // Require re-initialization
                    this.notifyStatusChange('disconnected');
                    
                    // Only attempt automatic reconnection if not intentionally disconnected (e.g., after laptop wake from sleep)
                    if (this.allowAutoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                        // Preserve listening intent across retries (OR instead of overwrite)
                        this.wasListeningBeforeDisconnect = this.wasListeningBeforeDisconnect || wasListening;
                        this.reconnectAttempts++;
                        
                        // Smart delay: shorter for first attempts, longer for later attempts
                        // Sleep/wake needs more time for voice server to restart
                        let delay: number;
                        if (this.reconnectAttempts <= 3) {
                            delay = 2000; // First 3 attempts: 2 seconds
                        } else if (this.reconnectAttempts <= 6) {
                            delay = 5000; // Attempts 4-6: 5 seconds
                        } else if (this.reconnectAttempts <= 10) {
                            delay = 8000; // Attempts 7-10: 8 seconds
                        } else {
                            delay = 10000; // Attempts 11+: 10 seconds
                        }
                        
                        console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay/1000}s...`);
                        this.notifyStatusChange(`reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                        
                        this.reconnectTimeoutId = window.setTimeout(async () => {
                            try {
                                const initialized = await this.initialize();
                                
                                // Only proceed if initialization actually succeeded
                                if (initialized) {
                                    console.log('✅ Successfully reconnected to voice server');
                                    
                                    // Auto-resume listening if we were listening before disconnect
                                    if (this.wasListeningBeforeDisconnect) {
                                        console.log('🎤 Auto-resuming voice recognition...');
                                        // Small delay to ensure connection is stable
                                        await new Promise(resolve => setTimeout(resolve, 500));
                                        const resumed = await this.startListening();
                                        if (resumed) {
                                            this.notifyStatusChange('reconnected-listening');
                                            console.log('✅ Voice recognition automatically resumed');
                                            this.wasListeningBeforeDisconnect = false; // Reset only after successful resume
                                        } else {
                                            this.notifyStatusChange('reconnected');
                                            this.notifyError('Reconnected but could not resume listening. Click Dictate to restart.');
                                            // Keep flag set for potential future retry
                                        }
                                    } else {
                                        this.notifyStatusChange('reconnected');
                                        this.wasListeningBeforeDisconnect = false; // Reset flag
                                    }
                                } else {
                                    // Initialization failed, don't reset flag - let next retry attempt resume
                                    console.warn('Reconnection attempt failed to initialize, will retry...');
                                }
                            } catch (error) {
                                console.error('Failed to reconnect:', error);
                                if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                                    this.notifyError('Voice server connection lost. Click "Initialize Voice" to reconnect.');
                                    this.wasListeningBeforeDisconnect = false; // Reset after all attempts exhausted
                                }
                            }
                        }, delay);
                    } else if (!this.allowAutoReconnect) {
                        console.log('Auto-reconnect disabled (intentional disconnect)');
                    } else {
                        this.notifyError('Voice server connection lost after 15 attempts. Click "Initialize Voice" to reconnect.');
                    }
                };

                // Timeout connection attempt - close socket to trigger onclose for retry
                this.connectionTimeoutId = window.setTimeout(() => {
                    if (this.websocket?.readyState !== WebSocket.OPEN) {
                        console.warn('Connection timeout - closing socket to trigger retry');
                        this.websocket?.close(); // Close socket to trigger onclose handler for retry logic
                        this.connectionTimeoutId = null;
                        reject(new Error('Connection timeout'));
                    }
                }, 5000);

            } catch (error) {
                reject(error);
            }
        });
    }

    handleWebSocketMessage(data: string) {
        try {
            const message = JSON.parse(data);

            switch (message.type) {
                case 'connected':
                    console.log('Voice recognition engine ready:', message.data);
                    if (this.callbacks.onModelLoaded) {
                        this.callbacks.onModelLoaded();
                    }
                    break;

                case 'transcription':
                    this.handleTranscriptionResult(message.data);
                    break;

                case 'command':
                    this.handleCommandDetected(message.data);
                    break;

                case 'status':
                    console.log('Server status:', message.data);
                    break;

                case 'error':
                    console.error('Server error:', message.data);
                    this.notifyError(message.data.message);
                    break;

                default:
                    console.log('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    handleTranscriptionResult(data: any) {
        if (!data || !data.text) {
            return;
        }

        const text = data.text.trim();
        if (!text) {
            return;
        }

        // Treat as final if is_final is missing or true (backend doesn't always send this flag)
        const isFinal = data.is_final !== false;
        const latencyInfo = data.latency_ms ? `(${data.latency_ms}ms)` : '';
        
        console.log(`Voice ${isFinal ? 'final' : 'partial'}:`, text, latencyInfo);
        
        const result = {
            text: text,
            confidence: 0.9,  // Default high confidence
            isFinal: isFinal,
            source: 'voice'
        };

        if (isFinal) {
            // Capture raw ASR output for training before any post-processing
            if (voiceTrainingDataService.isTrainingEnabled()) {
                voiceTrainingDataService.setRawTranscript(text);
                // End the training session and save the sample
                voiceTrainingDataService.endSession().catch(err => {
                    console.error('Failed to save training sample:', err);
                });
            }
            
            if (this.callbacks.onResult) {
                this.callbacks.onResult(result);
            }
        } else {
            if (this.callbacks.onPartialResult) {
                this.callbacks.onPartialResult(result);
            }
        }
    }

    handleCommandDetected(data: any) {
        if (!data || !data.command) {
            return;
        }

        console.log('Voice command detected:', data.command);
        
        if (this.callbacks.onCommand) {
            this.callbacks.onCommand(data.command, data.text);
        }
    }

    async startListening() {
        if (!this.isInitialized || this.isListening) {
            console.warn('Cannot start listening: not initialized or already listening');
            return false;
        }

        try {
            // Get microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1,
                    sampleRate: this.sampleRate
                }
            });

            // Set up audio processing
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.audioContext = new AudioContextClass({
                sampleRate: this.sampleRate
            });

            // Create audio processing node - larger buffers, send less frequently for lower latency
            // Counter-intuitively, larger buffers = fewer sends = less overhead = lower total latency
            this.scriptProcessor = this.audioContext.createScriptProcessor(8192, 1, 1);
            
            let audioBuffer: Int16Array[] = [];
            let lastSendTime = Date.now();
            const SEND_INTERVAL_MS = 100; // Send every 100ms for smooth streaming
            
            this.scriptProcessor.onaudioprocess = (event) => {
                if (this.websocket?.readyState === WebSocket.OPEN && this.isListening) {
                    try {
                        // Get audio data and convert to Int16 PCM
                        const float32Audio = event.inputBuffer.getChannelData(0);
                        const int16Audio = new Int16Array(float32Audio.length);
                        
                        // Optimized conversion loop
                        for (let i = 0; i < float32Audio.length; i++) {
                            const s = Math.max(-1, Math.min(1, float32Audio[i]));
                            int16Audio[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                        }
                        
                        // Capture audio for training if enabled
                        if (voiceTrainingDataService.isTrainingEnabled()) {
                            voiceTrainingDataService.addAudioChunk(int16Audio);
                        }
                        
                        // Buffer audio and send in larger chunks to reduce overhead
                        audioBuffer.push(int16Audio);
                        const now = Date.now();
                        
                        if (now - lastSendTime >= SEND_INTERVAL_MS || audioBuffer.length >= 2) {
                            // Concatenate buffers and send as one chunk
                            const totalLength = audioBuffer.reduce((sum, buf) => sum + buf.length, 0);
                            const combined = new Int16Array(totalLength);
                            let offset = 0;
                            for (const buf of audioBuffer) {
                                combined.set(buf, offset);
                                offset += buf.length;
                            }
                            
                            // Send combined chunk
                            this.websocket.send(combined.buffer);
                            audioBuffer = [];
                            lastSendTime = now;
                        }
                    } catch (error) {
                        console.error('Audio processing error:', error);
                    }
                }
            };

            // Connect audio nodes
            this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.source.connect(this.scriptProcessor);
            this.scriptProcessor.connect(this.audioContext.destination);

            // Resume audio context if needed
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Send start message to server
            if (this.websocket?.readyState === WebSocket.OPEN) {
                this.websocket.send(JSON.stringify({
                    type: 'start'
                }));
            }

            this.isListening = true;
            this.allowAutoReconnect = true; // Re-enable auto-reconnect when actively listening
            this.reconnectAttempts = 0; // Reset reconnect attempts counter
            this.notifyStatusChange('listening');
            
            // Start training data session if enabled
            if (voiceTrainingDataService.isTrainingEnabled()) {
                voiceTrainingDataService.startSession();
            }
            
            console.log('Voice recognition started');
            return true;

        } catch (error) {
            console.error('Failed to start listening:', error);
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            this.notifyError('Failed to start voice recognition: ' + errorMsg);
            this.cleanup();
            return false;
        }
    }

    stopListening() {
        if (!this.isListening) {
            return;
        }

        try {
            // Disable auto-reconnect when intentionally stopping
            this.allowAutoReconnect = false;
            this.wasListeningBeforeDisconnect = false; // Clear listening intent on intentional stop
            
            // Clear any pending reconnection timeout
            if (this.reconnectTimeoutId !== null) {
                clearTimeout(this.reconnectTimeoutId);
                this.reconnectTimeoutId = null;
            }
            
            // Send stop message to server
            if (this.websocket?.readyState === WebSocket.OPEN) {
                this.websocket.send(JSON.stringify({
                    type: 'stop'
                }));
            }

            this.cleanup();
            this.isListening = false;
            this.notifyStatusChange('stopped');
            
            console.log('Voice recognition stopped');

        } catch (error) {
            console.error('Error stopping voice recognition:', error);
            this.isListening = false;
        }
    }

    cleanup() {
        try {
            // Stop media stream
            if (this.mediaStream) {
                this.mediaStream.getTracks().forEach(track => track.stop());
                this.mediaStream = null;
            }

            // Disconnect audio nodes
            if (this.source) {
                this.source.disconnect();
                this.source = null;
            }

            if (this.scriptProcessor) {
                this.scriptProcessor.disconnect();
                this.scriptProcessor = null;
            }

            // Close audio context
            if (this.audioContext && this.audioContext.state !== 'closed') {
                this.audioContext.close();
                this.audioContext = null;
            }

        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }

    // Removed automatic reconnection - user must manually reconnect
    // This is more reliable since browsers require user gesture for microphone access

    // Configuration methods
    setConfidenceThreshold(threshold: number) {
        this.confidenceThreshold = Math.max(0, Math.min(1, threshold));
        console.log(`Confidence threshold set to: ${this.confidenceThreshold}`);
    }

    setPunctuationMode(enabled: boolean) {
        // Punctuation handled internally, this is a no-op for compatibility
        console.log(`Smart punctuation: ${enabled ? 'enabled' : 'disabled'} (handled automatically)`);
    }

    // Event handling
    setCallback(event: string, callback: any) {
        if (event in this.callbacks) {
            (this.callbacks as any)[event] = callback;
        }
    }

    // VoskService compatibility methods
    async updateVocabulary(adaptedWords: string[]) {
        // Vocabulary updates handled by configuration
        console.log('Vocabulary updates handled by configuration');
    }

    async processAccentTrainingAudio(text: string, audioBuffer: AudioBuffer, type: string) {
        // Runtime accent training not supported
        console.log('Accent training not supported in current configuration');
    }

    storeAccentTrainingData(adaptationData: any) {
        // Runtime accent training not supported
        console.log('Accent training data storage not supported in current configuration');
    }

    notifyStatusChange(status: string) {
        if (this.callbacks.onStatusChange) {
            this.callbacks.onStatusChange(status);
        }
    }

    notifyError(error: string | Error) {
        console.error('Voice service error:', error);
        if (this.callbacks.onError) {
            this.callbacks.onError(error);
        }
    }

    // Status getters
    getStatus() {
        if (!this.isSupported) return 'unsupported';
        if (this.isLoading) return 'loading';
        if (!this.isInitialized) return 'uninitialized';
        if (this.isListening) return 'listening';
        return 'ready';
    }

    isReady() {
        return this.isSupported && this.isInitialized && !this.isLoading;
    }

    // Hot-reload configuration
    async reloadConfig() {
        if (this.websocket?.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                type: 'reload_config'
            }));
            console.log('Requested configuration reload from server');
        }
    }

    // Get server status
    async getServerStatus() {
        if (this.websocket?.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                type: 'get_status'
            }));
        }
    }

    // Cleanup on destroy
    destroy() {
        // Disable auto-reconnect when destroying service
        this.allowAutoReconnect = false;
        this.wasListeningBeforeDisconnect = false; // Clear listening intent on destroy
        
        // Clear any pending reconnection timeout
        if (this.reconnectTimeoutId !== null) {
            clearTimeout(this.reconnectTimeoutId);
            this.reconnectTimeoutId = null;
        }
        
        this.stopListening();
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
    }
}

// Export singleton instance
export const whisperVoiceService = new WhisperVoiceService();
