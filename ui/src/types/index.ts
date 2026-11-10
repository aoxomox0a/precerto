// Common Types
export interface User {
  id: string
  name: string
  email: string
  role: 'patient' | 'doctor'
  avatar?: string
}

export interface Patient extends User {
  age: number
  medicalHistory: string[]
  assignedDoctorIds: string[]
}

export interface Doctor extends User {
  specialty: string
  licenseNumber: string
  patientIds: string[]
}

// Form Types
export type FormCategory = 'symptoms' | 'lifestyle' | 'medical_history' | 'medications' | 'allergies'

export interface FormQuestion {
  id: string
  text: string
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'number' | 'date'
  category: FormCategory
  options?: string[]
  required: boolean
  placeholder?: string
}

export interface Form {
  id: string
  title: string
  description: string
  createdBy: string // Doctor ID
  questions: FormQuestion[]
  isCustom: boolean
  createdAt: Date
}

export interface PatientFormResponse {
  id: string
  formId: string
  patientId: string
  doctorId: string
  responses: Record<string, any>
  completedAt?: Date
  status: 'pending' | 'in_progress' | 'completed'
  progressPercentage: number
}

export interface Subscription {
  formResponseId: string
  patientId: string
  doctorId: string
  assignedAt: Date
  dueDate?: Date
  status: 'pending' | 'in_progress' | 'completed'
}

export interface Consultation {
  id: string
  patientId: string
  doctorId: string
  scheduledFor: Date
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  recordingUrl?: string
  notes?: string
  diagnosis?: string
  recommendedActions?: string[]
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  read: boolean
  createdAt: Date
  actionUrl?: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
