"""
WhisperStreamEngine - Real-time streaming speech recognition with faster-whisper
GPU-accelerated for low-latency radiology dictation with superior medical terminology accuracy
"""
import numpy as np
import json
import queue
import threading
import time
import os
from faster_whisper import WhisperModel


class WhisperStreamEngine:
    def __init__(self, model_path=None, model_size="medium",
                 medical_vocab=None, voice_commands=None, sample_rate=16000):
        """
        Initialize faster-whisper streaming engine with GPU support
        
        Args:
            model_path: Path to local Whisper model directory (defaults to env var WHISPER_MODEL_PATH)
            model_size: Whisper model size if downloading ("tiny", "base", "small", "medium", "large-v3")
            medical_vocab: List of medical terms (for reference, not used by Whisper)
            voice_commands: List of voice command phrases (for reference)
            sample_rate: Audio sample rate (default 16000 Hz)
        """
        # Support environment variable for model path (for local models)
        if model_path is None:
            model_path = os.getenv('WHISPER_MODEL_PATH', model_size)
        self.model_path = model_path
        self.model_size = model_size
        self.model_revision = os.getenv("WHISPER_MODEL_REVISION")
        self.medical_vocab = medical_vocab or []
        self.voice_commands = voice_commands or []
        self.sample_rate = sample_rate
        
        self.model = None
        self.is_recording = False
        self.audio_queue = queue.Queue()
        
        # Audio buffer for accumulating samples
        self.audio_buffer = []
        self.buffer_duration_sec = 0.0
        
        # Voice Activity Detection (VAD) for natural pause detection
        self.silence_threshold = 0.005  # RMS threshold for silence detection (lowered for quiet mics)
        self.min_silence_duration = 0.5  # Minimum silence duration to trigger transcription (seconds)
        self.silence_chunks = 0  # Count consecutive silent chunks
        self.last_audio_time = None  # Time of last non-silent audio
        
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
        
        # GPU detection
        self.device = "cuda"  # Will fallback to CPU automatically if CUDA unavailable
        self.compute_type = "float16"  # Use float16 for faster GPU processing
        
    def load_model(self):
        """Load faster-whisper model with GPU acceleration"""
        print(f"Loading faster-whisper model from: {self.model_path}", flush=True)
        start = time.time()
        
        try:
            # Try GPU first
            print(f"Attempting to load model on GPU (CUDA) with {self.compute_type}...", flush=True)
            self.model = WhisperModel(
                self.model_path,
                device=self.device,
                compute_type=self.compute_type,
                download_root=None,  # Use default cache directory
                revision=self.model_revision,
            )
            load_time = time.time() - start
            print(f"✅ faster-whisper model loaded in {load_time:.2f}s on GPU (CUDA)", flush=True)
            print(f"🚀 GPU acceleration ENABLED - RTX 3060 will be utilized!", flush=True)
            
        except Exception as e:
            # Fallback to CPU
            print(f"⚠️  GPU load failed ({e}), falling back to CPU...", flush=True)
            self.device = "cpu"
            self.compute_type = "int8"  # Use int8 for faster CPU processing
            
            self.model = WhisperModel(
                self.model_path,
                device=self.device,
                compute_type=self.compute_type,
                download_root=None,
                revision=self.model_revision,
            )
            load_time = time.time() - start
            print(f"✅ faster-whisper model loaded in {load_time:.2f}s on CPU", flush=True)
            print(f"💡 For GPU acceleration, ensure CUDA and cuDNN are installed", flush=True)
    
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
        self.audio_buffer = []
        self.buffer_duration_sec = 0.0
        self.processing_thread = threading.Thread(target=self._process_audio)
        self.processing_thread.daemon = True
        self.processing_thread.start()
        print("faster-whisper audio processing started!", flush=True)
    
    def stop_processing(self):
        """Stop audio processing thread"""
        self.is_recording = False
        
        # Process any remaining audio in buffer
        if self.audio_buffer:
            self._transcribe_buffer(is_final=True)
        
        # Wait for processing thread to finish
        if self.processing_thread:
            self.processing_thread.join(timeout=1.0)
        
        # Clear buffer
        self.audio_buffer = []
        self.buffer_duration_sec = 0.0
        
        print("faster-whisper audio processing stopped!", flush=True)
    
    def feed_audio(self, audio_data):
        """
        Feed audio directly (for WebSocket use)
        
        Args:
            audio_data: bytes (Int16 PCM) - directly from browser
                       OR np.ndarray (float32) - from legacy JSON format
        """
        self.audio_queue.put(audio_data)
    
    def _is_silent(self, audio_chunk):
        """Check if audio chunk is silent using RMS energy"""
        rms = np.sqrt(np.mean(audio_chunk ** 2))
        is_silent = rms < self.silence_threshold
        
        # Debug: Log RMS levels every 50 chunks to help diagnose mic volume issues
        if not hasattr(self, '_debug_chunk_count'):
            self._debug_chunk_count = 0
        self._debug_chunk_count += 1
        if self._debug_chunk_count % 50 == 0:
            print(f"🎤 Audio RMS: {rms:.4f} (threshold: {self.silence_threshold}, {'SILENT' if is_silent else 'SPEECH'})", flush=True)
        
        return is_silent
    
    def _process_audio(self):
        """
        Process audio chunks with faster-whisper
        Uses Voice Activity Detection to transcribe on natural pauses (like Vosk)
        """
        while self.is_recording:
            try:
                # Get audio chunk
                try:
                    chunk = self.audio_queue.get(timeout=0.01)
                    
                    # Handle both binary (bytes) and legacy JSON (numpy array) formats
                    if isinstance(chunk, bytes):
                        # Binary format: Int16 PCM bytes from browser
                        audio_int16 = np.frombuffer(chunk, dtype=np.int16)
                        audio_float32 = audio_int16.astype(np.float32) / 32768.0
                    elif isinstance(chunk, np.ndarray):
                        # Legacy JSON format: already float32 numpy array
                        audio_float32 = chunk
                    else:
                        print(f"Unknown audio format: {type(chunk)}", flush=True)
                        continue
                    
                    # Check if this chunk is silent
                    is_silent = self._is_silent(audio_float32)
                    
                    if not is_silent:
                        # Speech detected - add to buffer and reset silence counter
                        self.audio_buffer.append(audio_float32)
                        self.silence_chunks = 0
                        self.last_audio_time = time.time()
                    else:
                        # Silence detected - DON'T add silent chunks to buffer
                        self.silence_chunks += 1
                        
                        # Calculate silence duration
                        chunk_duration = len(audio_float32) / self.sample_rate
                        silence_duration = self.silence_chunks * chunk_duration
                        
                        # If we have buffered speech AND enough silence, transcribe!
                        if self.audio_buffer and silence_duration >= self.min_silence_duration:
                            self._transcribe_buffer(is_final=True)
                            self.silence_chunks = 0
                            self.last_audio_time = None  # Reset audio time after transcription
                    
                    # Update buffer duration
                    chunk_duration = len(audio_float32) / self.sample_rate
                    self.buffer_duration_sec += chunk_duration
                    
                except queue.Empty:
                    # Small sleep to avoid CPU spinning
                    time.sleep(0.01)
                    
            except Exception as e:
                print(f"faster-whisper processing error: {e}", flush=True)
                import traceback
                traceback.print_exc()
    
    def _transcribe_buffer(self, is_final=False):
        """Transcribe accumulated audio buffer"""
        if not self.audio_buffer:
            return
        
        try:
            # Combine buffer into single array
            audio_array = np.concatenate(self.audio_buffer)
            
            # Skip if too short (less than 0.3 seconds)
            if len(audio_array) / self.sample_rate < 0.3:
                self.audio_buffer = []
                self.buffer_duration_sec = 0.0
                return
            
            # Measure latency
            transcribe_start = time.time()
            
            # Transcribe with faster-whisper
            segments, info = self.model.transcribe(
                audio_array,
                language="en",
                beam_size=5,
                vad_filter=True,  # Enable Voice Activity Detection
                vad_parameters=dict(
                    min_silence_duration_ms=500,  # Minimum silence to split segments
                    threshold=0.5  # Voice detection threshold
                ),
                condition_on_previous_text=False  # Don't use previous context (faster)
            )
            
            # Extract text from segments
            text_parts = []
            for segment in segments:
                text_parts.append(segment.text.strip())
            
            text = " ".join(text_parts).strip()
            
            if text:
                # Calculate latency
                self.latency_ms = (time.time() - transcribe_start) * 1000
                
                # Check for commands (sends command event if detected)
                detected_command = self._check_commands(text)
                
                # ALWAYS send transcription, regardless of whether command was detected
                # This allows frontend to handle both the text AND the command
                # Whisper's auto-punctuation (periods, commas) passes through naturally
                text_with_space = text + ' '
                self.final_result = text_with_space
                self.partial_result = ""
                
                for callback in self.callbacks['final']:
                    callback(text_with_space, self.latency_ms)
            
            # Clear buffer
            self.audio_buffer = []
            self.buffer_duration_sec = 0.0
            
        except Exception as e:
            print(f"Transcription error: {e}", flush=True)
            import traceback
            traceback.print_exc()
            # Clear buffer even on error
            self.audio_buffer = []
            self.buffer_duration_sec = 0.0
    
    def _check_commands(self, text):
        """Check for voice commands and return detected command phrase"""
        text_lower = text.lower().strip()
        
        # Check configured voice commands
        if self.voice_commands:
            for command in self.voice_commands:
                if command.lower() in text_lower:
                    for callback in self.callbacks['command']:
                        callback(command, text)
                    return command  # Return the detected command phrase
        
        # Fallback to hardcoded commands
        # NOTE: Period and comma are NOT commands - Whisper handles them via auto-punctuation
        commands = {
            'new paragraph': 'new_paragraph',
            'new line': 'new_line',
            'insert colon': 'insert_colon',
            'semicolon': 'insert_semicolon',
            'question mark': 'insert_question',
            'exclamation mark': 'insert_exclamation',
            'findings section': 'section_findings',
            'impression section': 'section_impression',
            'technique section': 'section_technique',
        }
        
        for phrase, command in commands.items():
            if phrase in text_lower:
                for callback in self.callbacks['command']:
                    callback(command, text)
                return phrase  # Return the detected command phrase
        
        return None  # No command detected
    
    def update_config(self, medical_vocab=None, voice_commands=None):
        """Update configuration (for hot-reload support)"""
        if medical_vocab is not None:
            self.medical_vocab = medical_vocab
            print(f"Updated medical_vocab: {len(medical_vocab)} terms")
        
        if voice_commands is not None:
            self.voice_commands = voice_commands
            print(f"Updated voice_commands: {len(voice_commands)} commands")
    
    def get_metrics(self):
        """Get performance metrics"""
        return {
            'latency_ms': self.latency_ms,
            'model_type': f'faster-whisper-{self.model_size}',
            'device': self.device,
            'compute_type': self.compute_type,
            'is_recording': self.is_recording,
            'vocab_size': len(self.medical_vocab),
            'buffer_duration': self.buffer_duration_sec
        }


if __name__ == "__main__":
    # Test the Whisper engine
    import json
    
    # Load medical vocabulary from config
    try:
        with open('../config/medical_vocab.json', 'r') as f:
            config = json.load(f)
            medical_terms = config.get('terms', [])
    except:
        medical_terms = []
    
    print(f"Loaded {len(medical_terms)} medical terms")
    
    # Create engine
    engine = WhisperStreamEngine(
        model_size="medium",  # or specify model_path for local model
        medical_vocab=medical_terms
    )
    engine.load_model()
    
    # Register callbacks
    def on_final(text, latency):
        print(f"\nFinal [{latency:.0f}ms]: {text}")
    
    def on_command(cmd, text):
        print(f"\n🎤 Command detected: {cmd}")
    
    engine.on_final(on_final)
    engine.on_command(on_command)
    
    metrics = engine.get_metrics()
    print(f"\n✅ faster-whisper engine initialized successfully")
    print(f"   Device: {metrics['device']}")
    print(f"   Compute type: {metrics['compute_type']}")
    print(f"   Model: {metrics['model_type']}")
    print("Engine ready for WebSocket integration\n")
