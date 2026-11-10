import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppContext } from '../../../src/store/AppProvider'
import { API_BASE_URL, getConsultation as apiGetConsultation, getConsultationResults as apiGetConsultationResults } from '../../../src/services/api'
import { ConsultationAnalysis } from './ConsultationAnalysis'
import './ConsultationAnalysis.css'
import './ConsultationResults.css'

const decodePcmToWavBlob = (arrayBuffer, sampleRate = 16000, channels = 1) => {
  const pcmBytes = new Uint8Array(arrayBuffer)
  const dataLength = pcmBytes.byteLength
  const buffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(buffer)
  const writeString = (offset, value) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * channels * 2, true)
  view.setUint16(32, channels * 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, dataLength, true)
  new Uint8Array(buffer, 44).set(pcmBytes)

  return new Blob([buffer], { type: 'audio/wav' })
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
}

const resolvePatientName = (bundle, consultation, fallbackPatient) =>
  bundle?.result?.patient_name || bundle?.result?.patient?.name || consultation?.patientName || fallbackPatient?.name || 'Unknown patient'

const mapSegmentsToChunks = (segments, fallbackChunks = []) => {
  if (!Array.isArray(segments) || segments.length === 0) return fallbackChunks
  return segments.map((segment) => ({
    id: `seg-${segment.segment_index}`,
    ts: segment.timestamp_label || '',
    text: segment.text,
    speaker: segment.speaker,
    isTagged: segment.is_tagged,
  }))
}

const mapEntities = (entities = [], fallbackEntities = []) => {
  if (Array.isArray(entities) && entities.length > 0) {
    return entities.map((entity) => {
      if (typeof entity === 'string') return entity
      return entity.entity_text || entity.name || entity.text || ''
    }).filter(Boolean)
  }

  if (Array.isArray(fallbackEntities) && fallbackEntities.length > 0) {
    return fallbackEntities.map((entity) => {
      if (typeof entity === 'string') return entity
      return entity.entity_text || entity.name || entity.text || ''
    }).filter(Boolean)
  }

  return []
}

const mapConsultationFromBundle = (consultation) => {
  if (!consultation) return null

  return {
    id: `cons-${consultation.id}`,
    backendId: consultation.id,
    patientId: consultation.patient_id ? `pat-${consultation.patient_id}` : null,
    doctorId: consultation.doctor_id || null,
    title: consultation.title || 'Consultation',
    scheduledFor: consultation.scheduled_for || null,
    status: consultation.status || 'completed',
    notes: consultation.notes || '',
    resultsJson: consultation.results_json || null,
    startedAt: consultation.started_at || null,
    endedAt: consultation.ended_at || null,
    recordingFilePath: consultation.recording_file_path || null,
    recordingUrl: consultation.recording_url || (consultation.recording_file_path ? `/api/consultations/${consultation.id}/recording` : null),
    recordingOriginalName: consultation.recording_original_name || null,
    recordingMimeType: consultation.recording_mime_type || null,
    recordingSizeBytes: consultation.recording_size_bytes || null,
    recordingDurationSeconds: consultation.recording_duration_seconds || null,
    recordingSampleRate: consultation.recording_sample_rate || null,
    recordingChannels: consultation.recording_channels || null,
    createdAt: consultation.created_at || null,
    updatedAt: consultation.updated_at || null,
  }
}

export const ConsultationResults = () => {
  const { consultationId } = useParams()
  const navigate = useNavigate()
  const normalizedConsultationId = String(consultationId || '').replace(/^cons-/, '')
  const {
    consultations,
    getConsultationById,
    getPatientById,
    getDoctorById,
    refreshCoreData,
  } = useAppContext()
  const [resultBundle, setResultBundle] = useState(null)
  const [remoteConsultation, setRemoteConsultation] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [audioError, setAudioError] = useState('')
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  useEffect(() => {
    refreshCoreData().catch(() => {})
  }, [refreshCoreData])

  useEffect(() => {
    let cancelled = false

    setPageLoading(true)
    setPageError('')
    setResultBundle(null)
    setRemoteConsultation(null)

    const loadConsultation = async () => {
      const cached = getConsultationById(`cons-${normalizedConsultationId}`) || consultations.find((item) => String(item.backendId) === String(normalizedConsultationId))
      if (cached) {
        setRemoteConsultation(cached)
      }

      try {
        const fetched = await apiGetConsultationResults(normalizedConsultationId)
        if (!cancelled) {
          if (!fetched?.consultation) {
            throw new Error('No consultation results were returned for this record.')
          }

          setResultBundle(fetched)
          setRemoteConsultation(mapConsultationFromBundle(fetched.consultation))
          setPageLoading(false)
        }
      } catch {
        if (!cancelled && !cached) {
          try {
            const fetchedConsultation = await apiGetConsultation(normalizedConsultationId)
            if (!cancelled) {
              setRemoteConsultation(mapConsultationFromBundle(fetchedConsultation))
              setPageError('Saved results are unavailable for this consultation.')
              setPageLoading(false)
            }
          } catch {
            if (!cancelled) {
              setPageError('Unable to load consultation results.')
              setPageLoading(false)
            }
          }
        }
      }
    }

    loadConsultation().catch(() => {})

    return () => {
      cancelled = true
    }
  }, [consultationId, consultations, getConsultationById])

  const consultation = remoteConsultation || getConsultationById(`cons-${normalizedConsultationId}`)
  const results = useMemo(() => {
    if (!consultation) return null
    if (resultBundle?.result) {
      return {
        consultationMeta: resultBundle.result.consultation_meta || resultBundle.result.consultationMeta || null,
        doctor: resultBundle.result.doctor || null,
        patient: resultBundle.result.patient || null,
        recording: resultBundle.result.recording || null,
        transcript: resultBundle.result.transcript || null,
        analysis: resultBundle.result.analysis || null,
        savedAt: resultBundle.result.saved_at || resultBundle.result.savedAt || null,
      }
    }
    if (consultation.results) return consultation.results
    if (!consultation.resultsJson) return null
    try {
      return JSON.parse(consultation.resultsJson)
    } catch {
      return null
    }
  }, [consultation])

  const patient = getPatientById(results?.patient?.id || consultation?.patientId)
  const doctor = getDoctorById(results?.doctor?.id || consultation?.doctorId)
  const doctorNotes = (consultation?.notes || '').trim()
  const transcriptChunks = mapSegmentsToChunks(resultBundle?.transcript_segments, results?.transcript?.chunks || [])
  const analysis = resultBundle?.result?.analysis || results?.analysis || {}
  const reasoning = {
    ...(analysis.reasoning || { suggestions: [], reasoning_path: [] }),
    synthesized_drivers: analysis.synthesized_drivers || analysis.reasoning?.synthesized_drivers || [],
  }
  const tags = analysis.tags || []
  const entities = mapEntities(resultBundle?.entities, analysis.entities)

  useEffect(() => {
    let active = true
    let createdObjectUrl = null

    const loadAudio = async () => {
      const recordingUrl = consultation?.recordingUrl || (resultBundle?.result?.recording_file_path ? `/api/consultations/${consultation.backendId || normalizedConsultationId}/recording` : null)
      if (!recordingUrl) {
        setAudioUrl(null)
        return
      }

      setAudioLoading(true)
      setAudioError('')

      try {
        const response = await fetch(`${API_BASE_URL}${recordingUrl}`)
        if (!response.ok) {
          throw new Error('Recording not available')
        }
        const pcmBuffer = await response.arrayBuffer()
        const wavBlob = decodePcmToWavBlob(
          pcmBuffer,
          consultation.recordingSampleRate || results?.recording?.sampleRate || 16000,
          consultation.recordingChannels || results?.recording?.channels || 1
        )
        if (!active) return
        setAudioUrl((previousUrl) => {
          if (previousUrl) URL.revokeObjectURL(previousUrl)
          createdObjectUrl = URL.createObjectURL(wavBlob)
          return createdObjectUrl
        })
      } catch (error) {
        if (active) {
          setAudioError(error.message || 'Unable to load recording')
          setAudioUrl(null)
        }
      } finally {
        if (active) setAudioLoading(false)
      }
    }

    loadAudio().catch(() => {})

    return () => {
      active = false
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl)
      }
    }
  }, [consultation?.recordingUrl, consultation?.recordingSampleRate, consultation?.recordingChannels, resultBundle, results, normalizedConsultationId])

  if (!consultation) {
    if (pageLoading) {
      return (
        <div className="consultation-results-page consultation-results-page--empty">
          <div className="results-shell">
            <button className="results-back-btn" onClick={() => navigate('/doctor')}>
              ← Back to Doctor Dashboard
            </button>
            <div className="results-empty-card">
              <h2>Loading consultation results...</h2>
              <p>Fetching saved results for consultation {normalizedConsultationId}.</p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="consultation-results-page consultation-results-page--empty">
        <div className="results-shell">
          <button className="results-back-btn" onClick={() => navigate('/doctor')}>
            ← Back to Doctor Dashboard
          </button>
          <div className="results-empty-card">
            <h2>{pageError || 'Consultation not found'}</h2>
            <p>The saved consultation could not be loaded.</p>
          </div>
        </div>
      </div>
    )
  }

  if (pageLoading) {
    return (
      <div className="consultation-results-page consultation-results-page--empty">
        <div className="results-shell">
          <button className="results-back-btn" onClick={() => navigate('/doctor')}>
            ← Back to Doctor Dashboard
          </button>
          <div className="results-empty-card">
            <h2>Loading consultation results...</h2>
            <p>Fetching saved results for consultation {normalizedConsultationId}.</p>
          </div>
        </div>
      </div>
    )
  }

  if (pageError && !resultBundle) {
    return (
      <div className="consultation-results-page consultation-results-page--empty">
        <div className="results-shell">
          <button className="results-back-btn" onClick={() => navigate('/doctor')}>
            ← Back to Doctor Dashboard
          </button>
          <div className="results-empty-card">
            <h2>Unable to load saved results</h2>
            <p>{pageError}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="consultation-results-page">
      <div className="results-shell">
        <div className="results-topbar">
          <button className="results-back-btn" onClick={() => navigate('/doctor')}>
            ← Back to Doctor Dashboard
          </button>
          <span className={`results-status results-status--${consultation.status}`}>{consultation.status}</span>
        </div>

        <header className="results-hero">
          <div>
            <p className="results-kicker">Persisted consultation results</p>
            <h1>{consultation.title}</h1>
            <p className="results-subtitle">
              Completed consultation for {resolvePatientName(resultBundle, consultation, patient)}
            </p>
          </div>
          <div className="results-meta-grid">
            <div className="results-meta-card">
              <span>Doctor</span>
              <strong>{results?.doctor?.name || doctor?.name || consultation.doctorId}</strong>
              <small>{results?.doctor?.specialty || doctor?.specialty || '—'}</small>
            </div>
            <div className="results-meta-card">
              <span>Patient</span>
              <strong>{resolvePatientName(resultBundle, consultation, patient)}</strong>
              <small>{results?.patient?.age ? `${results.patient.age} years old` : patient?.age ? `${patient.age} years old` : '—'}</small>
            </div>
            <div className="results-meta-card">
              <span>Consultation time</span>
              <strong>{formatDateTime(resultBundle?.result?.savedAt || consultation.endedAt || consultation.updatedAt || consultation.createdAt)}</strong>
              <small>{formatDateTime(results?.consultationMeta?.scheduledFor || consultation.scheduledFor)}</small>
            </div>
            <div className="results-meta-card">
              <span>Recording</span>
              <strong>{results?.recording?.durationSeconds || consultation.recordingDurationSeconds || 0}s</strong>
              <small>{consultation.recordingOriginalName || results?.recording?.originalName || 'Audio stored on backend'}</small>
            </div>
          </div>
        </header>

        <section className="results-audio-card">
          <div className="results-section-heading">
            <h2>Audio Playback</h2>
            <p>Loaded from the persisted recording reference.</p>
          </div>
          {audioLoading && <div className="results-inline-note">Loading recording...</div>}
          {!audioLoading && audioError && <div className="results-inline-note results-inline-note--error">{audioError}</div>}
          {!audioLoading && audioUrl && <audio controls src={audioUrl} className="results-audio-player" />}
        </section>

        <ConsultationAnalysis
          recordingDuration={results?.recording?.durationSeconds || consultation.recordingDurationSeconds}
          patientName={resolvePatientName(resultBundle, consultation, patient)}
          consultationId={consultation.id}
          tags={tags}
          transcriptChunks={transcriptChunks}
          entities={entities}
          reasoning={reasoning}
          initialAnalysisComplete={true}
        />

        <section className="results-notes-card">
          <div className="results-section-heading">
            <h2>Saved Details</h2>
            <p>Transcript, summary, and consultation metadata stored with the consultation record.</p>
          </div>

          {results?.transcript?.text ? (
            <div className="results-detail-block">
              <h3>Transcript summary</h3>
              <p>{results.transcript.text}</p>
            </div>
          ) : null}

          {results?.analysis?.summary ? (
            <div className="results-detail-block">
              <h3>Analysis summary</h3>
              <pre>{JSON.stringify(results.analysis.summary, null, 2)}</pre>
            </div>
          ) : null}
        </section>

        <section className="results-notes-card">
          <div className="results-section-heading">
            <h2>Doctor Notes</h2>
            <p>Notes saved with this consultation.</p>
          </div>

          <div className="results-detail-block">
            <h3>Doctor Notes</h3>
            {doctorNotes ? <p>{doctorNotes}</p> : <p>No doctor notes added.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}