"""
VoskStreamEngine - Real-time streaming speech recognition with Vosk
Optimized for low-latency radiology dictation with medical vocabulary
"""
import numpy as np
import json
import queue
import threading
import time
import os
from vosk import Model, KaldiRecognizer


class VoskStreamEngine:
    def __init__(self, model_path=None, 
                 medical_vocab=None, voice_commands=None, sample_rate=16000):
        """
        Initialize Vosk streaming engine
        
        Args:
            model_path: Path to Vosk model directory (defaults to env var VOSK_MODEL_PATH or lgraph model)
            medical_vocab: List of medical terms for custom grammar
            voice_commands: List of voice command phrases
            sample_rate: Audio sample rate (default 16000 Hz)
        """
        # Support environment variable for model path (for custom large models)
        if model_path is None:
            model_path = os.getenv('VOSK_MODEL_PATH', 'models/vosk-model-en-us-0.22-lgraph')
        self.model_path = model_path
        self.medical_vocab = medical_vocab or []
        self.voice_commands = voice_commands or []
        self.sample_rate = sample_rate
        
        self.model = None
        self.recognizer = None
        self.is_recording = False
        self.audio_queue = queue.Queue()
        
        # Results
        self.partial_result = ""
        self.final_result = ""
        self.callbacks = {
            'partial': [],
            'final': [],
            'command': []
        }
        
        # Performance metrics
        self.latency_ms = 0
        self.start_time = None
        
        # Processing thread
        self.processing_thread = None
        
    def load_model(self):
        """Load Vosk model with custom medical vocabulary"""
        print(f"Loading Vosk model from: {self.model_path}", flush=True)
        start = time.time()
        
        self.model = Model(self.model_path)
        print("✓ Model loaded, creating recognizer...", flush=True)
        
        self._create_recognizer()
        
        load_time = time.time() - start
        print(f"✓ Vosk model loaded in {load_time:.2f}s (standard mode - gigaspeech compatible)", flush=True)
    
    def _create_recognizer(self):
        """Create recognizer from loaded model (called separately for shared model pattern)"""
        if not self.model:
            raise RuntimeError("Model must be loaded before creating recognizer")
        
        # Note: Gigaspeech model doesn't support runtime grammars
        # Use standard recognizer for maximum compatibility
        self.recognizer = KaldiRecognizer(self.model, self.sample_rate)
        
        # Enable partial results for real-time feedback
        self.recognizer.SetWords(True)
        print("✓ Recognizer created", flush=True)
        
    def _build_custom_grammar(self):
        """
        Build custom grammar JSON for Vosk with medical vocabulary
        This boosts recognition accuracy for medical terms
        """
        # Combine medical vocab and common words for better recognition
        vocab_list = list(self.medical_vocab)
        
        # Add common connecting words for natural speech
        common_words = [
            "the", "is", "are", "was", "were", "has", "have", "had",
            "with", "without", "and", "or", "of", "in", "on", "at",
            "to", "from", "by", "for", "no", "yes", "shows", "showing",
            "demonstrates", "demonstrating", "reveals", "revealing",
            "indicates", "indicating", "suggests", "suggesting",
            "consistent", "compatible", "mild", "moderate", "severe",
            "small", "large", "multiple", "single", "bilateral", "unilateral",
            "left", "right", "upper", "lower", "anterior", "posterior"
        ]
        vocab_list.extend(common_words)
        
        # Add voice commands
        if self.voice_commands:
            vocab_list.extend(self.voice_commands)
        
        # Remove duplicates and create grammar
        vocab_list = list(set(vocab_list))
        grammar = json.dumps(vocab_list)
        
        return grammar
    
    def on_partial(self, callback):
        """Register callback for partial results"""
        self.callbacks['partial'].append(callback)
        
    def on_final(self, callback):
        """Register callback for final results"""
        self.callbacks['final'].append(callback)
        
    def on_command(self, callback):
        """Register callback for voice commands"""
        self.callbacks['command'].append(callback)
    
    def start_processing(self):
        """Start audio processing thread (for WebSocket use)"""
        if self.is_recording:
            return
        
        self.is_recording = True
        self.start_time = time.time()
        self.processing_thread = threading.Thread(target=self._process_audio)
        self.processing_thread.daemon = True
        self.processing_thread.start()
        print("Vosk audio processing started!")
    
    def stop_processing(self):
        """Stop audio processing thread"""
        # Signal thread to stop
        self.is_recording = False
        
        # Wait for processing thread to finish
        if self.processing_thread:
            self.processing_thread.join(timeout=1.0)
        
        # Reset recognizer for next session (prevents crash)
        if self.recognizer and self.model:
            self.recognizer = KaldiRecognizer(self.model, self.sample_rate)
            self.recognizer.SetWords(True)
        
        print("Vosk audio processing stopped!", flush=True)
    
    def feed_audio(self, audio_data):
        """
        Feed audio directly (for WebSocket use)
        
        Args:
            audio_data: bytes (Int16 PCM) - directly from browser
        """
        # Queue audio bytes directly - no conversion needed!
        # Browser sends Int16 PCM, Vosk accepts bytes directly
        self.audio_queue.put(audio_data)
    
    def _process_audio(self):
        """Process audio chunks with Vosk - optimized for detecting short pauses quickly"""
        chunks_buffer = []
        last_process_time = time.time()
        
        while self.is_recording:
            try:
                # Get audio chunk with very short timeout for responsiveness
                try:
                    chunk = self.audio_queue.get(timeout=0.01)  # Very short timeout
                    chunks_buffer.append(chunk)
                except queue.Empty:
                    pass
                
                # Process buffered chunks more frequently (every 50ms worth of audio)
                # This makes Vosk's VAD detect pauses faster
                current_time = time.time()
                time_since_process = current_time - last_process_time
                
                if chunks_buffer and time_since_process >= 0.05:  # Process every 50ms
                    # Combine chunks
                    combined_chunk = b''.join(chunks_buffer)
                    chunks_buffer = []
                    
                    # Measure latency
                    transcribe_start = time.time()
                    
                    # Process with Vosk - it detects pauses automatically via VAD
                    if self.recognizer.AcceptWaveform(combined_chunk):
                        # Pause detected - final result
                        result = json.loads(self.recognizer.Result())
                        text = result.get('text', '').strip()
                        
                        if text:
                            # Calculate latency (only Vosk processing time)
                            self.latency_ms = (time.time() - transcribe_start) * 1000
                            
                            # Add trailing space for continuous dictation
                            text_with_space = text + ' '
                            
                            # Emit final result immediately
                            self.final_result = text_with_space
                            self.partial_result = ""  # Clear partial
                            for callback in self.callbacks['final']:
                                callback(text_with_space, self.latency_ms)
                    else:
                        # Partial result (real-time feedback)
                        partial = json.loads(self.recognizer.PartialResult())
                        text = partial.get('partial', '').strip()
                        
                        if text and text != self.partial_result:
                            self.partial_result = text
                            # Emit partial result
                            for callback in self.callbacks['partial']:
                                callback(text)
                    
                    last_process_time = current_time
                else:
                    # No chunks or too soon, small sleep to avoid CPU spinning
                    time.sleep(0.005)
                    
            except Exception as e:
                print(f"Vosk processing error: {e}", flush=True)
    
    def _check_commands(self, text):
        """Check for voice commands"""
        text_lower = text.lower().strip()
        
        # Check configured voice commands
        if self.voice_commands:
            for command in self.voice_commands:
                if command.lower() in text_lower:
                    for callback in self.callbacks['command']:
                        callback(command, text)
                    return
        
        # Fallback to hardcoded commands
        commands = {
            'new paragraph': 'new_paragraph',
            'new line': 'new_line',
            'period': 'insert_period',
            'comma': 'insert_comma',
            'findings section': 'section_findings',
            'impression section': 'section_impression',
            'technique section': 'section_technique',
        }
        
        for phrase, command in commands.items():
            if phrase in text_lower:
                for callback in self.callbacks['command']:
                    callback(command, text)
                break
    
    def update_config(self, medical_vocab=None, voice_commands=None):
        """Update configuration (for hot-reload support)"""
        if medical_vocab is not None:
            self.medical_vocab = medical_vocab
            print(f"Updated medical_vocab: {len(medical_vocab)} terms")
            # Recreate recognizer with new grammar
            if self.model:
                grammar = self._build_custom_grammar()
                self.recognizer = KaldiRecognizer(self.model, self.sample_rate, grammar)
                self.recognizer.SetWords(True)
        
        if voice_commands is not None:
            self.voice_commands = voice_commands
            print(f"Updated voice_commands: {len(voice_commands)} commands")
    
    def get_metrics(self):
        """Get performance metrics"""
        return {
            'latency_ms': self.latency_ms,
            'model_type': 'vosk-lgraph',
            'is_recording': self.is_recording,
            'vocab_size': len(self.medical_vocab)
        }


if __name__ == "__main__":
    # Test the Vosk engine
    import json
    
    # Load medical vocabulary from config
    with open('../config/medical_vocab.json', 'r') as f:
        config = json.load(f)
        medical_terms = config.get('terms', [])
    
    print(f"Loaded {len(medical_terms)} medical terms")
    
    # Create engine
    engine = VoskStreamEngine(
        model_path="models/vosk-model-en-us-0.22-lgraph",
        medical_vocab=medical_terms
    )
    engine.load_model()
    
    # Register callbacks
    def on_partial(text):
        print(f"Partial: {text}", end='\r')
    
    def on_final(text, latency):
        print(f"\nFinal [{latency:.0f}ms]: {text}")
    
    def on_command(cmd, text):
        print(f"\n🎤 Command detected: {cmd}")
    
    engine.on_partial(on_partial)
    engine.on_final(on_final)
    engine.on_command(on_command)
    
    print("\n✅ Vosk engine initialized successfully")
    print("Engine ready for WebSocket integration\n")
