import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AudioRecorder from './AudioRecorder'
import SymptomExtraction from './SymptomExtraction'
import DiagnosticReasoning from './DiagnosticReasoning'
import ClinicianConfirmation from './ClinicianConfirmation'
import LiveTranscription from './LiveTranscription'
import Header from './Header'
import { processAudioDialogue, extractSymptoms, generateDiagnoses, generateExplanations } from '../utils/diagnosticLogic'
import '../App.css'
import './DoctorDashboard.css'

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const [stage, setStage] = useState('recording')
  const [audioBlob, setAudioBlob] = useState(null)
  const [transcription, setTranscription] = useState('')
  const [tags, setTags] = useState([])
  const [symptoms, setSymptoms] = useState([])
  const [diagnoses, setDiagnoses] = useState([])
  const [explanations, setExplanations] = useState({})
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [consultationCompleted, setConsultationCompleted] = useState(false)
  const [recordingSkipped, setRecordingSkipped] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const addChunkRef = useRef(null)

  const handleAudioRecorded = async (audioData) => {
    setLoading(true)
    setError(null)
    try {
      // audioData now contains:
      // - blob: audio blob for legacy compatibility
      // - pcmBuffer: Uint8Array ready for backend (PCM s16le at 16kHz mono)
      // - duration: recording duration in seconds
      // - sampleRate: 16000 Hz
      // - channels: 1 (mono)
      // - formatInfo: metadata about audio format
      
      setAudioBlob(audioData.blob || audioData)
      
      console.log('📊 Audio Data Summary:')
      console.log(`  Format: ${audioData.formatInfo?.type || 'Unknown'}`)
      console.log(`  Sample Rate: ${audioData.sampleRate || 'Unknown'} Hz`)
      console.log(`  Channels: ${audioData.channels || '?'}`)
      console.log(`  Duration: ${audioData.duration || '?'} seconds`)
      console.log(`  Buffer Size: ${audioData.pcmBuffer?.byteLength || 0} bytes`)
      
      /**
       * WEBSOCKET INTEGRATION POINT:
       * ===========================
       * If you want to send raw PCM to your FastAPI backend:
       * 
       * const websocket = new WebSocket('ws://your-backend:8000/transcribe')
       * websocket.send(audioData.pcmBuffer)
       * 
       * Backend receives bytes and processes with faster-whisper:
       * import numpy as np
       * data = await websocket.receive_bytes()
       * audio_np = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0
       * transcription = await transcriber.transcribe(audio_np)
       */
      
      // Use real WebSocket transcript if available, otherwise fall back to mock
      const transcribedText = audioData.liveText || await processAudioDialogue(audioData.blob || audioData)
      setTranscription(transcribedText)
      setStage('extraction')
    } catch (err) {
      setError('Error processing audio: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSymptomsExtracted = async (extractedSymptoms) => {
    setLoading(true)
    setError(null)
    try {
      setSymptoms(extractedSymptoms)
      const generatedDiagnoses = await generateDiagnoses(extractedSymptoms)
      setDiagnoses(generatedDiagnoses)
      
      const explanationMap = {}
      for (const diagnosis of generatedDiagnoses) {
        explanationMap[diagnosis.id] = await generateExplanations(diagnosis, extractedSymptoms)
      }
      setExplanations(explanationMap)
      setStage('reasoning')
    } catch (err) {
      setError('Error extracting symptoms: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDiagnosisSelected = (diagnosis) => {
    setSelectedDiagnosis(diagnosis)
    setStage('confirmation')
  }

  const handleRejectDiagnoses = () => {
    // Reset to recording stage to allow re-recording
    setStage('recording')
    setAudioBlob(null)
    setTranscription('')
    setSymptoms([])
    setDiagnoses([])
    setExplanations({})
    setSelectedDiagnosis(null)
    setError('Diagnoses rejected. You can now re-record the consultation.')
  }

  const handleSkipRecording = () => {
    // Patient chooses not to be recorded
    setRecordingSkipped(true)
    setConsultationCompleted(true)
    setStage('completed')
  }

  const handleFinishConsultation = () => {
    // Stop recording and proceed to extraction stage
    setConsultationCompleted(true)
    setIsRecording(false)
    setStage('extraction')
  }

  const handleTagsUpdated = (updatedTags) => {
    setTags(updatedTags)
  }

  const handleRegisterChunk = (fn) => {
    addChunkRef.current = fn
  }

  const handleRecordingStateChange = (isRec, time) => {
    setIsRecording(isRec)
    setRecordingTime(time)
  }

  const handleConfirmed = () => {
    setStage('completed')
  }

  const handleReset = () => {
    setStage('recording')
    setAudioBlob(null)
    setTranscription('')
    setSymptoms([])
    setDiagnoses([])
    setExplanations({})
    setSelectedDiagnosis(null)
    setError(null)
    setConsultationCompleted(false)
    setRecordingSkipped(false)
    setTags([])
    setRecordingTime(0)
    setIsRecording(false)
  }

  return (
    <div className="doctor-dashboard">
      <button className="btn-logout" onClick={() => navigate('/')}>Back to Home</button>
      <Header role="Doctor" />
      
      {error && <div className="error-banner">{error}</div>}
      
      {stage === 'completed' && (
        <div className="completion-message">
          <h2>Consultation Completed</h2>
          {recordingSkipped ? (
            <p>The patient chose not to be recorded. Consultation marked as completed without audio recording.</p>
          ) : (
            <p>The diagnostic assessment has been completed successfully.</p>
          )}
          <button onClick={handleReset} className="btn-primary">Start New Assessment</button>
        </div>
      )}

      {stage !== 'completed' && (
        <>
          {stage === 'recording' && (
            <div className="doctor-recording-layout">
              <div className="audio-recorder-section">
                <AudioRecorder 
                  onAudioRecorded={handleAudioRecorded} 
                  onSkipRecording={handleSkipRecording}
                  onFinishConsultation={handleFinishConsultation}
                  onRecordingStateChange={handleRecordingStateChange}
                  onSimulatedTranscriptionChunk={(chunk) => {
                    if (addChunkRef.current) addChunkRef.current(chunk)
                  }}
                  loading={loading} 
                />
              </div>
              <div className="live-transcription-section">
                <LiveTranscription
                  isRecording={isRecording}
                  recordingTime={recordingTime}
                  onTagsUpdated={handleTagsUpdated}
                  registerChunkHandler={handleRegisterChunk}
                />
              </div>
            </div>
          )}
          {stage === 'extraction' && (
            <SymptomExtraction 
              transcription={transcription}
              onSymptomsExtracted={handleSymptomsExtracted}
              loading={loading}
            />
          )}
          {stage === 'reasoning' && (
            <DiagnosticReasoning
              symptoms={symptoms}
              diagnoses={diagnoses}
              explanations={explanations}
              onDiagnosisSelected={handleDiagnosisSelected}
              onRejectDiagnoses={handleRejectDiagnoses}
              loading={loading}
            />
          )}
          {stage === 'confirmation' && selectedDiagnosis && (
            <ClinicianConfirmation
              diagnosis={selectedDiagnosis}
              symptoms={symptoms}
              tags={tags}
              onConfirmed={handleConfirmed}
              onBack={() => setStage('reasoning')}
            />
          )}
        </>
      )}
    </div>
  )
}
