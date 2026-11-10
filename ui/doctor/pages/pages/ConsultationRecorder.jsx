import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useAppContext } from '../../../src/store/AppProvider'
import { LiveConsultationView } from './LiveConsultationView'
import { ConsultationAnalysis, buildAnalysisSummary } from './ConsultationAnalysis'
import './ConsultationRecorder.css'

export const ConsultationRecorder = ({
  consultation,
  consultationId,
  patientName,
  onRecordingComplete,
  autoStart = false,
}) => {
  const { updateConsultation } = useAppContext()
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingStatus, setRecordingStatus] = useState('idle') // idle, recording, paused, completed
  const [audioBlob, setAudioBlob] = useState(null)
  const [tags, setTags] = useState([])
  const [saved, setSaved] = useState(false)
  const [notes, setNotes] = useState(consultation?.notes || '')
  const [notesSaved, setNotesSaved] = useState(Boolean(consultation?.notes))
  const [notesSaving, setNotesSaving] = useState(false)
  const [transcriptChunks, setTranscriptChunks] = useState([])
  const [entities, setEntities] = useState([])
  const [reasoning, setReasoning] = useState({ suggestions: [], reasoning_path: [], synthesized_drivers: [] })
  const chunkCounterRef = useRef(0)
  const autoStartedRef = useRef(false)
  const startTimeRef = useRef(null)
  const pausedElapsedRef = useRef(0)
  const notesSaveTimerRef = useRef(null)
  const lastSavedNotesRef = useRef(consultation?.notes || '')

  useEffect(() => {
    const nextNotes = consultation?.notes || ''
    setNotes(nextNotes)
    setNotesSaved(Boolean(nextNotes))
    lastSavedNotesRef.current = nextNotes
  }, [consultation?.backendId])

  const persistNotes = useCallback(
    async (nextNotes, { force = false } = {}) => {
      const consultationBackendId =
        consultation?.backendId || Number(String(consultationId).replace('cons-', ''))

      if (!consultationBackendId) {
        return false
      }

      const persistedNotes = nextNotes.trim() ? nextNotes : ''

      if (!force && persistedNotes === lastSavedNotesRef.current) {
        return true
      }

      setNotesSaving(true)
      try {
        await updateConsultation({
          ...(consultation || {}),
          backendId: consultationBackendId,
          notes: persistedNotes || null,
        })
        lastSavedNotesRef.current = persistedNotes
        setNotesSaved(true)
        return true
      } catch (error) {
        console.warn('Failed to persist doctor notes:', error)
        setNotesSaved(false)
        return false
      } finally {
        setNotesSaving(false)
      }
    },
    [consultation, consultationId, updateConsultation]
  )

  useEffect(() => {
    if (recordingStatus !== 'recording' && recordingStatus !== 'paused') {
      return undefined
    }

    if (notesSaveTimerRef.current) {
      clearTimeout(notesSaveTimerRef.current)
    }

    notesSaveTimerRef.current = setTimeout(() => {
      persistNotes(notes).catch(() => {})
    }, 700)

    return () => {
      if (notesSaveTimerRef.current) {
        clearTimeout(notesSaveTimerRef.current)
        notesSaveTimerRef.current = null
      }
    }
  }, [notes, persistNotes, recordingStatus])

  const handleSave = () => {
    const record = {
      id: `saved-${Date.now()}`,
      patientName,
      consultationId,
      date: new Date().toISOString(),
      duration: recordingTime,
      tags,
      notes,
      summary: buildAnalysisSummary(tags, entities, reasoning),
    }
    const existing = JSON.parse(localStorage.getItem('precerto_consultation_history') || '[]')
    localStorage.setItem('precerto_consultation_history', JSON.stringify([record, ...existing]))
    setSaved(true)
  }

  const handleTag = (chunk) => {
    setTags((prev) =>
      prev.some((t) => t.id === chunk.id)
        ? prev.filter((t) => t.id !== chunk.id)
        : [...prev, { id: chunk.id, text: chunk.text, ts: chunk.ts }]
    )
  }

  // Web Audio API refs
  const audioContextRef = useRef(null)
  const processorRef = useRef(null)
  const sourceRef = useRef(null)
  const audioChunksRef = useRef([])
  const pcmDataRef = useRef([])
  const timerRef = useRef(null)
  const streamRef = useRef(null)
  const websocketRef = useRef(null)

  /**
   * Convert Float32 to Int16 PCM
   * Matches AudioRecorder.jsx implementation
   */
  const convertFloat32ToInt16 = (float32Array) => {
    const int16Array = new Int16Array(float32Array.length)
    for (let i = 0; i < float32Array.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]))
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
    }
    return int16Array.buffer
  }

  const startRecording = async () => {
    // Clear any lingering interval before creating a new one (guards against StrictMode double-call)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    try {
      setRecordingStatus('recording')
      setIsRecording(true)
      setRecordingTime(0)
      setTranscriptChunks([])
      setEntities([])
      setReasoning({ suggestions: [], reasoning_path: [], synthesized_drivers: [] })
      chunkCounterRef.current = 0
      audioChunksRef.current = []
      pcmDataRef.current = []
      startTimeRef.current = Date.now()
      pausedElapsedRef.current = 0

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      streamRef.current = stream

      // Close any stale WebSocket from a previous session
      if (websocketRef.current && websocketRef.current.readyState !== WebSocket.CLOSED) {
        websocketRef.current.close()
        websocketRef.current = null
      }

      // Initialize WebSocket for real-time streaming
      try {
        websocketRef.current = new WebSocket('ws://127.0.0.1:8000/ws/audio')
        websocketRef.current.binaryType = 'arraybuffer'

        websocketRef.current.onopen = () => {
          console.log('✓ WebSocket connected for consultation recording')
        }

        websocketRef.current.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data)
            if (msg.type === 'LIVE_UPDATE') {
              if (msg.transcript_chunk?.trim()) {
                const now = new Date()
                const ts = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
                chunkCounterRef.current += 1
                setTranscriptChunks((prev) => [
                  ...prev,
                  { id: `chunk-${chunkCounterRef.current}`, text: msg.transcript_chunk.trim(), ts },
                ])
              }
              if (Array.isArray(msg.extracted_entities) && msg.extracted_entities.length > 0) {
                setEntities(msg.extracted_entities)
              }
              if (msg.reasoning) {
                setReasoning({
                  suggestions: msg.reasoning.suggestions || [],
                  reasoning_path: msg.reasoning.reasoning_path || [],
                  synthesized_drivers: msg.reasoning.synthesized_drivers || [],
                })
              }
            }
          } catch (_) {}
        }

        websocketRef.current.onerror = (error) => {
          console.warn('WebSocket error:', error)
        }
      } catch (wsError) {
        console.warn('WebSocket not available, recording locally only')
      }

      // Create AudioContext at 16kHz
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      })
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      sourceRef.current = source

      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      source.connect(processor)
      processor.connect(audioContext.destination)

      // Process audio in real-time
      processor.onaudioprocess = (event) => {
        const float32Audio = event.inputBuffer.getChannelData(0)
        audioChunksRef.current.push(new Float32Array(float32Audio))

        const int16Buffer = convertFloat32ToInt16(float32Audio)
        pcmDataRef.current.push(int16Buffer)

        // Send via WebSocket if available
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          websocketRef.current.send(int16Buffer)
        }
      }

      // Wall-clock timer — reads Date.now() so it can't drift or double-count
      timerRef.current = setInterval(() => {
        setRecordingTime(pausedElapsedRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 500)

      console.log('✓ Consultation recording started - 16kHz Mono PCM')
    } catch (error) {
      console.error('Error accessing microphone:', error)
      setRecordingStatus('idle')
      setIsRecording(false)
      alert('Unable to access microphone for recording')
    }
  }

  useEffect(() => {
    if (autoStart && !autoStartedRef.current) {
      autoStartedRef.current = true
      startRecording()
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const stopRecording = async () => {
    // Stop timer immediately — before anything that can throw
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    try {
      // Close WebSocket if open
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.close()
      }

      // Disconnect audio nodes
      if (processorRef.current) processorRef.current.disconnect()
      if (sourceRef.current) sourceRef.current.disconnect()
      if (audioContextRef.current) audioContextRef.current.close()

      // Stop microphone stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      // Combine PCM chunks
      const totalLength = pcmDataRef.current.reduce((sum, buf) => sum + buf.byteLength, 0)
      const pcmBuffer = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of pcmDataRef.current) {
        pcmBuffer.set(new Uint8Array(chunk), offset)
        offset += chunk.byteLength
      }

      // Create audio blob
      const blob = new Blob(audioChunksRef.current, { type: 'audio/raw' })
      setAudioBlob(blob)

      setRecordingStatus('completed')
      setIsRecording(false)

      if (notesSaveTimerRef.current) {
        clearTimeout(notesSaveTimerRef.current)
        notesSaveTimerRef.current = null
      }

      await persistNotes(notes, { force: true })

      // Notify parent component
      if (onRecordingComplete) {
        onRecordingComplete({
          blob,
          pcmBuffer,
          duration: recordingTime,
          sampleRate: 16000,
          channels: 1,
          consultationId,
          patientName,
          timestamp: new Date().toISOString(),
          transcriptChunks,
          transcriptText: transcriptChunks.map((chunk) => chunk.text).join(' '),
          entities,
          reasoning,
          tags,
          notes,
          summary: buildAnalysisSummary(tags, entities, reasoning),
        })
      }

      console.log('✓ Consultation recording stopped')
      console.log(`✓ Recording duration: ${recordingTime}s, Size: ${totalLength} bytes`)
    } catch (error) {
      console.error('Error stopping recording:', error)
    }
  }

  const pauseRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    // Freeze the elapsed count so resume picks up from here
    if (startTimeRef.current !== null) {
      pausedElapsedRef.current += Math.floor((Date.now() - startTimeRef.current) / 1000)
      startTimeRef.current = null
    }
    if (audioContextRef.current) await audioContextRef.current.suspend()
    setRecordingStatus('paused')
    setIsRecording(false)
  }

  const resumeRecording = async () => {
    if (audioContextRef.current) await audioContextRef.current.resume()
    startTimeRef.current = Date.now()
    setRecordingStatus('recording')
    setIsRecording(true)
    timerRef.current = setInterval(() => {
      setRecordingTime(pausedElapsedRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 500)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className="consultation-recorder">
      <div className="recorder-card">
        <div className="recorder-header">
          <h3>🎙️ Consultation Recording</h3>
          <p className="patient-info">{patientName}</p>
        </div>

        <div className="recorder-display">
          <div className={`recording-indicator ${isRecording ? 'active' : ''}`}>
            {isRecording && <div className="pulse"></div>}
            <span className="status-text">{recordingStatus.toUpperCase()}</span>
          </div>

          <div className="timer">{formatTime(recordingTime)}</div>

          {recordingStatus === 'completed' && (
            <div className="completion-badge">✓ Recording saved</div>
          )}
        </div>

        <div className="recorder-controls">
          {recordingStatus === 'idle' && (
            <button
              className="btn btn-record"
              onClick={startRecording}
              title="Start recording consultation"
            >
              ● Record
            </button>
          )}

          {recordingStatus === 'recording' && (
            <>
              <button
                className="btn btn-pause"
                onClick={pauseRecording}
                title="Pause recording"
              >
                ⏸ Pause
              </button>
              <button
                className="btn btn-stop"
                onClick={stopRecording}
                title="Stop and save recording"
              >
                ⏹ Stop
              </button>
            </>
          )}

          {recordingStatus === 'paused' && (
            <>
              <button
                className="btn btn-resume"
                onClick={resumeRecording}
                title="Resume recording"
              >
                ▶ Resume
              </button>
              <button
                className="btn btn-stop"
                onClick={stopRecording}
                title="Stop and save recording"
              >
                ⏹ Stop
              </button>
            </>
          )}

          {recordingStatus === 'completed' && audioBlob && (
            <button
              className="btn btn-download"
              onClick={() => {
                const url = URL.createObjectURL(audioBlob)
                const a = document.createElement('a')
                a.href = url
                a.download = `consultation-${consultationId}-${Date.now()}.wav`
                a.click()
              }}
              title="Download recording"
            >
              ⬇ Download
            </button>
          )}
        </div>

        {recordingStatus === 'completed' && (
          <div className="recorder-info">
            <p>✓ Recording completed and ready for processing</p>
            <p className="info-small">Duration: {formatTime(recordingTime)} | Connected to backend WebSocket</p>
          </div>
        )}
      </div>

      {recordingStatus === 'completed' && (
        <div className="recorder-save-banner">
          {!saved ? (
            <>
              <div className="recorder-save-banner-text">
                <strong>Recording complete</strong>
                <span>{formatTime(recordingTime)} recorded{tags.length > 0 ? ` · ${tags.length} moment${tags.length > 1 ? 's' : ''} tagged` : ''}</span>
              </div>
              <button className="recorder-save-cta" onClick={handleSave}>
                Save to History
              </button>
            </>
          ) : (
            <div className="recorder-save-confirm">
              <span className="recorder-save-check">✓</span>
              Saved — open the <strong>History</strong> tab to review it
            </div>
          )}
        </div>
      )}

      {/* Live two-panel view during recording / paused */}
      {(recordingStatus === 'recording' || recordingStatus === 'paused') && (
        <LiveConsultationView
          patientName={patientName}
          isRecording={isRecording}
          transcriptChunks={transcriptChunks}
          entities={entities}
          reasoning={reasoning}
          tags={tags}
          onTag={handleTag}
        />
      )}

      {/* Full synthesis workspace after recording stops */}
      {recordingStatus === 'completed' && (
        <ConsultationAnalysis
          consultationId={consultationId}
          patientName={patientName}
          recordingDuration={recordingTime}
          tags={tags}
          transcriptChunks={transcriptChunks}
          entities={entities}
          reasoning={reasoning}
        />
      )}

      {/* Doctor notes panel — below the analysis panels */}
      {(recordingStatus === 'recording' || recordingStatus === 'paused') && (
        <div className="doctor-notes-panel">
          <div className="doctor-notes-header">
            <div className="doctor-notes-header-left">
              <span className="doctor-notes-icon">📝</span>
              <div>
                <h4>Doctor Notes</h4>
                <p>Add clinical observations, follow-up actions, or any remarks about this consultation.</p>
              </div>
            </div>
            {notesSaved && !notesSaving && (
              <span className="doctor-notes-saved-badge">✓ Saved</span>
            )}
            {notesSaving && (
              <span className="doctor-notes-saved-badge">Saving...</span>
            )}
          </div>
          <textarea
            className="doctor-notes-textarea"
            placeholder="e.g. Patient reports worsening symptoms over 3 days. Prescribed ibuprofen 400mg. Follow-up in 1 week if no improvement…"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value)
              setNotesSaved(false)
            }}
            rows={6}
          />
          <div className="doctor-notes-actions">
            <span className="doctor-notes-count">{notes.length} characters</span>
            <button
              className="doctor-notes-save-btn"
              onClick={() => persistNotes(notes, { force: true })}
              disabled={notesSaving || notes === lastSavedNotesRef.current}
            >
              {notesSaving ? 'Saving...' : notesSaved ? '✓ Saved' : 'Save Notes'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
