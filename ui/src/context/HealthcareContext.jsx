import React, { createContext, useState, useCallback } from 'react'
import {
  mockDoctors,
  mockPatients,
  mockFormTemplates,
  mockFormAssignments,
  getPatientForms,
  getDoctorPatients,
  getDoctorPatientAssignments
} from '../utils/healthcareMockData'

export const HealthcareContext = createContext()

export function HealthcareProvider({ children }) {
  const [doctors] = useState(mockDoctors)
  const [patients] = useState(mockPatients)
  const [formTemplates] = useState(mockFormTemplates)
  const [formAssignments, setFormAssignments] = useState(mockFormAssignments)
  const [currentUser, setCurrentUser] = useState(null) // { type: 'patient' | 'doctor', id }
  const [consultationState, setConsultationState] = useState({
    isRecording: false,
    timer: 0,
    feedback: []
  })

  // Patient actions
  const submitForm = useCallback((assignmentId, responses) => {
    setFormAssignments(prev => prev.map(assignment => 
      assignment.id === assignmentId 
        ? {
            ...assignment,
            status: 'completed',
            responses,
            completedDate: new Date().toISOString().split('T')[0]
          }
        : assignment
    ))
  }, [])

  const getPatientData = useCallback((patientId) => {
    const patient = patients.find(p => p.id === patientId)
    const forms = getPatientForms(patientId)
    const assignedDoctors = patient?.doctors.map(docId => 
      doctors.find(d => d.id === docId)
    ).filter(Boolean) || []
    
    return { patient, forms, assignedDoctors }
  }, [patients, doctors])

  // Doctor actions
  const getDoctorData = useCallback((doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId)
    const patients_ = getDoctorPatients(doctorId)
    
    return { doctor, patients: patients_ }
  }, [doctors])

  const getPatientProfile = useCallback((doctorId, patientId) => {
    const patient = patients.find(p => p.id === patientId)
    const assignments = getDoctorPatientAssignments(doctorId, patientId)
    const formHistory = assignments.map(assignment => {
      const form = formTemplates.find(f => f.id === assignment.formId)
      return {
        ...assignment,
        formTitle: form?.title,
        formDescription: form?.description
      }
    })
    
    return { patient, formHistory }
  }, [patients, formTemplates])

  const createFormAssignment = useCallback((patientId, doctorId, formId, dueDate) => {
    const newAssignment = {
      id: `assign-${Date.now()}`,
      patientId,
      doctorId,
      formId,
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate,
      completed: false,
      responses: null
    }
    
    setFormAssignments(prev => [...prev, newAssignment])
    return newAssignment
  }, [])

  const getDoctorPatientAssignments = useCallback((doctorId, patientId) => {
    return formAssignments
      .filter(a => a.doctorId === doctorId && a.patientId === patientId)
      .map(a => {
        const form = formTemplates.find(f => f.id === a.formId)
        return {
          ...a,
          formTitle: form?.title,
          formDescription: form?.description
        }
      })
  }, [formAssignments, formTemplates])

  // Consultation mode
  const startConsultation = useCallback(() => {
    setConsultationState({
      isRecording: true,
      timer: 0,
      feedback: ['System ready for consultation', 'Awaiting patient input...']
    })

    // Simulate timer
    const interval = setInterval(() => {
      setConsultationState(prev => ({
        ...prev,
        timer: prev.timer + 1
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const stopConsultation = useCallback(() => {
    setConsultationState({
      isRecording: false,
      timer: 0,
      feedback: []
    })
  }, [])

  const addConsultationFeedback = useCallback((message) => {
    setConsultationState(prev => ({
      ...prev,
      feedback: [...prev.feedback, message]
    }))
  }, [])

  const value = {
    // Data
    doctors,
    patients,
    formTemplates,
    formAssignments,
    currentUser,
    consultationState,

    // Auth
    setCurrentUser,

    // Patient actions
    submitForm,
    getPatientData,

    // Doctor actions
    getDoctorData,
    getPatientProfile,
    createFormAssignment,
    getDoctorPatientAssignments,

    // Consultation
    startConsultation,
    stopConsultation,
    addConsultationFeedback
  }

  return (
    <HealthcareContext.Provider value={value}>
      {children}
    </HealthcareContext.Provider>
  )
}

export function useHealthcare() {
  const context = React.useContext(HealthcareContext)
  if (!context) {
    throw new Error('useHealthcare must be used within HealthcareProvider')
  }
  return context
}
