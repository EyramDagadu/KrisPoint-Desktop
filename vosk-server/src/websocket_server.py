"""
WebSocket Server for Speech Recognition Engine
Provides real-time speech recognition for KrisPoint via WebSocket
Now powered by faster-whisper for GPU-accelerated medical dictation
Supports WSS (Secure WebSocket) for HTTPS deployments
"""
import asyncio
import websockets
import json
import hashlib
import hmac
import numpy as np
from whisper_stream_engine import WhisperStreamEngine
from medasr_stream_engine import MedASRStreamEngine
from config_loader import ConfigLoader
import time
import os
import ssl
from pathlib import Path
from dotenv import load_dotenv
from urllib.parse import parse_qs, urlparse
from parent_watchdog import start_parent_watchdog

# Load environment variables from .env file in parent directory
# Script runs from vosk-server/src/, but .env is in vosk-server/
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class SpeechWebSocketServer:
    def __init__(self, host="127.0.0.1", port=8000):
        self.host = host
        self.port = port
        self.config = ConfigLoader()
        self.clients = {}  # websocket -> engine mapping
        
        # OPTIMIZATION: Preload model once on server startup (not per-client)
        # This eliminates the long wait when user clicks dictate!
        self.shared_model = None
        self.model_device = "cpu"  # Track which device was used
        self.model_compute_type = "int8"  # Track compute type used
        
        print(f"Speech Recognition WebSocket Server initialized (faster-whisper)")
        print(f"Configuration loaded:")
        print(f"  - Medical vocabulary: {len(self.config.get_medical_vocabulary())} terms")
        print(f"  - Voice commands: {len(self.config.get_all_commands())} commands")
    
    def preload_model(self):
        """Preload faster-whisper model on server startup (runs once, shared by all clients)"""
        if os.getenv("ASR_ENGINE", "medasr").lower() == "medasr":
            engine = MedASRStreamEngine(
                medical_vocab=self.config.get_medical_vocabulary(),
                voice_commands=self.config.get_all_commands())
            engine.load_model()
            self.shared_model = engine
            self.model_device = engine.device
            self.model_compute_type = engine.compute_type
            print("MedASR loaded and ready.", flush=True)
            return
        from faster_whisper import WhisperModel
        
        model_path = os.getenv('WHISPER_MODEL_PATH', 'medium')  # Default to medium if not set
        
        print(f"\n🚀 Preloading faster-whisper model from: {model_path}", flush=True)
        print("⏳ This will take 10-60 seconds depending on model size and GPU availability...", flush=True)
        
        start = time.time()
        
        try:
            # Try GPU first
            print("🎮 Attempting GPU (CUDA) acceleration...", flush=True)
            self.shared_model = WhisperModel(
                model_path,
                device="cuda",
                compute_type="float16",
                download_root=None
            )
            self.model_device = "cuda"
            self.model_compute_type = "float16"
            load_time = time.time() - start
            print(f"✅ Model preloaded in {load_time:.1f}s on GPU (CUDA)!", flush=True)
            print(f"🚀 GPU acceleration ENABLED - your RTX 3060 is now active!", flush=True)
            
        except Exception as e:
            # Fallback to CPU
            print(f"⚠️  GPU load failed, falling back to CPU...", flush=True)
            self.shared_model = WhisperModel(
                model_path,
                device="cpu",
                compute_type="int8",
                download_root=None
            )
            self.model_device = "cpu"
            self.model_compute_type = "int8"
            load_time = time.time() - start
            print(f"✅ Model preloaded in {load_time:.1f}s on CPU", flush=True)
            print(f"💡 For GPU acceleration, ensure CUDA and cuDNN are installed", flush=True)
        
        print(f"🎤 Clients can now dictate with instant model loading!\n", flush=True)
    
    def create_engine_for_client(self):
        """Create a WhisperStreamEngine instance for a client (using preloaded model)"""
        engine_class = (MedASRStreamEngine if os.getenv("ASR_ENGINE", "medasr").lower() == "medasr"
                        else WhisperStreamEngine)
        engine = engine_class(
            model_path=None,  # Uses WHISPER_MODEL_PATH environment variable
            medical_vocab=self.config.get_medical_vocabulary(),
            voice_commands=self.config.get_all_commands(),
            sample_rate=16000
        )
        
        # Use preloaded shared model (instant!)
        if self.shared_model:
            print("✓ Using preloaded model (instant initialization)", flush=True)
            if isinstance(self.shared_model, engine_class):
                engine.model = self.shared_model.model
                engine.processor = getattr(self.shared_model, "processor", None)
            engine.device = self.model_device
            engine.compute_type = self.model_compute_type
        else:
            # Fallback: load model if not preloaded
            print("⚠ Model not preloaded, loading now...", flush=True)
            engine.load_model()
        
        return engine
    
    async def send_message(self, websocket, message_type, data):
        """Send JSON message to client"""
        message = {
            'type': message_type,
            'data': data,
            'timestamp': time.time()
        }
        try:
            await websocket.send(json.dumps(message))
        except:
            pass
    
    async def handle_audio_stream(self, websocket, engine):
        """Handle incoming audio chunks from browser"""
        try:
            async for message in websocket:
                try:
                    # Check if message is binary audio data or JSON command
                    if isinstance(message, bytes):
                        # Binary audio data (Int16 PCM) - feed directly to Vosk!
                        # No conversion needed - Vosk accepts bytes directly
                        engine.feed_audio(message)
                        continue
                    
                    # Otherwise, parse as JSON command
                    data = json.loads(message)
                    
                    if data['type'] == 'health':
                        token = os.getenv("VOICE_HEALTH_TOKEN", "")
                        nonce = str(data.get("nonce", ""))
                        if token and len(nonce) == 64:
                            proof = hmac.new(token.encode(), nonce.encode(),
                                             hashlib.sha256).hexdigest()
                            await self.send_message(websocket, "health", {
                                "service": "krispoint-voice",
                                "engine": os.getenv("ASR_ENGINE", "medasr"),
                                "proof": proof})
                        else:
                            await self.send_message(websocket, "error",
                                                    {"message": "Invalid health challenge"})
                    elif data['type'] == 'audio':
                        # Legacy JSON audio format (slower, for compatibility)
                        audio_data = np.array(data['audio'], dtype=np.float32)
                        engine.feed_audio(audio_data)
                    
                    elif data['type'] == 'start':
                        # Start audio processing
                        engine.start_processing()
                        await self.send_message(websocket, 'status', {
                            'message': 'Recording started',
                            'model': 'faster-whisper',
                            'device': engine.device
                        })
                    
                    elif data['type'] == 'stop':
                        # Stop audio processing
                        engine.stop_processing()
                        await self.send_message(websocket, 'status', {
                            'message': 'Recording stopped'
                        })
                    
                    elif data['type'] == 'reload_config':
                        # Hot-reload configuration
                        self.reload_config(engine)
                        await self.send_message(websocket, 'status', {
                            'message': 'Configuration reloaded',
                            'commands_count': len(engine.voice_commands),
                            'vocab_terms': len(engine.medical_vocab)
                        })
                    
                    elif data['type'] == 'get_status':
                        # Send status
                        metrics = engine.get_metrics()
                        await self.send_message(websocket, 'status', {
                            'model_loaded': engine.model is not None,
                            'model_type': metrics['model_type'],
                            'device': metrics['device'],
                            'compute_type': metrics['compute_type'],
                            'is_recording': metrics['is_recording'],
                            'latency_ms': metrics['latency_ms'],
                            'commands_count': len(engine.voice_commands),
                            'vocab_terms': len(self.config.get_medical_vocabulary())
                        })
                
                except json.JSONDecodeError:
                    await self.send_message(websocket, 'error', {
                        'message': 'Invalid JSON'
                    })
                except Exception as e:
                    await self.send_message(websocket, 'error', {
                        'message': str(e)
                    })
        
        except websockets.exceptions.ConnectionClosed:
            print("Client disconnected")
        finally:
            # Clean up engine
            if engine.is_recording:
                engine.stop_processing()
            if websocket in self.clients:
                del self.clients[websocket]
    
    def reload_config(self, engine):
        """Hot-reload configuration and update engine"""
        print("Reloading configuration...")
        self.config.reload()
        
        # Update engine with new config
        engine.update_config(
            medical_vocab=self.config.get_medical_vocabulary(),
            voice_commands=self.config.get_all_commands()
        )
        
        print(f"✓ Configuration reloaded and applied to engine")
    
    async def handle_client(self, websocket):
        """Handle new WebSocket client connection"""
        expected = os.getenv("VOICE_CLIENT_TOKEN", "")
        request = getattr(websocket, "request", None)
        path = getattr(request, "path", "") if request else ""
        supplied = parse_qs(urlparse(path).query).get("token", [""])[0]
        if not expected or not hmac.compare_digest(supplied, expected):
            await websocket.close(code=1008, reason="Unauthorized")
            return
        print(f"New client connected from {websocket.remote_address}")
        engine = None
        
        try:
            # Create dedicated engine for this client
            engine = self.create_engine_for_client()
            self.clients[websocket] = engine
            
            # Capture event loop for thread-safe async callbacks
            loop = asyncio.get_running_loop()
            
            # Set up callbacks to send results back via WebSocket
            async def on_final_result(text, latency_ms):
                try:
                    await self.send_message(websocket, 'transcription', {
                        'text': text,
                        'latency_ms': latency_ms,
                        'is_final': True
                    })
                except Exception as e:
                    print(f"Error sending final result: {e}")
            
            async def on_command_detected(command, text):
                try:
                    await self.send_message(websocket, 'command', {
                        'command': command,
                        'text': text
                    })
                except Exception as e:
                    print(f"Error sending command: {e}")
            
            # Register callbacks (bridge from worker thread to async loop)
            def final_callback(text, latency_ms):
                try:
                    asyncio.run_coroutine_threadsafe(
                        on_final_result(text, latency_ms),
                        loop
                    )
                except Exception as e:
                    print(f"Error in final callback: {e}")
            
            def command_callback(command, text):
                try:
                    asyncio.run_coroutine_threadsafe(
                        on_command_detected(command, text),
                        loop
                    )
                except Exception as e:
                    print(f"Error in command callback: {e}")
            
            engine.on_final(final_callback)
            engine.on_command(command_callback)
            
            # Send welcome message
            metrics = engine.get_metrics()
            await self.send_message(websocket, 'connected', {
                'message': 'faster-whisper Speech Recognition Engine ready',
                'model_loaded': engine.model is not None,
                'model_type': metrics['model_type'],
                'device': metrics['device'],
                'compute_type': metrics['compute_type'],
                'vocab_terms': len(self.config.get_medical_vocabulary()),
                'commands': len(self.config.get_all_commands())
            })
            
            # Start handling audio stream
            await self.handle_audio_stream(websocket, engine)
        
        except Exception as e:
            print(f"❌ Error handling client: {e}")
            import traceback
            traceback.print_exc()
        finally:
            # Clean up client and engine
            if websocket in self.clients:
                del self.clients[websocket]
            if engine and engine.is_recording:
                try:
                    engine.stop_processing()
                except Exception:
                    pass
            print(f"Client {websocket.remote_address} disconnected and cleaned up")
    
    def process_request(self, path, request_headers):
        """Handle HTTP requests that aren't WebSocket upgrades (e.g., health checks)"""
        # Check if this is a proper WebSocket upgrade request
        # request_headers is a Headers object, not a dict
        try:
            connection = request_headers.get("Connection", "")
            if connection and "upgrade" not in connection.lower():
                # This is likely a health check or probe - return 200 OK silently
                return (200, [("Content-Type", "text/plain")], b"faster-whisper Speech WebSocket Server OK\n")
        except (AttributeError, TypeError):
            # If we can't check headers properly, let WebSocket library handle it
            pass
        # Let the WebSocket handshake proceed normally
        return None
    
    def get_ssl_context(self):
        """Create SSL context if certificates exist"""
        # Look for SSL certs in parent's ssl folder (same as web server)
        ssl_dir = Path(__file__).parent.parent.parent / 'ssl'
        cert_path = ssl_dir / 'cert.pem'
        key_path = ssl_dir / 'key.pem'
        
        if cert_path.exists() and key_path.exists():
            print(f"🔒 SSL certificates found at {ssl_dir}")
            ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            ssl_context.load_cert_chain(str(cert_path), str(key_path))
            return ssl_context
        else:
            print(f"⚠️  No SSL certificates found (checked {ssl_dir})")
            print("   Voice server will run without encryption (ws://)")
            print("   Run generate-ssl-cert.bat to enable WSS")
            return None
    
    async def start(self):
        """Start WebSocket server with automatic recovery"""
        ssl_context = self.get_ssl_context()
        protocol = "wss" if ssl_context else "ws"
        
        print(f"Starting faster-whisper Speech Recognition WebSocket server on {self.host}:{self.port}")
        
        while True:  # Auto-recovery loop
            try:
                async with websockets.serve(
                    self.handle_client, 
                    self.host, 
                    self.port,
                    ssl=ssl_context,
                    process_request=self.process_request,
                    ping_interval=20,  # Send ping every 20s to detect dead connections
                    ping_timeout=10     # Wait 10s for pong response
                ):
                    print(f"✓ WebSocket server listening on {protocol}://{self.host}:{self.port}")
                    print(f"✓ Ready to accept connections from KrisPoint")
                    if ssl_context:
                        print(f"🔒 Secure WebSocket (WSS) enabled!")
                    print(f"✓ Server will auto-restart if connection issues occur")
                    await asyncio.Future()  # Run forever
            except Exception as e:
                print(f"⚠️  Server error: {e}")
                print("🔄 Restarting server in 3 seconds...")
                import traceback
                traceback.print_exc()
                await asyncio.sleep(3)

def main():
    restart_count = 0
    max_restarts = 10
    
    while restart_count < max_restarts:
        try:
            print("\n=== KrisPoint Voice Recognition Server ===")
            if restart_count > 0:
                print(f"Restart #{restart_count}")
            print("Initializing server...")
            
            # Create server instance - Bind to 0.0.0.0 for LAN access
            # This allows remote users on the same network to use voice recognition
            # Set VOICE_HOST=127.0.0.1 to restrict to local connections only
            voice_host = os.getenv('VOICE_HOST', '127.0.0.1')
            voice_port = int(os.getenv('VOICE_PORT', '8000'))
            start_parent_watchdog()
            server = SpeechWebSocketServer(host=voice_host, port=voice_port)
            
            # CRITICAL: Preload model BEFORE accepting connections
            # This eliminates the 52-114s wait when user clicks dictate!
            server.preload_model()
            
            # Start accepting connections (model already loaded!)
            print("Starting async server...")
            asyncio.run(server.start())
            
        except KeyboardInterrupt:
            print("\n\n✋ Server stopped by user (Ctrl+C)")
            print("✓ Shutdown complete")
            return 0
            
        except Exception as e:
            restart_count += 1
            print(f"\n❌ FATAL ERROR: {e}")
            import traceback
            traceback.print_exc()
            
            if restart_count < max_restarts:
                print(f"\n🔄 Restarting server (attempt {restart_count}/{max_restarts})...")
                time.sleep(5)
            else:
                print(f"\n💥 Maximum restart attempts ({max_restarts}) reached")
                print("Please check the error logs and fix any issues")
                return 1
    
    return 1

if __name__ == "__main__":
    import sys
    sys.exit(main())
