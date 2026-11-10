import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../../../src/store/AppProvider'
import { Button } from '../../../src/components/shared'
import { ConsultationRecorder } from './ConsultationRecorder'
import './doctor-pages.css'
import './ConsultationRecorder.css'

const hasPersistedResults = (consultation) => Boolean(consultation.resultsJson || consultation.results)

export const DoctorConsultations = ({ selectedDoctor }) => {
  const navigate = useNavigate()
  const {
    getPatientById,
    getDoctorPatients,
    getDoctorConsultations,
    addConsultation,
    refreshConsultations,
    startConsultationSession,
    updateConsultation,
    saveConsultationResults,
  } = useAppContext()
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [activeRecordingConsultation, setActiveRecordingConsultation] = useState(null)
  const [isScheduling, setIsScheduling] = useState(false)
  const [consultationData, setConsultationData] = useState({
    patientId: '',
    title: '',
    scheduledFor: '',
  })
  const [scheduleMessage, setScheduleMessage] = useState('')
  const [scheduleMessageType, setScheduleMessageType] = useState('')

  const consultations = getDoctorConsultations(selectedDoctor.id)
  const doctorPatients = getDoctorPatients(selectedDoctor.id)

  const showStatusMessage = (message, type = 'info') => {
    setScheduleMessage(typeof message === 'string' ? message : JSON.stringify(message))
    setScheduleMessageType(type)
  }

  const handleRecordingComplete = async (recordingData) => {
    const consultation = consultations.find((item) => item.id === recordingData.consultationId)
    if (!consultation) {
      setScheduleMessage('Recording finished, but consultation was not found in state.')
      return
    }

    try {
      if (recordingData.notes !== undefined) {
        await updateConsultation({
          ...consultation,
          notes: recordingData.notes || null,
        })
      }

      const saved = await saveConsultationResults(consultation, recordingData, recordingData)
      setScheduleMessage('Consultation results saved to backend.')
      if (saved?.consultation?.id) {
        navigate(`/doctor/consultations/${saved.consultation.backendId || String(saved.consultation.id).replace('cons-', '')}/results`)
      }
    } catch (error) {
      setScheduleMessage(error.message || 'Failed to save recording to backend.')
    }
    // Stay on the recorder view so the user can see entity extraction and save to history
  }

  const handleScheduleConsultation = async (event) => {
    event?.preventDefault()

    if (isScheduling) {
      return
    }

    const selectedPatient = doctorPatients.find((patient) => patient.id === consultationData.patientId)
    const patientId = selectedPatient?.id || consultationData.patientId

    if (!patientId || !consultationData.title.trim() || !consultationData.scheduledFor) {
      showStatusMessage('Please complete the title, patient, and date/time before scheduling.', 'error')
      return
    }

    setIsScheduling(true)
    showStatusMessage('Scheduling consultation...', 'info')

    try {
      await addConsultation({
        patientId,
        doctorId: selectedDoctor.id,
        title: consultationData.title.trim(),
        scheduledFor: consultationData.scheduledFor,
        status: 'scheduled',
      })
      await refreshConsultations({ doctorId: selectedDoctor.id })
      setConsultationData({ patientId: '', title: '', scheduledFor: '' })
      showStatusMessage('Consultation scheduled and sent to the patient.', 'success')
      setShowScheduleForm(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to schedule consultation in backend.'
      showStatusMessage(message || 'Failed to schedule consultation in backend.', 'error')
    } finally {
      setIsScheduling(false)
    }
  }

  const handleToggleRecording = async (consultation, isRecording) => {
    if (isRecording) {
      setActiveRecordingConsultation(null)
      return
    }

    try {
      await startConsultationSession(consultation)
      setActiveRecordingConsultation(consultation.id)
      setScheduleMessage('Consultation started. Recording is active.')
    } catch (error) {
      setScheduleMessage(error.message || 'Failed to start consultation session.')
    }
  }

  const activeConsultation = activeRecordingConsultation
    ? consultations.find((c) => c.id === activeRecordingConsultation)
    : null
  const activePatient = activeConsultation
    ? getPatientById(activeConsultation.patientId)
    : null

  if (activeConsultation) {
    return (
      <div className="doctor-consultations">
        <button
          className="btn-back-to-list"
          onClick={() => setActiveRecordingConsultation(null)}
        >
          ← Back to consultations
        </button>
        <ConsultationRecorder
          consultation={activeConsultation}
          consultationId={activeConsultation.id}
          patientName={activePatient?.name}
          onRecordingComplete={handleRecordingComplete}
          autoStart={true}
        />
      </div>
    )
  }

  return (
    <div className="doctor-consultations">
      <div className="section-header">
        <h2>📅 Consultations</h2>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowScheduleForm(!showScheduleForm)}
        >
          {showScheduleForm ? 'Cancel' : '+ Schedule Consultation'}
        </Button>
      </div>

      {showScheduleForm && (
        <form className="form-container" onSubmit={handleScheduleConsultation}>
          <input
            type="text"
            placeholder="Consultation Title"
            required
            value={consultationData.title}
            onChange={(e) => setConsultationData({ ...consultationData, title: e.target.value })}
          />
          <select
            value={consultationData.patientId}
            onChange={(e) =>
              setConsultationData({ ...consultationData, patientId: e.target.value })
            }
            required
          >
            <option value="">Select Patient</option>
            {doctorPatients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name} ({patient.age})
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            required
            value={consultationData.scheduledFor}
            onChange={(e) =>
              setConsultationData({ ...consultationData, scheduledFor: e.target.value })
            }
          />
          <Button variant="success" type="submit" disabled={isScheduling}>
            {isScheduling ? 'Scheduling...' : 'Schedule'}
          </Button>
          {scheduleMessage && (
            <p className={`form-feedback ${scheduleMessageType === 'success' ? 'success-feedback' : scheduleMessageType === 'error' ? 'error-feedback' : ''}`}>
              {scheduleMessage}
            </p>
          )}
        </form>
      )}

      {!showScheduleForm && scheduleMessage && (
        <p className={`form-feedback ${scheduleMessageType === 'success' ? 'success-feedback' : scheduleMessageType === 'error' ? 'error-feedback' : ''}`}>
          {scheduleMessage}
        </p>
      )}

      <div className="consultations-list">
        {consultations.length === 0 ? (
          <p className="empty-state">No consultations scheduled</p>
        ) : (
          consultations.map((consultation) => {
            const patient = getPatientById(consultation.patientId)
            const date = new Date(consultation.scheduledFor)
            return (
              <div key={consultation.id} className={`consultation-card status-${consultation.status}`}>
                <div className="consultation-info">
                  <h4>{consultation.title}</h4>
                  <p>Patient: {patient?.name}</p>
                  <small>
                    📅 {date.toLocaleDateString()} at {date.toLocaleTimeString()}
                  </small>
                </div>
                <div className="consultation-meta">
                  <span className={`badge status-${consultation.status}`}>
                    {consultation.status}
                  </span>
                  {consultation.status === 'completed' && hasPersistedResults(consultation) ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/doctor/consultations/${consultation.backendId || String(consultation.id).replace('cons-', '')}/results`)}
                    >
                      View Consultation Results
                    </Button>
                  ) : consultation.status === 'completed' ? (
                    <span className="consultation-meta-note">Results not saved yet</span>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setActiveRecordingConsultation(consultation.id)}
                    >
                      🎙️ Start Recording
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
