import React from 'react'
import { Doctor } from '../../types'
import { Card, Badge, Button } from '../shared'
import './patient.css'

interface DoctorCardProps {
  doctor: Doctor
  onViewDetails?: () => void
  pendingForms?: number
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onViewDetails,
  pendingForms = 0,
}) => {
  return (
    <Card hoverable className="doctor-card" onClick={onViewDetails}>
      <div className="doctor-card-header">
        <div className="doctor-avatar">
          {doctor.avatar ? (
            <img src={doctor.avatar} alt={doctor.name} />
          ) : (
            <div className="avatar-placeholder">
              {doctor.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
          )}
        </div>
        <div className="doctor-info">
          <h3>{doctor.name}</h3>
          <p className="doctor-specialty">{doctor.specialty}</p>
        </div>
      </div>

      {pendingForms > 0 && (
        <div className="doctor-status">
          <Badge variant="warning">{pendingForms} Pending Forms</Badge>
        </div>
      )}

      <p className="doctor-contact">
        <small>📧 {doctor.email}</small>
      </p>

      {onViewDetails && (
        <Button variant="primary" size="sm" fullWidth onClick={onViewDetails}>
          View Details
        </Button>
      )}
    </Card>
  )
}

interface FormItemProps {
  title: string
  status: 'pending' | 'in_progress' | 'completed'
  progressPercentage: number
  doctorName?: string
  dueDate?: Date
  onClick?: () => void
}

export const FormItem: React.FC<FormItemProps> = ({
  title,
  status,
  progressPercentage,
  doctorName,
  dueDate,
  onClick,
}) => {
  const getStatusBadge = () => {
    const badgeMap = {
      pending: 'warning',
      in_progress: 'info',
      completed: 'success',
    }
    return badgeMap[status] as 'warning' | 'info' | 'success'
  }

  const getStatusLabel = () => {
    const labelMap = {
      pending: 'Not Started',
      in_progress: 'In Progress',
      completed: 'Completed',
    }
    return labelMap[status]
  }

  return (
    <Card
      hoverable
      className={`form-item form-item-${status}`}
      onClick={onClick}
    >
      <div className="form-item-header">
        <h4>{title}</h4>
        <Badge variant={getStatusBadge()}>{getStatusLabel()}</Badge>
      </div>

      {doctorName && <p className="form-doctor">From: {doctorName}</p>}

      <div className="form-progress">
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <span className="progress-text">{progressPercentage}% Complete</span>
      </div>

      {dueDate && (
        <p className="form-due-date">
          Due: {dueDate.toLocaleDateString()}
        </p>
      )}
    </Card>
  )
}

interface NotificationProps {
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  onDismiss?: () => void
}

export const NotificationBanner: React.FC<NotificationProps> = ({
  title,
  message,
  type,
  onDismiss,
}) => {
  const iconMap = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    success: '✅',
  }

  return (
    <div className={`notification notification-${type}`}>
      <div className="notification-icon">{iconMap[type]}</div>
      <div className="notification-content">
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      {onDismiss && (
        <button className="notification-close" onClick={onDismiss}>
          ✕
        </button>
      )}
    </div>
  )
}
