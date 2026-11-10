import React from 'react'
import './ConsultationStatus.css'

/**
 * ConsultationStatus Component
 * 
 * Displays the current consultation status in the patient UI
 * Shows whether consultation is completed, in progress, or pending
 */
export default function ConsultationStatus({
  status = 'pending', // 'pending', 'in-progress', 'completed', 'skipped'
  doctorName,
  completedDate,
  recordingIncluded = true
}) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return '✓'
      case 'in-progress':
        return '●'
      case 'skipped':
        return '⊘'
      case 'pending':
      default:
        return '◯'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'completed'
      case 'in-progress':
        return 'in-progress'
      case 'skipped':
        return 'skipped'
      case 'pending':
      default:
        return 'pending'
    }
  }

  const getStatusLabel = () => {
    switch (status) {
      case 'completed':
        return 'Consultation Completed'
      case 'in-progress':
        return 'Consultation In Progress'
      case 'skipped':
        return 'Consultation Completed (No Recording)'
      case 'pending':
      default:
        return 'Pending Consultation'
    }
  }

  const getStatusDescription = () => {
    switch (status) {
      case 'completed':
        return 'Your consultation has been recorded and processed by the doctor.'
      case 'in-progress':
        return 'Your consultation is currently being recorded.'
      case 'skipped':
        return 'Your consultation was completed without audio recording as requested.'
      case 'pending':
      default:
        return 'Awaiting consultation with your care team.'
    }
  }

  return (
    <div className="consultation-status-card" data-status={getStatusColor()}>
      <div className="status-header">
        <div className="status-icon">{getStatusIcon()}</div>
        <div className="status-text">
          <h3>{getStatusLabel()}</h3>
          <p className="status-description">{getStatusDescription()}</p>
        </div>
      </div>

      <div className="status-details">
        {doctorName && (
          <div className="detail-item">
            <span className="detail-label">Doctor:</span>
            <span className="detail-value">{doctorName}</span>
          </div>
        )}

        {completedDate && (
          <div className="detail-item">
            <span className="detail-label">Completed:</span>
            <span className="detail-value">
              {new Date(completedDate).toLocaleDateString()} {new Date(completedDate).toLocaleTimeString()}
            </span>
          </div>
        )}

        {status === 'completed' && (
          <div className="detail-item">
            <span className="detail-label">Recording:</span>
            <span className="detail-value">
              {recordingIncluded ? '🎙️ Audio Recorded' : '⊘ No Recording'}
            </span>
          </div>
        )}

        {status === 'skipped' && (
          <div className="detail-item info-item">
            <span className="info-icon">ℹ️</span>
            <p>
              As requested, your consultation was not recorded. The doctor has noted your privacy preference
              and will maintain all clinical information in your medical record.
            </p>
          </div>
        )}
      </div>

      {status === 'completed' || status === 'skipped' ? (
        <div className="status-badge success">
          <span className="badge-icon">✓</span>
          <span>Consultation Process Complete</span>
        </div>
      ) : status === 'in-progress' ? (
        <div className="status-badge info">
          <span className="badge-icon pulse">●</span>
          <span>Ongoing</span>
        </div>
      ) : (
        <div className="status-badge pending">
          <span className="badge-icon">●</span>
          <span>Awaiting Doctor</span>
        </div>
      )}
    </div>
  )
}
