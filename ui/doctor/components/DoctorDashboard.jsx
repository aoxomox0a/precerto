import React, { useState } from 'react'
import DoctorPatientList from './DoctorPatientList'
import DoctorPatientProfile from './DoctorPatientProfile'
import './DoctorDashboard.css'

export default function DoctorDashboard({ doctorId, doctorName }) {
  const [currentView, setCurrentView] = useState('patientList')
  const [selectedPatientId, setSelectedPatientId] = useState(null)

  const handleSelectPatient = (patientId) => {
    setSelectedPatientId(patientId)
    setCurrentView('patientProfile')
  }

  const handleBackToList = () => {
    setCurrentView('patientList')
    setSelectedPatientId(null)
  }

  return (
    <div>
      {currentView === 'patientList' ? (
        <div>
          {/* Doctor Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 mb-8">
            <h1 className="text-3xl font-bold">Welcome, Dr. {doctorName}</h1>
            <p className="text-blue-100 mt-2">Manage your patients and their health forms</p>
          </div>
          <DoctorPatientList
            doctorId={doctorId}
            onSelectPatient={handleSelectPatient}
          />
        </div>
      ) : currentView === 'patientProfile' ? (
        <DoctorPatientProfile
          doctorId={doctorId}
          patientId={selectedPatientId}
          onBack={handleBackToList}
        />
      ) : null}
    </div>
  )
}
