# WebSocket Real-Time Transcription Guide

> Quick reference for implementing real-time speech-to-text streaming

---

## What You Get from Frontend

The AudioRecorder component streams PCM s16le audio chunks over WebSocket in real-time.

**Each chunk:**
- 4096 audio samples (at 16kHz = ~256ms of audio)
- Signed 16-bit little-endian format
- Ready to use with faster-whisper

---

## Step 1: Frontend - Enable WebSocket

In `src/components/AudioRecorder.jsx` around line 80, uncomment:

```javascript
processor.onaudioprocess = (event) => {
  const float32Audio = event.inputBuffer.getChannelData(0)
  
  // ... existing code ...
  
  // UNCOMMENT THIS:
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(int16Buffer)
  }
}
```

Then in `startRecording()`, add:

```javascript
// Create WebSocket connection
const ws = new WebSocket('ws://localhost:8000/ws/transcribe')

ws.onopen = () => {
  console.log('✓ Connected to transcription server')
}

ws.onmessage = (event) => {
  const result = JSON.parse(event.data)
  console.log('Transcription:', result.transcription)
  setTranscription(result.transcription) // Update UI
}

ws.onerror = (error) => {
  console.error('WebSocket error:', error)
  setError('Connection error: ' + error)
}

// Store reference for use in processor
websocket = ws
```

---

## Step 2: Backend - FastAPI WebSocket Handler

**File: `main.py`**

```python
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from faster_whisper import WhisperModel

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model once (expensive - hold in memory)
print("🚀 Loading Whisper model...")
model = WhisperModel("base", device="cpu")
print("✓ Model loaded and ready")

@app.websocket("/ws/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    """
    WebSocket endpoint for real-time transcription
    
    Client sends: Raw PCM s16le audio chunks
    Server sends: Partial and final transcriptions
    """
    await websocket.accept()
    print("📡 Client connected")
    
    audio_buffer = np.array([], dtype=np.float32)
    last_transcription = ""
    
    try:
        while True:
            # Receive audio chunk from frontend
            data = await websocket.receive_bytes()
            
            # Convert: PCM s16le bytes → numpy float32
            chunk = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0
            
            # Add to buffer
            audio_buffer = np.concatenate([audio_buffer, chunk])
            
            # Send intermediate status (optional)
            await websocket.send_json({
                "status": "receiving",
                "chunks_received": len(audio_buffer) // 4096,
                "duration_seconds": len(audio_buffer) / 16000
            })
            
            print(f"📥 Received {len(chunk)} samples, total: {len(audio_buffer)}")
    
    except Exception as e:
        print(f"❌ Error receiving data: {e}")
    
    finally:
        # When client closes connection, transcribe all audio
        if len(audio_buffer) > 0:
            print(f"🔄 Processing {len(audio_buffer)} samples...")
            
            try:
                # Transcribe
                segments, info = model.transcribe(audio_buffer, language="en")
                transcription = " ".join([seg.text for seg in segments])
                
                # Send final result
                await websocket.send_json({
                    "status": "complete",
                    "transcription": transcription,
                    "language": info.language,
                    "duration": len(audio_buffer) / 16000
                })
                
                print(f"✓ Transcription sent: {transcription[:100]}...")
            
            except Exception as e:
                await websocket.send_json({
                    "status": "error",
                    "message": str(e)
                })
                print(f"❌ Transcription error: {e}")
        
        await websocket.close()
        print("🔌 Connection closed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
```

---

## Step 3: Run Both Servers

**Terminal 1 - Backend:**
```bash
python main.py
```

Output should show:
```
🚀 Loading Whisper model...
✓ Model loaded and ready
Uvicorn running on http://0.0.0.0:8000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Output should show:
```
➜  Local:   http://localhost:5173/
```

---

## Step 4: Test It

1. Open browser: `http://localhost:5173`
2. Click "I'm a Doctor"
3. Click "Start Recording"
4. Speak: "The patient has a headache and fever"
5. Click "Stop Recording"
6. Watch the console:
   - Frontend shows: "✓ Connected to transcription server"
   - Backend shows: "📡 Client connected"
   - Backend shows: "📥 Received chunks..."
   - Frontend shows: "Transcription: The patient has a headache..."

---

## Full Data Flow

```
┌─────────────┐                          ┌──────────────┐
│   Browser   │                          │   FastAPI    │
│             │                          │   Backend    │
└──────┬──────┘                          └──────┬───────┘
       │                                        │
       │  1. User clicks "Start Recording"      │
       │─────────────────────────────────────────>
       │                                        │
       │  WebSocket: ws://localhost:8000/ws/   │
       │  [OPEN]                                │
       │◄─────────────────────────────────────────
       │                                        │
       │  Send PCM s16le chunk 1                │
       │─────────────────────────────────────────>
       │                                        │
       │  Send PCM s16le chunk 2                │
       │─────────────────────────────────────────>
       │                                        │
       │  Send PCM s16le chunk 3                │
       │─────────────────────────────────────────>
       │                                        │
       │  ... more chunks ...                   │
       │─────────────────────────────────────────>
       │                                        │
       │  2. User clicks "Stop Recording"       │
       │                  [Connection closes]   │
       │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─>
       │                                        │
       │                        [Transcribe]    │
       │                        [Processing]    │
       │    JSON: {"transcription": "..."}      │
       │◄─────────────────────────────────────────
       │                                        │
       │  Update UI with transcription          │
       │                                        │
```

---

## Audio Format Reference

### What Frontend Sends

Each WebSocket message is a **Uint8Array** containing:
- Signed 16-bit samples (2 bytes per sample)
- Little-endian byte order
- ~4096 samples per chunk = ~256ms of audio at 16kHz

Example for 4 samples:
```
[0x00, 0x00,  0xFF, 0x7F,  0x00, 0x80,  0xFF, 0xFF]
[Sample 1  ]  [Sample 2  ]  [Sample 3  ]  [Sample 4  ]
```

### What Backend Does

```python
# Receive bytes
data = await websocket.receive_bytes()  # type: bytes

# Convert to numbers
samples_int16 = np.frombuffer(data, dtype=np.int16)
# Result: array([-32768, 32767, -32768, 32767], dtype=int16)

# Normalize to -1.0 to 1.0 range
samples_float = samples_int16.astype(np.float32) / 32768.0
# Result: array([-1.0, 1.0, -1.0, 1.0], dtype=float32)

# Feed to faster-whisper
whisper_text = model.transcribe(samples_float)
```

---

## Common Issues

### "Connection refused"
- ✓ Backend running? (`python main.py`)
- ✓ Port 8000 available?
- ✓ URL correct? (`ws://localhost:8000/ws/transcribe`)

### "WebSocket closed before sending"
- ✓ Recording too short? (Try >1 second)
- ✓ Microphone permission granted?
- ✓ Check browser console for errors

### "ModuleNotFoundError: faster_whisper"
```bash
pip install faster-whisper
```

### Transcription is empty
- ✓ Audio too quiet? Speak louder
- ✓ Background noise? Record in quiet space
- ✓ Language? Default is English

---

## Performance Tips

1. **Model Size Trade-off:**
   - tiny: 50ms → 100ms (fast, less accurate)
   - base: 500ms → 1000ms (balanced)
   - small: 1s → 2s (more accurate)
   - medium: 2s → 5s (very accurate)

2. **GPU Acceleration:**
   ```python
   model = WhisperModel("base", device="cuda")  # Use GPU
   ```

3. **Batch Multiple Users:**
   ```python
   # Use worker queue instead of processing directly
   # (Advanced topic - see celery/RQ examples)
   ```

---

## Next Steps

1. ✓ Frontend WebSocket enabled
2. ✓ Backend WebSocket handler created
3. ✓ Both servers running
4. ✓ Audio transcribed successfully
5. → Add error handling
6. → Add authentication
7. → Deploy to production

---

## Debugging Tips

**Frontend Console:**
```javascript
// Enable detailed logging
console.log('ChunkSize:', int16Buffer.byteLength)
console.log('WebSocket state:', websocket.readyState) // 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
```

**Backend Terminal:**
```python
# Already has logging - watch for ✓, 📡, 📥, 🔄, ✓ symbols
```

---

**You're ready! Happy transcribing!** 🎙️💬
