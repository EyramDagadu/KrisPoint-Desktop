"""
Streamlit Test Interface for Whisper Streaming Engine
Real-time radiology dictation testing
"""
import streamlit as st
import time
from whisper_stream_engine import WhisperStreamEngine
from corpus_processor import CorpusProcessor

# Page config
st.set_page_config(
    page_title="Whisper Radiology Streaming",
    page_icon="🎤",
    layout="wide"
)

# Initialize session state
if 'engine' not in st.session_state:
    st.session_state.engine = None
if 'is_recording' not in st.session_state:
    st.session_state.is_recording = False
if 'transcriptions' not in st.session_state:
    st.session_state.transcriptions = []
if 'commands_detected' not in st.session_state:
    st.session_state.commands_detected = []
if 'latencies' not in st.session_state:
    st.session_state.latencies = []

# Title
st.title("🎤 Whisper Streaming - Radiology Dictation")
st.caption("Real-time medical speech recognition with zero post-processing")

# Sidebar - Settings
with st.sidebar:
    st.header("⚙️ Settings")
    
    model_size = st.selectbox(
        "Model Size",
        ["tiny", "base", "small"],
        index=1,
        help="base = 200MB RAM, best balance for 8GB systems"
    )
    
    if st.button("Load Model"):
        with st.spinner("Loading Whisper model..."):
            # Load medical vocabulary
            processor = CorpusProcessor(
                corpus_path="../data/radiology_corpus.txt",
                commands_path="../data/voice_commands.txt"
            )
            processor.extract_medical_terms(max_lines=10000)
            initial_prompt = processor.build_initial_prompt()
            
            # Create engine
            engine = WhisperStreamEngine(
                model_size=model_size,
                initial_prompt=initial_prompt
            )
            engine.load_model()
            
            # Register callbacks
            def on_final(text, latency):
                st.session_state.transcriptions.append({
                    'time': time.strftime("%H:%M:%S"),
                    'text': text,
                    'latency': latency
                })
                st.session_state.latencies.append(latency)
            
            def on_command(cmd, text):
                st.session_state.commands_detected.append({
                    'time': time.strftime("%H:%M:%S"),
                    'command': cmd,
                    'text': text
                })
            
            engine.on_final(on_final)
            engine.on_command(on_command)
            
            st.session_state.engine = engine
            st.success(f"✅ Model loaded: {model_size}")
            st.info(f"📝 Initial prompt preview:\n{initial_prompt[:200]}...")
    
    st.divider()
    
    # Performance metrics
    if st.session_state.engine:
        st.subheader("📊 Performance")
        metrics = st.session_state.engine.get_metrics()
        st.metric("Model", metrics['model_size'].upper())
        if st.session_state.latencies:
            avg_latency = sum(st.session_state.latencies) / len(st.session_state.latencies)
            st.metric("Avg Latency", f"{avg_latency:.0f} ms")
        st.metric("Status", "🔴 Recording" if metrics['is_recording'] else "⚪ Stopped")

# Main area
col1, col2 = st.columns([2, 1])

with col1:
    st.subheader("🎙️ Real-Time Transcription")
    
    # Recording controls
    if st.session_state.engine:
        col_btn1, col_btn2, col_btn3 = st.columns(3)
        
        with col_btn1:
            if not st.session_state.is_recording:
                if st.button("▶️ Start Recording", type="primary", use_container_width=True):
                    st.session_state.engine.start_recording()
                    st.session_state.is_recording = True
                    st.rerun()
        
        with col_btn2:
            if st.session_state.is_recording:
                if st.button("⏹️ Stop Recording", type="secondary", use_container_width=True):
                    st.session_state.engine.stop_recording()
                    st.session_state.is_recording = False
                    st.rerun()
        
        with col_btn3:
            if st.button("🗑️ Clear Results", use_container_width=True):
                st.session_state.transcriptions = []
                st.session_state.commands_detected = []
                st.session_state.latencies = []
                st.rerun()
    else:
        st.warning("⚠️ Load a model from the sidebar first")
    
    # Transcription display
    st.divider()
    
    if st.session_state.transcriptions:
        for i, trans in enumerate(reversed(st.session_state.transcriptions[-10:])):
            with st.container():
                col_time, col_text, col_lat = st.columns([1, 6, 1])
                with col_time:
                    st.caption(trans['time'])
                with col_text:
                    st.write(trans['text'])
                with col_lat:
                    st.caption(f"{trans['latency']:.0f}ms")
                if i < len(st.session_state.transcriptions) - 1:
                    st.divider()
    else:
        st.info("👆 Start recording to see transcriptions appear here")

with col2:
    st.subheader("📋 Commands Detected")
    
    if st.session_state.commands_detected:
        for cmd in reversed(st.session_state.commands_detected[-5:]):
            with st.container():
                st.caption(cmd['time'])
                st.code(cmd['command'])
                st.caption(f"From: {cmd['text'][:50]}...")
                st.divider()
    else:
        st.info("No commands detected yet")

# Instructions
with st.expander("ℹ️ How to Use"):
    st.markdown("""
    ### Quick Start
    1. Click **Load Model** in the sidebar (takes ~5-10 seconds)
    2. Click **▶️ Start Recording** 
    3. Speak medical terms or phrases
    4. Watch real-time transcriptions appear!
    
    ### Test Medical Terms
    Try saying:
    - "compression fracture of L1 vertebral body"
    - "no acute intracranial hemorrhage"
    - "spinal canal stenosis"
    - "diffusion restricted on DWI sequences"
    
    ### Voice Commands
    Try saying:
    - "new paragraph"
    - "findings section"
    - "impression section"
    
    ### Performance Notes
    - Target latency: <3000ms
    - Optimized for 8GB RAM systems
    - Zero post-processing (all accuracy from model + prompt)
    """)

# Auto-refresh when recording
if st.session_state.is_recording:
    time.sleep(0.5)
    st.rerun()
