import React, { useState } from 'react'
import { useAppContext } from '../../../src/store/AppProvider'
import { Button } from '../../../src/components/shared'
import { PatientProfileDetail } from './PatientProfileDetail'
import './PatientListView.css'

/**
 * Patient List View - Doctor's dashboard showing all assigned patients
 * Features: Patient summary cards, form completion status, profile management
 */
export const PatientListView = ({ selectedDoctor }) => {
  const {
    patients,
    getDoctorById,
    getDoctorPatients,
    getPatientConsultations,
    getPatientFormResponses,
  } = useAppContext()
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [consultationPatient, setConsultationPatient] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const assignedPatients = selectedDoctor
    ? getDoctorPatients(selectedDoctor.id)
    : patients

  const getMedicalHistoryPreview = (medicalHistory) => {
    const historyText = Array.isArray(medicalHistory)
      ? medicalHistory.join(', ')
      : medicalHistory || 'No medical history recorded'

    return historyText.length > 60 ? `${historyText.substring(0, 60)}...` : historyText
  }

  const getDoctorPatientForms = (patientId) =>
    getPatientFormResponses(patientId).filter(
      (r) => !r.doctorId || r.doctorId === selectedDoctor?.id
    )

  // Filter patients by search term
  const filteredPatients = assignedPatients.filter((patient) => {
    const matchesSearch = (patient.name || '').toLowerCase().includes(searchTerm.toLowerCase())

    if (filterStatus === 'all') return matchesSearch

    const patientForms = getDoctorPatientForms(patient.id)
    if (filterStatus === 'completed') {
      return matchesSearch && patientForms.every(f => f.status === 'completed')
    }
    if (filterStatus === 'pending') {
      return matchesSearch && patientForms.some(f => f.status === 'pending' || f.status === 'in_progress')
    }
    return matchesSearch
  })

  const getCompletionPercentage = (patientId) => {
    const forms = getDoctorPatientForms(patientId)
    if (forms.length === 0) return 0
    const completedCount = forms.filter(f => f.status === 'completed').length
    return Math.round((completedCount / forms.length) * 100)
  }

  return (
    <div className="patient-list-view">
      {/* Header Section */}
      <div className="list-header">
        <div className="header-content">
          <h2>👥 Patient Management</h2>
          <p>Manage patient data, forms, and consultations</p>
        </div>
      </div>

      {/* Controls Section */}
      <div className="list-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search patients by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-buttons">
          <Button
            variant={filterStatus === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            All Patients ({assignedPatients.length})
          </Button>
          <Button
            variant={filterStatus === 'completed' ? 'success' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('completed')}
          >
            ✓ Completed
          </Button>
          <Button
            variant={filterStatus === 'pending' ? 'warning' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('pending')}
          >
            ⏳ Pending
          </Button>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">Total Patients</span>
          <span className="stat-number">{assignedPatients.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Active Forms</span>
          <span className="stat-number">
            {assignedPatients.reduce((sum, p) => sum + getDoctorPatientForms(p.id).length, 0)}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Completed</span>
          <span className="stat-number" style={{ color: '#10b981' }}>
            {assignedPatients.filter(p => getCompletionPercentage(p.id) === 100).length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">In Progress</span>
          <span className="stat-number" style={{ color: '#f59e0b' }}>
            {assignedPatients.filter(p => {
              const pct = getCompletionPercentage(p.id)
              return pct > 0 && pct < 100
            }).length}
          </span>
        </div>
      </div>

      {/* Patient Grid */}
      <div className="patients-container">
        {filteredPatients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No patients found</h3>
            <p>
              {searchTerm
                ? `No patients match "${searchTerm}"`
                : 'No patients assigned yet'}
            </p>
          </div>
        ) : (
          <div className="patients-grid">
            {filteredPatients.map((patient) => {
              const completionPercent = getCompletionPercentage(patient.id)
              const patientForms = getDoctorPatientForms(patient.id)
              const patientName = patient.name || 'Unnamed patient'

              return (
                <div key={patient.id} className="patient-card">
                  <div className="card-header">
                    <div className="avatar-section">
                      <div className="patient-avatar">
                        {patientName.charAt(0).toUpperCase()}
                      </div>
                      <div className="patient-basic-info">
                        <h3>{patientName}</h3>
                        <p className="patient-id">ID: {patient.id}</p>
                      </div>
                    </div>
                    <div className="completion-badge">
                      <div className="badge-circle">
                        <span className="badge-percent">{completionPercent}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="card-content">
                    {/* Patient Details */}
                    <div className="patient-details">
                      <div className="detail-row">
                        <span className="detail-label">Age:</span>
                        <span className="detail-value">{patient.age} years</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value detail-email">{patient.email}</span>
                      </div>
                    </div>

                    {/* Medical History Preview */}
                    <div className="medical-history-preview">
                      <span className="preview-label">📋 Medical History</span>
                      <p className="preview-text">
                        {getMedicalHistoryPreview(patient.medicalHistory)}
                      </p>
                    </div>

                    {/* Form Status Summary */}
                    <div className="form-status-summary">
                      <span className="summary-label">Forms: {patientForms.length}</span>
                      <div className="status-indicators">
                        {patientForms.length > 0 && (
                          <>
                            {patientForms.filter(f => f.status === 'completed').length > 0 && (
                              <div className="status-badge completed">
                                ✓ {patientForms.filter(f => f.status === 'completed').length}
                              </div>
                            )}
                            {patientForms.filter(f => f.status === 'in_progress').length > 0 && (
                              <div className="status-badge in-progress">
                                ◉ {patientForms.filter(f => f.status === 'in_progress').length}
                              </div>
                            )}
                            {patientForms.filter(f => f.status === 'pending').length > 0 && (
                              <div className="status-badge pending">
                                ⦿ {patientForms.filter(f => f.status === 'pending').length}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="progress-section">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${completionPercent}%` }}></div>
                      </div>
                      <span className="progress-text">Form completion: {completionPercent}%</span>
                    </div>
                  </div>

                  {/* Card Footer with Actions */}
                  <div className="card-footer">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedPatient(patient)}
                    >
                      👤 Manage Profile
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setConsultationPatient(patient)}
                    >
                      💬 View Consultations
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Patient Profile Detail Modal */}
      {selectedPatient && (
        <div className="modal-overlay" onClick={() => setSelectedPatient(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <PatientProfileDetail
              patient={selectedPatient}
              onClose={() => setSelectedPatient(null)}
              selectedDoctor={selectedDoctor}
            />
          </div>
        </div>
      )}

      {consultationPatient && (
        <div className="modal-overlay" onClick={() => setConsultationPatient(null)}>
          <div className="modal-content consultation-history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="consultation-history-header">
              <div>
                <h2>Consultation History</h2>
                <p>{consultationPatient.name}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setConsultationPatient(null)}>
                Close
              </Button>
            </div>

            {(() => {
              const doctorConsultations = getPatientConsultations(consultationPatient.id).filter(
                (c) => !c.doctorId || c.doctorId === selectedDoctor?.id
              )
              return doctorConsultations.length === 0 ? (
              <div className="empty-state">
                <h3>No consultations yet</h3>
                <p>Scheduled consultations for this patient will appear here.</p>
              </div>
            ) : (
              <div className="consultation-history-list">
                {doctorConsultations
                  .sort((a, b) => new Date(b.scheduledFor) - new Date(a.scheduledFor))
                  .map((consultation) => {
                    const doctor = getDoctorById(consultation.doctorId)
                    const scheduledDate = new Date(consultation.scheduledFor)

                    return (
                      <div key={consultation.id} className="consultation-history-item">
                        <div>
                          <h3>{consultation.title}</h3>
                          <p>{doctor ? doctor.name : 'Doctor not found'}</p>
                          <small>
                            {scheduledDate.toLocaleDateString()} at{' '}
                            {scheduledDate.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </small>
                        </div>
                        <span className={`status-badge ${consultation.status}`}>
                          {consultation.status}
                        </span>
                      </div>
                    )
                  })}
              </div>
            )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
