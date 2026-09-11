# KrisPoint Voice Recognition Server

High-accuracy medical speech recognition server powered by Vosk with gigaspeech model (3.7 GB).

## 🚀 Quick Start for Windows Users

**New to this? Start here!**

1. **Read first:** [WINDOWS_USER_GUIDE.md](WINDOWS_USER_GUIDE.md) - Step-by-step setup guide
2. **Quick reference:** [QUICK_START.txt](QUICK_START.txt) - Print this and keep it handy
3. **Run server:** Double-click `START_VOICE_SERVER.bat` to start

---

## 📋 What's Included

### For End Users (Windows):
- **`START_VOICE_SERVER.bat`** - Double-click to start the server (easiest!)
- **`WINDOWS_USER_GUIDE.md`** - Complete 5-step setup guide with troubleshooting
- **`QUICK_START.txt`** - One-page quick reference card

### For Developers:
- **`LOCAL_SERVER_SETUP.md`** - Technical documentation for Mac/Linux
- **`src/websocket_server.py`** - Main WebSocket server implementation
- **`src/vosk_stream_engine.py`** - Vosk speech recognition engine
- **`config/`** - Medical vocabulary and voice command configurations

---

## ⚡ Daily Usage (Simple!)

**Every time you want to use voice dictation:**

1. **Start the server:**
   - Double-click `START_VOICE_SERVER.bat`
   - Wait for "Server Starting" message
   - Note the IP address shown (e.g., `192.168.1.100`)

2. **Open KrisPoint:**
   - Launch KrisPoint desktop app
   - Go to Settings → Voice Recognition
   - Enter: `ws://YOUR_IP:8000` (use the IP from step 1)

3. **Start dictating!** 🎤

When done, close both windows.

---

## 📦 Requirements

- **Windows PC** with 12+ GB RAM (recommended)
- **Python 3.8+** ([Download here](https://www.python.org/downloads/))
- **Vosk Model** (3.7 GB) - gigaspeech model for medical accuracy

The `START_VOICE_SERVER.bat` script will:
- ✅ Check if Python is installed
- ✅ Install required packages automatically
- ✅ Show your IP address
- ✅ Start the server with one click

---

## 🔧 Configuration

The server uses a `.env` file for configuration:

```env
# Set this to where you downloaded the gigaspeech model
VOSK_MODEL_PATH=C:\KrisPoint-Server\vosk-model-en-us-0.42-gigaspeech

# Server settings (keep these defaults)
WEBSOCKET_HOST=0.0.0.0
WEBSOCKET_PORT=8000
SAMPLE_RATE=16000
CHUNK_SIZE=8000
```

**First time setup:**
1. Copy `.env.example` to `.env`
2. Edit the `VOSK_MODEL_PATH` line with your model location
3. Save the file

---

## 📚 Documentation

Choose the guide that fits your needs:

| Guide | Who It's For | What It Covers |
|-------|-------------|----------------|
| **QUICK_START.txt** | Everyone | One-page quick reference |
| **WINDOWS_USER_GUIDE.md** | Windows users | Complete setup & troubleshooting |
| **LOCAL_SERVER_SETUP.md** | Developers/Mac/Linux | Technical documentation |

---

## 🎯 Architecture

```
┌─────────────────────┐
│  KrisPoint Desktop  │  ← User dictates into this
│    (SvelteKit)      │
└──────────┬──────────┘
           │ WebSocket (ws://IP:8000)
           ▼
┌─────────────────────┐
│   Voice Server      │  ← Runs on powerful PC
│  (Vosk + Python)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Gigaspeech Model   │  ← 3.7 GB high-accuracy model
│      (3.7 GB)       │
└─────────────────────┘
```

**Key Benefits:**
- **100% offline** - No internet required, all processing local
- **HIPAA compliant** - Patient data never leaves your facility
- **Medical-grade accuracy** - Gigaspeech model trained on medical terminology
- **Fast** - First load takes 30-120s, then instant connections

---

## 🛠️ Troubleshooting

### Common Issues:

**"Python is not installed"**
- Install Python 3.8+ from python.org
- ✅ Check "Add Python to PATH" during installation

**"Configuration file .env not found"**
- Copy `.env.example` to `.env`
- Edit and set your model path

**"Model not loading"**
- Verify the path in `.env` points to the extracted model folder
- Check that folder contains `conf/`, `graph/`, `ivector/` subfolders

**"KrisPoint can't connect"**
- Make sure server window is still open and running
- Verify IP address matches in both places
- Ensure both devices on same Wi-Fi network

See [WINDOWS_USER_GUIDE.md](WINDOWS_USER_GUIDE.md) for detailed troubleshooting.

---

## 🔐 Security & Privacy

- ✅ **100% offline** - All speech processing happens locally
- ✅ **No cloud services** - Zero external API calls
- ✅ **HIPAA compliant** - Patient data never transmitted
- ✅ **Open source** - Full code transparency

Perfect for medical environments with strict privacy requirements.

---

## 📞 Support

1. Check [WINDOWS_USER_GUIDE.md](WINDOWS_USER_GUIDE.md) for detailed instructions
2. Read [QUICK_START.txt](QUICK_START.txt) for quick reference
3. Look at the server window for error messages
4. Verify you have 12+ GB RAM available

---

## 🎤 Medical Features

The server includes:
- **102 medical terms** in custom vocabulary
- **1,548 voice commands** across 12 categories
- **Punctuation commands** (period, comma, new line)
- **Navigation commands** (go to findings, go to impression)
- **Formatting commands** (bold, italic, underline)

All optimized for radiology reporting workflow!

---

**Happy dictating! 🎤**
