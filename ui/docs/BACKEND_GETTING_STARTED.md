# 🚀 Backend Developer - Start Here!

> **Sent by:** Your friend who built the awesome React UI  
> **For:** You - to build the FastAPI backend for speech-to-text

---

## What You're Getting

A **production-ready React UI** that:
- ✅ Records audio from microphone
- ✅ Automatically processes with Web Audio API
- ✅ Downsamples to **16kHz PCM s16le format**
- ✅ Ready to send to your backend for transcription
- ✅ Awaits your FastAPI backend to return results

**Your job:** Build the FastAPI endpoint that receives this audio and returns transcriptions.

---

## The Easy Version (2 Minutes)

### Install Python Packages
```bash
pip install fastapi uvicorn faster-whisper numpy python-multipart
```

### Create `main.py`
```python
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from faster_whisper import WhisperModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = WhisperModel("base")

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()
    audio_array = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    segments, _ = model.transcribe(audio_array)
    return {"transcription": " ".join([s.text for s in segments])}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Run It
```bash
python main.py
```

**Done!** Your backend is running at `http://localhost:8000`

---

## What Data You Receive

### When User Clicks "Stop Recording"

**Data received:**
```
Uint8Array: [0x00, 0xFF, 0x7F, 0x80, ...]
├─ Format: PCM signed 16-bit little-endian
├─ Sample Rate: 16,000 Hz (always)
├─ Channels: 1 (mono)
└─ Duration: Depends on recording length
```

### How to Read It
```python
import numpy as np

# Receive raw bytes
data = b'\x00\x00\xFF\x7F...'

# Convert to audio samples (-32768 to 32767)
samples = np.frombuffer(data, dtype=np.int16)

# Normalize to -1.0 to 1.0
normalized = samples.astype(np.float32) / 32768.0

# Feed to model
result = model.transcribe(normalized)
# Result: "The patient has a headache"
```

---

## Two Implementation Options

### Option 1: HTTP POST (Simpler) ⭐ Recommended for beginners
```python
@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    """User hits 'Stop Recording' → sends audio here"""
    audio_bytes = await audio.read()
    audio_array = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    segments, _ = model.transcribe(audio_array)
    return {"transcription": " ".join([s.text for s in segments])}
```

**How it works:**
1. User records audio in browser
2. Clicks "Stop Recording"
3. Browser sends entire audio file via HTTP POST
4. Your endpoint receives it
5. Processes with faster-whisper
6. Returns transcription

**Pros:** Simple, reliable, works great for audio < 5 minutes  
**Cons:** Slight delay after recording stops

---

### Option 2: WebSocket (Advanced) 🎯 Real-time
```python
from fastapi import WebSocket

@app.websocket("/ws/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    """Real-time streaming transcription"""
    await websocket.accept()
    
    audio_buffer = np.array([], dtype=np.float32)
    
    try:
        while True:
            # Receive chunks as user speaks
            data = await websocket.receive_bytes()
            
            # Convert and add to buffer
            chunk = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0
            audio_buffer = np.concatenate([audio_buffer, chunk])
            
            # Optional: Send status updates
            await websocket.send_json({
                "status": "receiving",
                "samples": len(audio_buffer)
            })
    
    except Exception as e:
        print(f"Error: {e}")
    
    finally:
        # When user stops, transcribe all
        if len(audio_buffer) > 0:
            segments, _ = model.transcribe(audio_buffer)
            await websocket.send_json({
                "status": "complete",
                "transcription": " ".join([s.text for s in segments])
            })
        await websocket.close()
```

**How it works:**
1. User clicks "Start Recording"
2. Browser opens WebSocket connection
3. Sends audio chunks as they're recorded
4. You receive and process chunks continuously
5. When user stops, you transcribe entire buffer
6. Send result back over WebSocket

**Pros:** Real-time, smoother UX  
**Cons:** More complex code

---

## Installation & Testing

### 1. Install Dependencies
```bash
# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install packages
pip install fastapi uvicorn faster-whisper numpy python-multipart
```

### 2. Start Your Backend
```bash
python main.py
```

You should see:
```
INFO:     Application startup complete
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 3. Test It Works
Go to `http://localhost:8000/docs` (interactive API documentation)

---

## Connecting Frontend to Backend

### Frontend Already Has Code Ready!

In the React UI, the developer already included:
1. Audio recording (Web Audio API)
2. 16kHz downsampling
3. PCM s16le conversion
4. Ready to send to your backend

### Enable the Connection

**For HTTP POST:**
No changes needed! Just make sure:
- Your backend runs on `http://localhost:8000`
- You have the `/transcribe` POST endpoint
- CORS is enabled (already included in example)

**For WebSocket:**
In AudioRecorder.jsx, uncomment the WebSocket code around line 80

---

## What Each Faster-Whisper Model Does

```
tiny   (39MB)  → Fast (50-100ms),  Less accurate
base   (140MB) → Balanced (500ms), Good accuracy ⭐ Start here
small  (440MB) → Slower (1s),      Better accuracy
medium (1.4GB) → Very slow (3s),   Very accurate
large  (2.9GB) → Slowest (5s+),    Most accurate
```

Change with:
```python
model = WhisperModel("base")  # Change to "small", "medium", etc.
```

---

## Complete Example with Error Handling

```python
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from faster_whisper import WhisperModel
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Precerto Transcription Service")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model once
logger.info("Loading Whisper model...")
model = WhisperModel("base", device="cpu", compute_type="int8")
logger.info("Model loaded successfully!")

@app.get("/health")
async def health_check():
    """Check if service is running"""
    return {"status": "ok", "service": "transcription"}

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    """
    Transcribe audio from frontend
    
    Receives: PCM s16le audio (16kHz mono)
    Returns: JSON with transcription
    """
    try:
        # Read audio bytes
        audio_bytes = await audio.read()
        logger.info(f"Received audio: {len(audio_bytes)} bytes")
        
        # Convert PCM s16le to numpy array
        audio_array = np.frombuffer(audio_bytes, dtype=np.int16)
        
        # Normalize to -1.0 to 1.0
        audio_normalized = audio_array.astype(np.float32) / 32768.0
        
        # Transcribe
        logger.info("Starting transcription...")
        segments, info = model.transcribe(audio_normalized, language="en")
        
        # Combine results
        transcription = " ".join([segment.text for segment in segments])
        logger.info(f"Transcription complete: {transcription[:100]}...")
        
        return {
            "status": "success",
            "transcription": transcription,
            "language": info.language,
            "duration_seconds": len(audio_array) / 16000
        }
    
    except Exception as e:
        logger.error(f"Error: {e}")
        return {
            "status": "error",
            "message": str(e)
        }

@app.get("/")
async def root():
    return {
        "service": "Precerto Transcription API",
        "status": "running",
        "docs": "http://localhost:8000/docs"
    }

if __name__ == "__main__":
    import uvicorn
    # Run with: python main.py
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
```

**Run it:**
```bash
python main.py
```

**Check it:**
- Browser: `http://localhost:8000/docs` → Try API
- Terminal: Shows logs of requests

---

## Troubleshooting

### "ModuleNotFoundError: faster_whisper"
```bash
pip install faster-whisper
```

### "Address already in use" (Port 8000 taken)
Change port:
```python
uvicorn.run(app, host="0.0.0.0", port=8001)  # Use 8001 instead
```

### Audio too quiet / Transcription is empty
- Ask user to record in quiet room
- Ask user to speak louder
- Try "small" model (more accurate)
  ```python
  model = WhisperModel("small")
  ```

### "CUDA not available" (GPU)
That's fine! Falls back to CPU. To use GPU:
```bash
pip install torch --index-url https://download.pytorch.org/whl/cu118
# Then use:
model = WhisperModel("base", device="cuda", compute_type="float16")
```

### CORS error from frontend
Should be fixed! But if not, ensure:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Full Documentation

For more details, see:
- **[BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)** - Complete guide
- **[WEBSOCKET_QUICK_START.md](./WEBSOCKET_QUICK_START.md)** - Real-time setup
- **[README.md](./README.md)** - Frontend overview

---

## What's Next?

1. ✅ Install Python packages
2. ✅ Create `main.py`
3. ✅ Run `python main.py`
4. ✅ Test at `http://localhost:8000/docs`
5. ✅ Tell your friend it's working!
6. → Add error handling
7. → Add authentication (OAuth, API keys)
8. → Deploy to production

---

## Quick Reference

### Data Format Received
```
Raw bytes → PCM s16le → 16-bit samples (-32768 to 32767)
                      ↓
                   Normalize (÷32768) → Range: -1.0 to 1.0
                      ↓
                   Faster-Whisper → Transcription text
```

### Key Functions
```python
# Convert received bytes to audio samples
audio = np.frombuffer(data, dtype=np.int16)

# Normalize to -1.0 to 1.0
audio = audio.astype(np.float32) / 32768.0

# Transcribe
result = model.transcribe(audio)

# Get text
text = " ".join([s.text for s in result[0]])
```

---

## Getting Started in 3 Steps

```bash
# Step 1: Install
pip install fastapi uvicorn faster-whisper numpy python-multipart

# Step 2: Create main.py (see example above)

# Step 3: Run
python main.py
```

**That's it!** 🎉

Your backend is now running and ready to transcribe audio from the React UI.

---

## Questions?

Check:
1. This file (you're reading it!)
2. [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)
3. [WEBSOCKET_QUICK_START.md](./WEBSOCKET_QUICK_START.md)
4. Faster-Whisper docs: https://github.com/guillaumekln/faster-whisper
5. FastAPI docs: https://fastapi.tiangolo.com/

---

**Good luck! 🚀**

Your frontend is ready. Now make it speak! 🎙️

*Built with ❤️ using Web Audio API + React*
