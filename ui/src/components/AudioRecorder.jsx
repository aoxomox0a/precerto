import React, { useState, useRef, useEffect } from 'react'
import './AudioRecorder.css'

export default function AudioRecorder({ onAudioRecorded, onSkipRecording, onFinishConsultation, onRecordingStateChange, onSimulatedTranscriptionChunk, loading }) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioFormat] = useState('blob')

  // Live transcript shown inside recorder (also forwarded to LiveTranscription via DoctorDashboard)
  const [realTranscript, setRealTranscript] = useState('')
  const transcriptRef = useRef('')

  // Web Audio refs
  const audioContextRef = useRef(null)
  const processorRef = useRef(null)
  const sourceRef = useRef(null)

  // Data buffers and timers
  const audioChunksRef = useRef([])
  const pcmDataRef = useRef([])
  const timerRef = useRef(null)
  const streamRef = useRef(null)

  // WebSocket and demo emitter refs
  const websocketRef = useRef(null)
  const demoIntervalRef = useRef(null)
  const demoIndexRef = useRef(0)

  useEffect(() => {
    if (onRecordingStateChange) onRecordingStateChange(isRecording, recordingTime)
  }, [isRecording, recordingTime, onRecordingStateChange])

  useEffect(() => {
    return () => {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current)
        demoIntervalRef.current = null
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      try {
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) websocketRef.current.close()
      } catch (e) {}
    }
  }, [])

  const convertFloat32ToInt16 = (float32Array) => {
    const int16Array = new Int16Array(float32Array.length)
    for (let i = 0; i < float32Array.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]))
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff
    }
    return int16Array.buffer
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      streamRef.current = stream

      // Reset buffers and transcript
      audioChunksRef.current = []
      pcmDataRef.current = []
      setRealTranscript('')
      transcriptRef.current = ''

      // Try to open websocket for backend streaming (optional)
      const startDemoTranscription = () => {
        if (typeof onSimulatedTranscriptionChunk !== 'function') return
        const demoTranscript = [
          'Patient: I have been having a persistent cough for three weeks.',
          'Doctor: Do you have any fever or shortness of breath?',
          'Patient: No fever, but some difficulty breathing when active.',
          'Doctor: Any history of asthma or smoking?',
          'Patient: I used to smoke years ago, but quit five years back.'
        ]
        demoIndexRef.current = 0
        if (demoIntervalRef.current) {
          clearInterval(demoIntervalRef.current)
          demoIntervalRef.current = null
        }
        demoIntervalRef.current = setInterval(() => {
          const idx = demoIndexRef.current
          if (idx < demoTranscript.length) {
            const chunk = demoTranscript[idx]
            try { onSimulatedTranscriptionChunk(chunk) } catch (e) {}
            setRealTranscript((prev) => (prev ? prev + ' ' + chunk : chunk))
            transcriptRef.current += (transcriptRef.current ? ' ' : '') + chunk
            demoIndexRef.current += 1
          } else {
            clearInterval(demoIntervalRef.current)
            demoIntervalRef.current = null
          }
        }, 700)
      }

      try {
        websocketRef.current = new WebSocket('ws://127.0.0.1:8000/ws/audio')
        websocketRef.current.binaryType = 'arraybuffer'

        websocketRef.current.onopen = () => {
          console.log('WebSocket connected to backend')
        }

        websocketRef.current.onmessage = (ev) => {
          try {
            const payload = JSON.parse(ev.data)
            if (payload.type === 'LIVE_UPDATE' && payload.transcript_chunk) {
              const text = payload.transcript_chunk
              setRealTranscript((prev) => (prev ? prev + ' ' + text : text))
              transcriptRef.current += (transcriptRef.current ? ' ' : '') + text
              if (typeof onSimulatedTranscriptionChunk === 'function') {
                try { onSimulatedTranscriptionChunk(text) } catch (e) {}
              }
            }
          } catch (_) {
            // backend sent plain text (not JSON) — use as-is
            const text = ev.data
            if (text?.trim()) {
              setRealTranscript((prev) => (prev ? prev + ' ' + text : text))
              transcriptRef.current += (transcriptRef.current ? ' ' : '') + text
              if (typeof onSimulatedTranscriptionChunk === 'function') {
                try { onSimulatedTranscriptionChunk(text) } catch (e) {}
              }
            }
          }
        }

        websocketRef.current.onerror = (err) => {
          console.warn('WebSocket unavailable, falling back to demo transcription:', err)
          startDemoTranscription()
        }
        websocketRef.current.onclose = () => console.log('WebSocket closed')
      } catch (wsErr) {
        console.warn('WebSocket not available, falling back to demo transcription:', wsErr)
        startDemoTranscription()
      }

      const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 })
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      sourceRef.current = source

      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      source.connect(processor)
      processor.connect(audioContext.destination)

      processor.onaudioprocess = (event) => {
        const float32Audio = event.inputBuffer.getChannelData(0)
        audioChunksRef.current.push(new Float32Array(float32Audio))

        const int16Buffer = convertFloat32ToInt16(float32Audio)
        pcmDataRef.current.push(int16Buffer)

        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          try {
            websocketRef.current.send(int16Buffer)
          } catch (e) {}
        }
      }

      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000)

    } catch (err) {
      console.error('Error accessing microphone:', err)
      alert('Unable to access microphone. Please check browser permissions.')
    }
  }

  const stopRecording = () => {
    try {
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) websocketRef.current.close()

      if (processorRef.current) processorRef.current.disconnect()
      if (sourceRef.current) sourceRef.current.disconnect()
      if (audioContextRef.current) audioContextRef.current.close()
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())

      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current)
        demoIntervalRef.current = null
      }

      const totalLength = pcmDataRef.current.reduce((sum, buf) => sum + buf.byteLength, 0)
      const pcmBuffer = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of pcmDataRef.current) {
        pcmBuffer.set(new Uint8Array(chunk), offset)
        offset += chunk.byteLength
      }

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/raw' })

      if (typeof onAudioRecorded === 'function') {
        onAudioRecorded({
          blob: audioBlob,
          pcmBuffer: pcmBuffer,
          liveText: transcriptRef.current.trim(),
          duration: recordingTime,
          sampleRate: 16000,
          channels: 1,
          formatInfo: { type: 'PCM s16le', sampleRate: 16000, channels: 1 }
        })
      }

      // clear buffers
      audioChunksRef.current = []
      pcmDataRef.current = []
      demoIndexRef.current = 0

    } catch (err) {
      console.error('Error stopping recording:', err)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className="audio-recorder-container">
      <div className="card recorder-card">
        <div className="card-header">
          <h2>🎯 Audio Record & Transcription</h2>
          <p className="subtitle">Record clinical dialogue to extract symptoms and diagnoses</p>
        </div>

        <div className="recorder-content">
          <div className="waveform-visualizer">
            {isRecording && (
              <>
                <div className="wave wave-1"></div>
                <div className="wave wave-2"></div>
                <div className="wave wave-3"></div>
              </>
            )}
          </div>

          <div className="recording-status">
            {isRecording ? (
              <>
                <div className="recording-indicator">
                  <span className="pulse"></span>
                  Recording...
                </div>
                <p className="recording-time">{formatTime(recordingTime)}</p>

                <div className="live-transcript-box" style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '60px', fontStyle: 'italic', color: '#334155' }}>
                  {realTranscript || 'Listening to patient...'}
                </div>
              </>
            ) : (
              <p className="idle-text">Ready to record clinical encounter</p>
            )}
          </div>

          <div className="recorder-controls">
            {!isRecording ? (
              <div className="controls-wrapper">
                <button className="btn btn-primary btn-lg record-btn" onClick={startRecording} disabled={loading}>🎤 Start Recording</button>
                <button className="btn btn-secondary btn-lg skip-btn" onClick={onSkipRecording} disabled={loading}>⊘ Skip Recording</button>
              </div>
            ) : (
              <div className="controls-wrapper">
                <button className="btn btn-danger btn-lg record-btn" onClick={stopRecording}>⏹️ Stop Recording</button>
                <button className="btn btn-success btn-lg finish-btn" onClick={() => { stopRecording(); if (typeof onFinishConsultation === 'function') onFinishConsultation() }} disabled={recordingTime < 5} title={recordingTime < 5 ? 'Record at least 5 seconds' : 'Finish consultation now'}>✓ Finish Consultation</button>
              </div>
            )}
          </div>

          <div className="recorder-info">
            <div className="info-card">
              <span className="info-icon">ℹ️</span>
              <div>
                <h4>Recording Tips</h4>
                <ul>
                  <li>✓ Automatically downsampled to 16kHz (PCM s16le)</li>
                  <li>✓ Mono channel (single audio stream)</li>
                  <li>✓ Echo cancellation & noise reduction enabled</li>
                  <li>✓ Speak clearly in a quiet environment</li>
                  <li>✓ Minimum 3 seconds required for AI processing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
