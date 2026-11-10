import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../../../src/store/AppProvider'
import { API_BASE_URL } from '../../../src/services/api'
import { Button, FormStepper } from '../../../src/components/shared'
import { ConsultationCardWeather } from './ConsultationCardWeather'
import wellnessPlantCompleteStage from '../../../src/assets/wellness-plant-complete-stage.png'
import wellnessPlantGrowingStage from '../../../src/assets/wellness-plant-growing-stage.png'
import wellnessPlantProgress from '../../../src/assets/wellness-plant-progress.png'
import wellnessPlantSeedStage from '../../../src/assets/wellness-plant-seed-stage.png'
import wellnessPlantSproutStage from '../../../src/assets/wellness-plant-sprout-stage.png'
import { buildAnamnesisSummary } from '../../../src/utils/anamnesisSummary'
import './patient-pages.css'

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

const plantStages = [
  { min: 0, image: wellnessPlantSeedStage },
  { min: 25, image: wellnessPlantSproutStage },
  { min: 50, image: wellnessPlantGrowingStage },
  { min: 75, image: wellnessPlantProgress },
  { min: 100, image: wellnessPlantCompleteStage },
]

const getPlantImage = (progress) => {
  if (progress >= 100) return plantStages[4].image
  if (progress >= 75) return plantStages[3].image
  if (progress >= 50) return plantStages[2].image
  if (progress >= 25) return plantStages[1].image
  return plantStages[0].image
}

const formatDateTime = (value) => {
  if (!value) return 'Not set'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not set'

  return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

const CITY_OPTIONS = ['Geneva', 'Zurich', 'Lausanne', 'Bern', 'Basel', 'Paris', 'London', 'Berlin', 'Milan', 'Barcelona']

const FlowerProgress = ({ progress, completedCount, totalCount }) => {
  const safeProgress = Math.min(100, Math.max(0, progress))
  const plantStage =
    safeProgress >= 100
      ? 'complete'
      : safeProgress >= 75
        ? 'blooming'
        : safeProgress >= 50
          ? 'growing'
          : safeProgress >= 25
            ? 'sprout'
            : 'seed'
  const progressMessage =
    plantStage === 'complete'
      ? 'Your care journey is complete.'
      : plantStage === 'seed'
        ? 'Your care journey is ready to grow.'
        : 'Your care journey is growing.'
  const progressLabel =
    totalCount > 0
      ? `${completedCount} of ${totalCount} forms completed`
      : 'No forms assigned yet'
  const plantImage = getPlantImage(safeProgress)

  return (
    <div className="flower-progress-card care-progress-card">
      <div className={`flower-visual care-progress-visual flower-stage-${plantStage}`} aria-hidden="true">
        <div className="care-progress-illustration">
          <img
            key={plantImage}
            src={plantImage}
            alt={`Care progress ${safeProgress}%`}
            className="care-progress-plant care-progress-image"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
      <div className="flower-progress-copy care-progress-content">
        <strong>
          <span className="flower-progress-value">{safeProgress}%</span>
          <span className="flower-progress-label">Complete</span>
        </strong>
        <p>{progressMessage}</p>
      </div>
      <div className="flower-progress-meter" aria-hidden="true">
        <span style={{ width: `${safeProgress}%` }} />
      </div>
      <span className="flower-progress-status">{progressLabel}</span>
    </div>
  )
}

export const PatientDashboard = ({
  selectedPatient,
  activeTab = 'home',
  selectedConsultation,
  consultationWeatherRevision = 0,
  setSelectedConsultation,
  onFormFlowChange,
}) => {
  const navigate = useNavigate()
  const {
    getPatientConsultations,
    getPatientFormResponses,
    getPatientDoctors,
    getFormById,
    getDoctorById,
    updateFormResponse,
    updatePatient,
  } = useAppContext()
  const [selectedForm, setSelectedForm] = useState(null)
  const [summaryForm, setSummaryForm] = useState(null)
  const [profileScreen, setProfileScreen] = useState('overview')
  const [isEditingCity, setIsEditingCity] = useState(false)
  const [cityDraft, setCityDraft] = useState('Geneva')
  const [recordingAudioUrl, setRecordingAudioUrl] = useState(null)
  const [recordingAudioLoading, setRecordingAudioLoading] = useState(false)
  const [recordingAudioError, setRecordingAudioError] = useState('')

  const isInFormFlow = Boolean(selectedForm || summaryForm)
  const safePatient = selectedPatient || null

  const handleFormFlowBack = () => {
    if (selectedForm) {
      setSelectedForm(null)
      return
    }

    if (summaryForm) {
      setSummaryForm(null)
    }
  }

  useEffect(() => {
    if (!onFormFlowChange) return

    onFormFlowChange(isInFormFlow, isInFormFlow ? handleFormFlowBack : null)

    return () => {
      onFormFlowChange(false, null)
    }
  }, [handleFormFlowBack, isInFormFlow, onFormFlowChange])

  const formResponses = safePatient ? getPatientFormResponses(safePatient.id) : []
  const consultations = safePatient
    ? getPatientConsultations(safePatient.id).sort(
        (a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor)
      )
    : []
  const activityItems = [...formResponses].sort((a, b) => {
    const dateA = a.assignedAt ? new Date(a.assignedAt).getTime() : 0
    const dateB = b.assignedAt ? new Date(b.assignedAt).getTime() : 0
    return dateB - dateA
  })
  const completedFormsCount = formResponses.filter(
    (response) => response.status === 'completed'
  ).length
  const totalProgress = formResponses.length
    ? Math.round((completedFormsCount / formResponses.length) * 100)
    : 0
  const assignedDoctors = safePatient ? getPatientDoctors(safePatient.id) : []
  const nextConsultation = consultations.find((consultation) => {
    if (consultation.status === 'completed') return false
    const scheduledDate = new Date(consultation.scheduledFor)
    return !Number.isNaN(scheduledDate.getTime()) && scheduledDate.getTime() > Date.now()
  }) || consultations[0] || null

  useEffect(() => {
    setCityDraft(safePatient?.city || 'Geneva')
    setIsEditingCity(false)
  }, [safePatient?.id, safePatient?.city])

  const handleSaveCity = async () => {
    const nextCity = cityDraft || 'Geneva'

    if (!safePatient) return

    try {
      await updatePatient({
        ...safePatient,
        city: nextCity,
        latitude: null,
        longitude: null,
        locationSource: 'profile',
      })
      setIsEditingCity(false)
    } catch {
      // Keep the current city visible if persistence fails.
    }
  }

  useEffect(() => {
    if (!safePatient?.id || typeof navigator === 'undefined' || !navigator.geolocation) {
      return undefined
    }

    if (
      safePatient.locationSource === 'profile' ||
      safePatient.locationSource === 'browser' ||
      (safePatient.latitude != null && safePatient.longitude != null)
    ) {
      return undefined
    }

    let active = true

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (!active) return

        try {
          await updatePatient({
            ...safePatient,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            locationSource: 'browser',
          })
        } catch {
          // Keep the stored profile city as a fallback if location persistence fails.
        }
      },
      () => {
        // Profile city remains the fallback when geolocation is unavailable or denied.
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 10 * 60 * 1000 }
    )

    return () => {
      active = false
    }
  }, [safePatient, updatePatient])

  if (!safePatient) {
    return (
      <section className="dashboard-section patient-profile-section" aria-label="Profile loading state">
        <div className="patient-profile-hero">
          <span className="flower-kicker">Profile</span>
          <h3>Loading profile...</h3>
          <p>Preparing patient details.</p>
        </div>
      </section>
    )
  }

  useEffect(() => {
    let active = true
    let createdObjectUrl = null

    const loadConsultationRecording = async () => {
      if (!selectedConsultation) {
        setRecordingAudioUrl(null)
        setRecordingAudioError('')
        setRecordingAudioLoading(false)
        return
      }

      const recordingUrl = selectedConsultation.recordingUrl || (selectedConsultation.recordingFilePath ? `/api/consultations/${selectedConsultation.backendId || String(selectedConsultation.id).replace('cons-', '')}/recording` : null)
      if (!recordingUrl) {
        setRecordingAudioUrl(null)
        setRecordingAudioError('Recording unavailable')
        setRecordingAudioLoading(false)
        return
      }

      setRecordingAudioLoading(true)
      setRecordingAudioError('')

      try {
        const response = await fetch(`${API_BASE_URL}${recordingUrl}`)
        if (!response.ok) {
          throw new Error('Recording unavailable')
        }

        const pcmBuffer = await response.arrayBuffer()
        const wavBlob = decodePcmToWavBlob(
          pcmBuffer,
          selectedConsultation.recordingSampleRate || 16000,
          selectedConsultation.recordingChannels || 1
        )

        if (!active) return

        setRecordingAudioUrl((previousUrl) => {
          if (previousUrl) URL.revokeObjectURL(previousUrl)
          createdObjectUrl = URL.createObjectURL(wavBlob)
          return createdObjectUrl
        })
      } catch {
        if (active) {
          setRecordingAudioUrl(null)
          setRecordingAudioError('Recording unavailable')
        }
      } finally {
        if (active) setRecordingAudioLoading(false)
      }
    }

    loadConsultationRecording().catch(() => {})

    return () => {
      active = false
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl)
      }
    }
  }, [selectedConsultation])

  const getStatusLabel = (status) => {
    if (status === 'in_progress') return 'In Progress'
    if (status === 'completed') return 'Completed'
    return 'Pending'
  }

  if (selectedForm) {
    const formData = getFormById(selectedForm.formId)
    if (!formData) {
      return (
        <div className="patient-form-container">
          <p className="empty-state">This form is no longer available.</p>
        </div>
      )
    }

    return (
      <div className="patient-form-overlay-screen" role="dialog" aria-modal="true" aria-label="Symptom submission form">
        <header className="patient-form-top-nav">
          <div className="nav-title">
            <button
              className="top-nav-back"
              type="button"
              aria-label="Back"
              onClick={handleFormFlowBack}
            >
              ←
            </button>
            <h1>{formData.title || 'Form'}</h1>
          </div>
        </header>
        <div className="patient-form-overlay-content">
          <div className="patient-form-container">
            <FormStepper
              form={formData}
              initialResponses={selectedForm.responses}
              onProgress={(responses, progress) => {
                setSelectedForm((prev) =>
                  prev
                    ? {
                        ...prev,
                        responses,
                        status: progress >= 100 ? 'completed' : 'in_progress',
                        progress,
                      }
                    : prev
                )
              }}
              onComplete={(responses) => {
                updateFormResponse({
                  ...selectedForm,
                  patientName: selectedPatient.name,
                  responses,
                  status: 'completed',
                  progress: 100,
                })
                setSelectedForm(null)
              }}
              onFinishLater={(responses) => {
                const answeredCount = Object.values(responses).filter((v) =>
                  Array.isArray(v) ? v.length > 0 : v !== '' && v != null
                ).length
                const progress = Math.min(
                  Math.round((answeredCount / formData.questions.length) * 100),
                  99
                )
                updateFormResponse({
                  ...selectedForm,
                  patientName: selectedPatient.name,
                  responses,
                  status: answeredCount > 0 ? 'in_progress' : 'pending',
                  progress,
                })
                setSelectedForm(null)
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  if (summaryForm) {
    const form = getFormById(summaryForm.formId)
    const doctor = getDoctorById(summaryForm.doctorId)
    const anamnesisSummary =
      form?.kind === 'anamnesis' ? buildAnamnesisSummary(summaryForm.responses) : []

    return (
      <div className="patient-form-overlay-screen" role="dialog" aria-modal="true" aria-label="Submitted form summary">
        <header className="patient-form-top-nav">
          <div className="nav-title">
            <button
              className="top-nav-back"
              type="button"
              aria-label="Back"
              onClick={handleFormFlowBack}
            >
              ←
            </button>
            <h1>{form?.title || 'Completed form'}</h1>
          </div>
        </header>
        <div className="patient-form-overlay-content">
          <div className="patient-form-container">
            <div className="completed-summary">
              <div className="completed-summary-header">
                <span className="flower-kicker">Submitted summary</span>
                <h1>{form?.title || 'Completed form'}</h1>
                <p>
                  {doctor ? `Assigned by ${doctor.name}` : 'Assigned by your doctor'} -{' '}
                  {summaryForm.assignedAt
                    ? new Date(summaryForm.assignedAt).toLocaleDateString()
                    : 'Recently'}
                </p>
              </div>

              {anamnesisSummary.length > 0 && (
                <div className="clinician-summary-panel">
                  <span className="flower-kicker">Clinician preparation summary</span>
                  <h2>Structured anamnesis highlights</h2>
                  <div className="clinician-summary-grid">
                    {anamnesisSummary.map((item) => (
                      <div key={item.label} className="clinician-summary-item">
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="summary-answer-list">
                {(form?.questions || []).map((question, index) => {
                  const answer = summaryForm.responses?.[question.id]
                  const displayedAnswer = Array.isArray(answer)
                    ? answer.join(', ')
                    : answer ?? 'No answer provided'

                  return (
                    <div key={question.id} className="summary-answer-item">
                      <span>Question {index + 1}</span>
                      <h3>{question.text}</h3>
                      <p>{displayedAnswer}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderHomeTab = () => (
    <>
      <div className="flower-progress-shell">
        <FlowerProgress
          progress={totalProgress}
          completedCount={completedFormsCount}
          totalCount={formResponses.length}
        />
      </div>

      <section className="dashboard-section">
        <h2>Your Forms</h2>
        {formResponses.length === 0 ? (
          <p className="empty-state">Your doctor will share guided forms here.</p>
        ) : (
          <div className="forms-grid">
            {formResponses.map((response) => {
              const form = getFormById(response.formId)
              const doctor = getDoctorById(response.doctorId)
              const statusClass = `form-status-${response.status}`
              const formTitle = form?.title || 'Assigned form'
              const formDescription =
                form?.description || 'This form is being prepared by your doctor.'

              return (
                <div
                  key={response.id}
                  className={`form-card ${statusClass} ${response.status === 'completed' ? 'clickable-card' : ''}`}
                  onClick={() => {
                    if (response.status === 'completed') setSummaryForm(response)
                  }}
                  role={response.status === 'completed' ? 'button' : undefined}
                  tabIndex={response.status === 'completed' ? 0 : undefined}
                  onKeyDown={(event) => {
                    if (response.status === 'completed' && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault()
                      setSummaryForm(response)
                    }
                  }}
                >
                  <div className="form-card-header">
                    <h3>{formTitle}</h3>
                    <span className={`badge status-${response.status}`}>
                      {response.status === 'pending'
                        ? 'Not Started'
                        : response.status === 'in_progress'
                          ? 'In Progress'
                          : 'Completed'}
                    </span>
                  </div>
                  <p>{formDescription}</p>
                  {doctor && <small>From: {doctor.name}</small>}
                  <div className="form-progress-container">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${response.progress}%` }} />
                    </div>
                    <span className="progress-text">{response.progress}% Complete</span>
                  </div>
                  {response.status !== 'completed' && (
                    <Button
                      variant={response.status === 'pending' ? 'secondary' : 'primary'}
                      size="sm"
                      fullWidth
                      onClick={() => setSelectedForm(response)}
                    >
                      {response.status === 'pending' ? 'Start' : 'Continue'}
                    </Button>
                  )}
                  {response.status === 'completed' && (
                    <span className="summary-link-text">View submitted summary</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

    </>
  )

  const renderProfileTab = () => {
    if (profileScreen === 'care-history') {
      return (
        <section className="profile-history-page" aria-label="Care history">
          <div className="profile-history-fixed-header">
            <button
              className="page-back-button"
              type="button"
              aria-label="Back to profile"
              onClick={() => setProfileScreen('overview')}
            >
              ←
            </button>
            <h2>Care History</h2>
          </div>

          <div className="profile-history-list">
            {activityItems.length === 0 ? (
              <p className="empty-state">No care assignment history yet.</p>
            ) : (
              <div className="activity-list">
                {activityItems.map((response) => {
                  const form = getFormById(response.formId)
                  const doctor = getDoctorById(response.doctorId)
                  const assignedTimestamp = response.assignedAt
                    ? formatDateTime(response.assignedAt)
                    : 'Recently'
                  const isPending = response.status === 'pending'
                  const initials =
                    doctor?.name
                      ?.split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2) || 'DR'

                  return (
                    <div
                      key={response.id}
                      className={`activity-item ${isPending ? 'clickable-card' : ''}`}
                      role={isPending ? 'button' : undefined}
                      tabIndex={isPending ? 0 : undefined}
                      onClick={() => {
                        if (!isPending) return
                        setSelectedForm(response)
                      }}
                      onKeyDown={(event) => {
                        if (!isPending) return
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelectedForm(response)
                        }
                      }}
                    >
                      <div className="activity-avatar">{initials}</div>
                      <div className="activity-copy">
                        <strong>{doctor ? doctor.name : 'Your doctor'}</strong>
                        <p>Assigned {form?.title || 'a form or test'}</p>
                        <p>{assignedTimestamp}</p>
                      </div>
                      <span className={`badge status-${response.status}`}>{getStatusLabel(response.status)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      )
    }

    return (
      <>
        <section className="dashboard-section patient-profile-section">
          <div className="patient-profile-hero">
            <span className="flower-kicker">Profile</span>
            <h3>{safePatient.name || 'Patient profile'}</h3>
            <p>{safePatient.age ? `${safePatient.age} years old` : 'Patient profile information'}</p>
          </div>

          <div className="patient-profile-grid">
            <div className="patient-profile-item">
              <span>Care status</span>
              <strong className="status-active">Active</strong>
            </div>
            <div className="patient-profile-item patient-profile-city-item">
              <span>Home city</span>
              {!isEditingCity ? (
                <div className="patient-profile-city-row">
                  <strong>{safePatient.city || 'Geneva'}</strong>
                  <button
                    className="profile-city-change-btn"
                    type="button"
                    onClick={() => setIsEditingCity(true)}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="patient-profile-city-editor">
                  <select
                    className="patient-profile-city-select"
                    value={cityDraft}
                    onChange={(event) => setCityDraft(event.target.value)}
                  >
                    {CITY_OPTIONS.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  <div className="patient-profile-city-actions">
                    <button className="profile-city-save-btn" type="button" onClick={handleSaveCity}>
                      Save city
                    </button>
                    <button
                      className="profile-city-cancel-btn"
                      type="button"
                      onClick={() => {
                        setCityDraft(safePatient.city || 'Geneva')
                        setIsEditingCity(false)
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="patient-profile-item">
              <span>Assigned doctors</span>
              <strong>
                {assignedDoctors.length > 0
                  ? assignedDoctors.map((doctor) => doctor.name).join(', ')
                  : 'Not assigned yet'}
              </strong>
            </div>
            <div className="patient-profile-item">
              <span>Next consultation</span>
              <strong>{nextConsultation ? formatDateTime(nextConsultation.scheduledFor) : 'None scheduled'}</strong>
            </div>
            <div className="patient-profile-item">
              <span>Forms</span>
              <strong>
                {formResponses.length > 0
                  ? `${completedFormsCount} completed, ${formResponses.length - completedFormsCount} pending`
                  : 'No forms assigned yet'}
              </strong>
            </div>
          </div>

          <div className="profile-menu-list" role="navigation" aria-label="Profile menu">
            <button
              className="profile-menu-item"
              type="button"
              onClick={() => setProfileScreen('care-history')}
            >
              <strong>Care History</strong>
              <span>View doctor assignments, forms/tests, dates, and statuses</span>
            </button>
          </div>
        </section>
        <div className="patient-profile-actions">
          <button
            className="patient-disconnect-btn"
            type="button"
            onClick={() => navigate('/')}
          >
            Disconnect
          </button>
        </div>
      </>
    )
  }

  const renderConsultationsTab = () => (
    selectedConsultation ? (() => {
      const doctor = getDoctorById(selectedConsultation.doctorId)

      return (
        <section className="consultation-detail-page" aria-label="Consultation details">
          <div className="consultation-detail-fixed-header">
            <button
              className="page-back-button"
              type="button"
              aria-label="Back to consultations"
              onClick={() => setSelectedConsultation(null)}
            >
              ←
            </button>
            <h2>Consultation Details</h2>
          </div>

          <div className="consultation-detail-content">
            <div className="consultation-title-block">
              <span className="flower-kicker">Consultation</span>
              <h3>{selectedConsultation.title || 'Untitled consultation'}</h3>
            </div>

            <div className="consultation-detail-grid">
              <div className="consultation-detail-item">
                <span>Status</span>
                <strong className={`badge status-${selectedConsultation.status}`}>
                  {selectedConsultation.status}
                </strong>
              </div>
              <div className="consultation-detail-item">
                <span>Doctor</span>
                <strong>
                  {doctor ? doctor.name : 'Assigned doctor'}
                  {doctor?.specialty ? ` - ${doctor.specialty}` : ''}
                </strong>
              </div>
              <div className="consultation-detail-item">
                <span>Scheduled for</span>
                <strong>{formatDateTime(selectedConsultation.scheduledFor)}</strong>
              </div>
              <div className="consultation-detail-item">
                <span>Started at</span>
                <strong>{formatDateTime(selectedConsultation.startedAt)}</strong>
              </div>
              <div className="consultation-detail-item">
                <span>Ended at</span>
                <strong>{formatDateTime(selectedConsultation.endedAt)}</strong>
              </div>
            </div>

            {selectedConsultation.notes ? (
              <div className="consultation-notes-block">
                <span>Notes</span>
                <p>{selectedConsultation.notes}</p>
              </div>
            ) : null}

            <div className="consultation-recording-block">
              <span>Recording</span>
              {recordingAudioLoading ? (
                <p>Loading recording...</p>
              ) : recordingAudioUrl ? (
                <div className="consultation-recording-player-wrap">
                  {selectedConsultation.recordingOriginalName && (
                    <p className="consultation-recording-filename">{selectedConsultation.recordingOriginalName}</p>
                  )}
                  <audio controls className="consultation-recording-player" src={recordingAudioUrl} />
                </div>
              ) : (
                <p>{recordingAudioError || 'Recording unavailable'}</p>
              )}
            </div>
          </div>
        </section>
      )
    })() : consultations.length === 0 ? (
      <div className="consultations-empty-background">
        <div className="consultations-empty-panel">
          Your upcoming consultations will appear here.
        </div>
      </div>
    ) : (
      <div className="consultations-list-screen">
        <div className="patient-consultation-list">
          {consultations.map((consultation) => {
            const doctor = getDoctorById(consultation.doctorId)
            const scheduledDate = new Date(consultation.scheduledFor)

            return (
              <button
                key={consultation.id}
                type="button"
                className="patient-consultation-card"
                onClick={() => setSelectedConsultation(consultation)}
              >
                <div>
                  <h3>{consultation.title}</h3>
                  <p>{doctor ? `With ${doctor.name} - ${doctor.specialty}` : 'With your doctor'}</p>
                  <small>
                    {scheduledDate.toLocaleDateString()} at{' '}
                    {scheduledDate.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </small>
                </div>
                <span className={`badge status-${consultation.status}`}>
                  {consultation.status}
                </span>
                <ConsultationCardWeather
                  patient={selectedPatient}
                  consultation={consultation}
                  consultationWeatherRevision={consultationWeatherRevision}
                />
              </button>
            )
          })}
        </div>
      </div>
    )
  )

  const renderActiveTab = () => {
    if (activeTab === 'profile') return renderProfileTab()
    if (activeTab === 'consultations') return renderConsultationsTab()
    return renderHomeTab()
  }

  return (
    <div className="patient-dashboard" data-active-tab={activeTab}>
      {renderActiveTab()}
    </div>
  )
}

export default PatientDashboard
