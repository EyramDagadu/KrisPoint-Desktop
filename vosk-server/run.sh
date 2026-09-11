#!/bin/bash
# Launch Whisper Streaming Test Interface

cd src
streamlit run app.py --server.port 8501 --server.address 0.0.0.0
