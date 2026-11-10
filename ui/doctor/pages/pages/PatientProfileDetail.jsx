import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../../src/store/AppProvider'
import { Button } from '../../../src/components/shared'
import { buildAnamnesisSummary } from '../../../src/utils/anamnesisSummary'
import './PatientProfileDetail.css'

export const PatientProfileDetail = ({ patient, onClose, selectedDoctor }) => {
  const {
    getPatientFormResponses,
    getFormById,
    assignFormToPatient,
    deleteForm,
    refreshPatientForms,
    doctors,
    forms
  } = useAppContext()

  const [showAssignForm, setShowAssignForm] = useState(false)
  const [selectedFormId, setSelectedFormId] = useState('')
  const [editingForm, setEditingForm] = useState(null)
  const [viewingAnswers, setViewingAnswers] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [assignError, setAssignError] = useState('')
  const [assignSuccess, setAssignSuccess] = useState(false)

  // Pull latest responses from backend whenever this profile is opened
  useEffect(() => {
    refreshPatientForms().catch(() => {})
  }, [patient.id])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshPatientForms()
    } finally {
      setIsRefreshing(false)
    }
  }

  const patientForms = getPatientFormResponses(patient.id).filter(
    (r) => !r.doctorId || r.doctorId === selectedDoctor?.id
  )
  const availableForms = forms.filter(f => !patientForms.some(pf => pf.formId === f.id))

  const handleAssignForm = async () => {
    if (!selectedFormId) return

    setIsAssigning(true)
    setAssignError('')
    try {
      const doctorId = selectedDoctor?.id || patient.assignedDoctorIds?.[0]

      await assignFormToPatient({
        formId: selectedFormId,
        patientId: patient.id,
        doctorId,
      })
      setShowAssignForm(false)
      setSelectedFormId('')
      setAssignSuccess(true)
      setTimeout(() => setAssignSuccess(false), 3000)
    } catch (error) {
      setAssignError(error.message || 'Failed to assign form to patient.')
    } finally {
      setIsAssigning(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#10b981'
      case 'in_progress':
        return '#f59e0b'
      case 'pending':
        return '#3b82f6'
      default:
        return '#9ca3af'
    }
  }

  return (
    <div className="patient-profile-detail">
      <div className="profile-header">
        <div className="profile-info">
          <div className="profile-avatar">
            {patient.name.charAt(0).toUpperCase()}
          </div>
          <div className="profile-header-content">
            <h2>{patient.name}</h2>
            <div className="profile-meta">
              <span>👤 Age: {patient.age}</span>
              <span>📧 {patient.email}</span>
              <span>🆔 ID: {patient.id}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? '…' : '↻'} Refresh
          </Button>
          <Button variant="secondary" onClick={onClose} size="sm">
            ✕ Close
          </Button>
        </div>
      </div>

      {/* Medical History Section */}
      <div className="profile-section">
        <div className="section-title">
          <h3>📋 Medical History</h3>
        </div>
        <div className="medical-history-box">
          <p>{patient.medicalHistory || 'No medical history recorded'}</p>
        </div>
      </div>

      {/* Assigned Forms Section */}
      <div className="profile-section">
        <div className="section-title">
          <h3>📝 Assigned Forms</h3>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowAssignForm(!showAssignForm)
              setAssignError('')
            }}
          >
            {showAssignForm ? '✕ Cancel' : '➕ Assign Form'}
          </Button>
        </div>

        {assignSuccess && (
          <p className="assign-success-message">✓ Form successfully assigned to {patient.name}!</p>
        )}

        {/* Assign Form Panel */}
        {showAssignForm && (
          <div className="assign-form-panel">
            <div className="form-group">
              <label>Select Form to Assign</label>
              <select
                value={selectedFormId}
                onChange={(e) => setSelectedFormId(e.target.value)}
                className="form-select"
                disabled={isAssigning}
              >
                <option value="">-- Choose a form --</option>
                {availableForms.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.title}
                  </option>
                ))}
              </select>
            </div>
            {assignError && <p className="submit-error">{assignError}</p>}
            <Button
              variant="success"
              onClick={handleAssignForm}
              disabled={!selectedFormId || isAssigning}
            >
              {isAssigning ? 'Assigning…' : '✓ Confirm Assignment'}
            </Button>
          </div>
        )}

        {/* Forms List */}
        {patientForms.length === 0 ? (
          <div className="empty-state">
            <p>No forms assigned yet</p>
          </div>
        ) : (
          <div className="forms-list">
            {patientForms.map((formResponse) => {
              const form = getFormById(formResponse.formId)
              const completionPercent = form
                ? Math.round((Object.keys(formResponse.responses).length / form.questions.length) * 100)
                : 0
              const anamnesisSummary =
                form?.kind === 'anamnesis' && formResponse.status === 'completed'
                  ? buildAnamnesisSummary(formResponse.responses)
                  : []

              return (
                <div key={formResponse.id} className="form-card">
                  <div className="form-card-header">
                    <div className="form-title-section">
                      <h4>{form?.title}</h4>
                      <p className="form-description">{form?.description}</p>
                    </div>
                    <div className="form-status-badge" style={{ background: getStatusColor(formResponse.status) }}>
                      {formResponse.status}
                    </div>
                  </div>

                  <div className="form-card-content">
                    <div className="progress-section">
                      <div className="progress-info">
                        <span className="progress-label">Completion</span>
                        <span className="progress-percent">{completionPercent}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${completionPercent}%` }}></div>
                      </div>
                    </div>

                    <div className="form-meta">
                      <span>Questions: {form?.questions?.length || 0}</span>
                      <span>Answered: {Object.keys(formResponse.responses).length}</span>
                      <span>Due: {new Date(formResponse.assignedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="form-card-actions">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingForm(editingForm === formResponse.id ? null : formResponse.id)}
                    >
                      {editingForm === formResponse.id ? '✕' : '✏️ Manage'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete form "${form?.title}" for this patient?`)) {
                          deleteForm(formResponse.formId)
                        }
                      }}
                    >
                      🗑️ Delete
                    </Button>
                  </div>

                  {/* Edit Panel */}
                  {editingForm === formResponse.id && (
                    <div className="edit-panel">
                      {anamnesisSummary.length > 0 && (
                        <div className="doctor-anamnesis-summary">
                          <span>Clinician preparation summary</span>
                          <h4>Structured anamnesis highlights</h4>
                          <div className="doctor-summary-grid">
                            {anamnesisSummary.map((item) => (
                              <div key={item.label} className="doctor-summary-item">
                                <small>{item.label}</small>
                                <strong>{item.value}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="edit-options">
                        <div className="edit-option">
                          <strong>Form Settings</strong>
                          <p>Modify form details for this patient</p>
                          <Button variant="outline" size="sm">
                            Edit Form
                          </Button>
                        </div>
                        <div className="edit-option">
                          <strong>Reassign</strong>
                          <p>Update deadline or reassign</p>
                          <Button variant="outline" size="sm">
                            Change Deadline
                          </Button>
                        </div>
                        <div className="edit-option">
                          <strong>View Responses</strong>
                          <p>See what patient answered</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingAnswers(viewingAnswers === formResponse.id ? null : formResponse.id)}
                          >
                            {viewingAnswers === formResponse.id ? 'Hide Answers' : 'View Answers'}
                          </Button>
                        </div>
                      </div>

                      {/* Answers panel */}
                      {viewingAnswers === formResponse.id && (
                        <div className="answers-panel">
                          <div className="answers-panel-header">
                            <span className="answers-panel-label">Patient Responses</span>
                            <span className="answers-panel-count">
                              {Object.keys(formResponse.responses).length} / {form?.questions?.length || 0} answered
                            </span>
                          </div>
                          {!form?.questions?.length ? (
                            <p className="answers-empty">Form definition unavailable.</p>
                          ) : Object.keys(formResponse.responses).length === 0 ? (
                            <p className="answers-empty">No answers submitted yet.</p>
                          ) : (
                            <div className="answers-list">
                              {form.questions.map((q, idx) => {
                                const raw = formResponse.responses[q.id]
                                const hasAnswer = raw !== undefined && raw !== null && raw !== ''
                                const display = Array.isArray(raw)
                                  ? raw.join(', ')
                                  : String(raw ?? '')
                                return (
                                  <div key={q.id} className={`answer-item ${!hasAnswer ? 'answer-item--empty' : ''}`}>
                                    <span className="answer-question">
                                      <span className="answer-index">{idx + 1}</span>
                                      {q.text}
                                    </span>
                                    <span className="answer-value">
                                      {hasAnswer
                                        ? (q.type === 'scale'
                                            ? `${display} / ${q.scale?.max ?? 10}`
                                            : display)
                                        : <em>Not answered</em>}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Patient Stats */}
      <div className="profile-section">
        <h3>📊 Patient Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Forms</span>
            <span className="stat-value">{patientForms.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Completed</span>
            <span className="stat-value" style={{ color: '#10b981' }}>
              {patientForms.filter(f => f.status === 'completed').length}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">In Progress</span>
            <span className="stat-value" style={{ color: '#f59e0b' }}>
              {patientForms.filter(f => f.status === 'in_progress').length}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Pending</span>
            <span className="stat-value" style={{ color: '#3b82f6' }}>
              {patientForms.filter(f => f.status === 'pending').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
