import React, { useState } from 'react'
import PatientDashboard from '../../patient/components/PatientDashboard'
import DoctorDashboard from '../../doctor/components/DoctorDashboard'
import './HealthcareRoleSelector.css'

export default function HealthcareRoleSelector() {
  const [selectedRole, setSelectedRole] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)

  // Mock users for demo
  const mockDoctors = [
    { id: 'doc1', name: 'Sarah Mitchell', specialty: 'Bariatric Medicine' },
    { id: 'doc2', name: 'James Chen', specialty: 'Nutritionist' },
    { id: 'doc3', name: 'Emily Davis', specialty: 'Behavioral Health' }
  ]

  const mockPatients = [
    { id: 'pat1', name: 'John Smith' },
    { id: 'pat2', name: 'Lisa Johnson' },
    { id: 'pat3', name: 'Michael Brown' }
  ]

  // Reset to menu
  const handleBackToMenu = () => {
    setSelectedRole(null)
    setSelectedUser(null)
  }

  if (selectedRole === 'doctor' && selectedUser) {
    const doctor = mockDoctors.find(d => d.id === selectedUser)
    return (
      <div>
        <button
          onClick={handleBackToMenu}
          className="fixed top-6 left-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold z-50"
        >
          ← Back to Home
        </button>
        <DoctorDashboard doctorId={selectedUser} doctorName={doctor?.name.split(' ')[0]} />
      </div>
    )
  }

  if (selectedRole === 'patient' && selectedUser) {
    return (
      <div>
        <button
          onClick={handleBackToMenu}
          className="fixed top-6 left-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold z-50"
        >
          ← Back to Home
        </button>
        <PatientDashboard patientId={selectedUser} />
      </div>
    )
  }

  // Selection Menu
  if (selectedRole && !selectedUser) {
    const users = selectedRole === 'doctor' ? mockDoctors : mockPatients
    const isDoctor = selectedRole === 'doctor'

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => setSelectedRole(null)}
            className="mb-8 text-blue-600 hover:text-blue-800 font-bold text-lg"
          >
            ← Back to Role Selection
          </button>

          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              {isDoctor ? '👨‍⚕️ Select Your Doctor Account' : '👤 Select Your Patient Account'}
            </h1>
            <p className="text-gray-600 text-lg">
              {isDoctor
                ? 'Choose which doctor account to access'
                : 'Choose which patient account to access'}
            </p>
          </div>

          {/* User Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user.id)}
                className="group bg-white rounded-lg shadow-lg p-8 hover:shadow-xl hover:scale-105 transition transform cursor-pointer text-left"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition">
                  {isDoctor ? '👨‍⚕️' : '👤'}
                </div>
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition">
                  {user.name}
                </h3>
                {isDoctor && (
                  <p className="text-sm text-gray-600 mt-2">{user.specialty}</p>
                )}
                <p className="text-xs text-gray-500 mt-4">Click to access</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Role Selection
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-12 text-center">
            <h1 className="text-5xl font-bold mb-4">🏥 Healthcare System</h1>
            <p className="text-blue-100 text-lg">Obesity Patient Management Portal</p>
          </div>

          {/* Content */}
          <div className="p-12">
            <p className="text-gray-700 text-center mb-12 text-lg">
              Select your role to access the healthcare platform
            </p>

            {/* Role Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Patient Option */}
              <button
                onClick={() => setSelectedRole('patient')}
                className="group bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-8 hover:shadow-lg transition transform hover:scale-105 cursor-pointer"
              >
                <div className="text-6xl mb-4 group-hover:scale-110 transition">👤</div>
                <h3 className="text-2xl font-bold text-blue-900 mb-3">Patient</h3>
                <p className="text-gray-700">Fill health forms, track progress, view care team</p>
                <div className="mt-6 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold group-hover:bg-blue-700 transition">
                  Enter as Patient
                </div>
              </button>

              {/* Doctor Option */}
              <button
                onClick={() => setSelectedRole('doctor')}
                className="group bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg p-8 hover:shadow-lg transition transform hover:scale-105 cursor-pointer"
              >
                <div className="text-6xl mb-4 group-hover:scale-110 transition">👨‍⚕️</div>
                <h3 className="text-2xl font-bold text-purple-900 mb-3">Doctor</h3>
                <p className="text-gray-700">Manage patients, assign forms, track progress</p>
                <div className="mt-6 inline-block bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold group-hover:bg-purple-700 transition">
                  Enter as Doctor
                </div>
              </button>
            </div>

            {/* Footer Info */}
            <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-center text-sm text-gray-600">
                <strong>Demo Mode:</strong> This is a prototype with mock data. Select any role to explore the interface.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
