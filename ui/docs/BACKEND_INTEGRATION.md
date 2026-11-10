# Backend Integration Guide - FastAPI + Faster-Whisper

> **For your friend:** This guide explains how to integrate the Precerto UI frontend with a FastAPI backend for real-time speech-to-text transcription.

---

## Overview

The React frontend now prepares audio in **PCM s16le format at 16kHz mono** - the perfect format for speech recognition. Your job on the backend is to:

1. Receive the PCM audio data
2. Convert it to the format that faster-whisper expects
3. Run transcription
4. Send results back to the frontend

---

## Audio Format Specification

When the frontend sends audio, it includes:

```javascript
{
  blob: AudioBlob,           // Legacy support
  pcmBuffer: Uint8Array,     // Raw PCM s16le data
  duration: number,          // Recording duration in seconds
  sampleRate: 16000,         // Always 16kHz
  channels: 1,               // Always mono
  formatInfo: {
    type: "PCM s16le",
    sampleRate: 16000,
    channels: 1,
    description: "Ready for fast-whisper transcription"
  }
}
```

---

## Implementation Options

### Option 1: WebSocket Streaming (Real-time)

**Best for:** Live transcription as user speaks

#### Frontend Code (Already in AudioRecorder.jsx)

The frontend is ready! Just uncomment the WebSocket section in `AudioRecorder.jsx`:

```javascript
// In processor.onaudioprocess (line ~80):
if (websocket && websocket.readyState === WebSocket.OPEN) {
  websocket.send(int16Buffer)
}
```

#### Backend Code (FastAPI)

```python
from fastapi import FastAPI, WebSocket
import numpy as np
from faster_whisper import WhisperModel

app = FastAPI()

# Load model once (expensive operation)
model = WhisperModel("base", device="cpu", compute_type="int8")

@app.websocket("/ws/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    await websocket.accept()
    
    try:
        audio_buffer = []
        
        while True:
            # Receive audio chunks from frontend
            data = await websocket.receive_bytes()
            
            # Convert PCM s16le bytes to numpy array
            audio_chunk = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0
            audio_buffer.append(audio_chunk)
            
            # Optional: Process chunks in real-time
            # For now, accumulate all chunks
    
    except Exception as e:
        print(f"Error: {e}")
    finally:
        # When recording stops, process all audio
        if audio_buffer:
            full_audio = np.concatenate(audio_buffer)
            
            # Transcribe
            segments, _ = model.transcribe(full_audio)
            transcription = " ".join([segment.text for segment in segments])
            
            # Send back to frontend
            await websocket.send_json({
                "status": "success",
                "transcription": transcription
            })
        
        await websocket.close()
```

**Frontend WebSocket Setup:**

```javascript
// In AudioRecorder.jsx, add to startRecording():
const websocket = new WebSocket('ws://your-backend-url:8000/ws/transcribe')

websocket.onopen = () => {
  console.log('✓ WebSocket connected')
}

websocket.onmessage = (event) => {
  const result = JSON.parse(event.data)
  if (result.status === 'success') {
    console.log('Transcription:', result.transcription)
    // Pass to parent component
  }
}

websocket.onerror = (error) => {
  console.error('WebSocket error:', error)
}
```

---

### Option 2: HTTP POST - Batch Processing (Simpler)

**Best for:** Processing full recordings after user stops

#### Frontend Code

```javascript
// In DoctorDashboard.jsx, update handleAudioRecorded:
const sendAudioToBackend = async (audioData) => {
  const formData = new FormData()
  
  // Send the raw PCM buffer
  formData.append('audio', new Blob([audioData.pcmBuffer], { 
    type: 'application/octet-stream' 
  }))
  formData.append('sampleRate', audioData.sampleRate)
  formData.append('channels', audioData.channels)
  
  try {
    const response = await fetch('http://your-backend:8000/transcribe', {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    setTranscription(result.transcription)
    setStage('extraction')
  } catch (error) {
    setError('Error: ' + error.message)
  }
}
```

#### Backend Code (FastAPI)

```python
from fastapi import FastAPI, File, UploadFile, Form
import numpy as np
from faster_whisper import WhisperModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model
model = WhisperModel("base", device="cpu", compute_type="int8")

@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    sampleRate: int = Form(16000),
    channels: int = Form(1)
):
    """
    Receive raw PCM audio and return transcription
    """
    try:
        # Read the raw audio data
        audio_bytes = await audio.read()
        
        # Convert PCM s16le to numpy float32
        audio_array = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
        
        # Transcribe
        segments, info = model.transcribe(audio_array, language="en")
        
        # Combine all segments
        transcription = " ".join([segment.text for segment in segments])
        
        return {
            "status": "success",
            "transcription": transcription,
            "language": info.language,
            "duration": len(audio_array) / sampleRate
        }
    
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
```

---

## Installation

### Backend Dependencies

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install required packages
pip install fastapi uvicorn faster-whisper numpy python-multipart

# Optional: For GPU support
# pip install torch --index-url https://download.pytorch.org/whl/cu118
# pip install faster-whisper
```

### Frontend Setup

The frontend is already configured! Just enable the WebSocket code when ready.

---

## Testing

### 1. Test Backend Locally

Start FastAPI server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Test with cURL

```bash
# Create a test audio file first
curl -X POST "http://localhost:8000/transcribe" \
  -F "audio=@test_audio.pcm" \
  -F "sampleRate=16000" \
  -F "channels=1"
```

### 3. Test with Frontend

1. Start React dev server: `npm run dev`
2. Open browser: `http://localhost:3000`
3. Click "I'm a Doctor"
4. Record audio
5. Check browser console for transcription results

---

## Important Notes

### Model Size

- **tiny**: ~39MB (fastest, least accurate)
- **base**: ~140MB (good balance) ← Recommended
- **small**: ~440MB (more accurate)
- **medium**: ~1.4GB (very accurate)
- **large**: ~2.9GB (most accurate)

```python
# Choose during initialization
model = WhisperModel("base")  # Change "base" to other size
```

### Production Deployment

For production, consider:

1. **GPU Support**: Use CUDA for faster transcription
   ```python
   model = WhisperModel("base", device="cuda", compute_type="float16")
   ```

2. **Model Caching**: Load model once, reuse for multiple requests

3. **Rate Limiting**: Prevent abuse
   ```python
   from slowapi import Limiter
   ```

4. **Authentication**: Add API keys if needed

5. **HTTPS**: Always use HTTPS in production

---

## Troubleshooting

### "No module named 'faster_whisper'"

```bash
pip install faster-whisper
```

### Audio not being processed

1. Check browser console for errors
2. Verify WebSocket/HTTP endpoint URL
3. Ensure backend is running and accessible
4. Check CORS settings

### Transcription is wrong

1. **Check audio quality**: Record in quiet environment
2. **Test with longer audio**: Minimum 1-2 seconds recommended
3. **Try different model**: "small" or "medium" for accuracy
4. **Check sample rate**: Ensure it's 16kHz

### Performance issues

1. Use smaller model ("tiny") for speed
2. Enable GPU if available
3. Batch process multiple requests
4. Consider async processing for long audio

---

## CORS Configuration

If frontend and backend are on different origins:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://yourdomain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Next Steps

1. **Choose integration method** (WebSocket or HTTP)
2. **Install dependencies**
3. **Implement backend endpoint**
4. **Update frontend WebSocket URL** (if using WebSocket)
5. **Test locally**
6. **Deploy to production**

---

## Example Project Structure

```
backend/
├── main.py              # FastAPI app
├── transcriber.py       # Transcription logic
├── requirements.txt     # Dependencies
└── .env                 # Configuration

frontend/
├── src/
│  └── components/
│     └── AudioRecorder.jsx  # Ready to use!
└── package.json
```

---

## Quick Start Script

**main.py** (Copy & paste to get started):

```python
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from faster_whisper import WhisperModel

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model once
print("Loading WhisperModel...")
model = WhisperModel("base")
print("Model ready!")

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    """Transcribe audio"""
    audio_bytes = await audio.read()
    audio_array = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    
    segments, _ = model.transcribe(audio_array)
    transcription = " ".join([s.text for s in segments])
    
    return {"transcription": transcription}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

Run it:

```bash
python main.py
```

---

## Questions?

- Check browser console for frontend errors
- Check terminal for backend errors
- Verify URL format: `http://localhost:8000/transcribe`
- Ensure backend is responding: `curl http://localhost:8000/docs`

FastAPI provides interactive documentation at `http://localhost:8000/docs`

---

**Happy coding!** 🚀
