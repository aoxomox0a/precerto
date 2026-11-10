import React, { useState } from 'react'
import { useHealthcare } from '../../src/context/HealthcareContext'
import PatientFormFiller from './PatientFormFiller'
import ConsultationStatus from '../../src/components/ConsultationStatus'
import './PatientDashboard.css'

export default function PatientDashboard({ patientId, onNavigate }) {
  const { getPatientData } = useHealthcare()
  const { patient, forms, assignedDoctors } = getPatientData(patientId)
  const [fillingFormId, setFillingFormId] = useState(null)

  if (!patient) return <div className="text-center p-8">Patient not found</div>

  // Handle form filling
  if (fillingFormId) {
    const form = forms.find(f => f.id === fillingFormId)
    return (
      <PatientFormFiller
        patientId={patientId}
        assignmentId={fillingFormId}
        onBack={() => setFillingFormId(null)}
        onSubmit={() => setFillingFormId(null)}
      />
    )
  }

  const completedForms = forms.filter(f => f.status === 'completed').length
  const pendingForms = forms.filter(f => f.status === 'not-completed').length
  const overdueForms = forms.filter(f => {
    const dueDate = new Date(f.dueDate)
    return f.status === 'not-completed' && dueDate < new Date()
  }).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="text-6xl">{patient.profileImage}</div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800">{patient.name}</h1>
              <p className="text-gray-600 text-lg">Patient ID: {patientId}</p>
            </div>
          </div>

          {/* Health Metrics cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
              <p className="text-gray-600 text-sm font-semibold">WEIGHT</p>
              <p className="text-2xl font-bold text-blue-600">{patient.weight} lbs</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
              <p className="text-gray-600 text-sm font-semibold">BMI</p>
              <p className="text-2xl font-bold text-green-600">{patient.bmi}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
              <p className="text-gray-600 text-sm font-semibold">HEIGHT</p>
              <p className="text-2xl font-bold text-purple-600">{patient.height}"</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
              <p className="text-gray-600 text-sm font-semibold">AGE</p>
              <p className="text-2xl font-bold text-orange-600">{patient.age}</p>
            </div>
          </div>
        </div>

        {/* Consultation Status */}
        <div className="mb-8">
          <ConsultationStatus
            status="completed"
            doctorName="Dr. Sarah Johnson"
            completedDate={new Date()}
            recordingIncluded={true}
          />
        </div>

        {/* Main content grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left: Health Stats */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Current Health Goal</h2>
              <p className="text-gray-700 leading-relaxed">{patient.currentGoal}</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Medical History</h2>
              <p className="text-gray-700 text-sm">{patient.medicalHistory}</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Form Status</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Completed</span>
                  <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full font-semibold">{completedForms}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Pending</span>
                  <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full font-semibold">{pendingForms}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Overdue</span>
                  <span className="bg-red-200 text-red-800 px-3 py-1 rounded-full font-semibold">{overdueForms}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Doctors and Forms */}
          <div className="md:col-span-2">
            {/* Assigned Doctors */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">My Care Team</h2>
              <div className="grid gap-4">
                {assignedDoctors.length > 0 ? (
                  assignedDoctors.map(doctor => (
                    <div key={doctor.id} className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 transition">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{doctor.avatar}</span>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800">{doctor.name}</h3>
                          <p className="text-sm text-gray-600">{doctor.specialty}</p>
                          <p className="text-xs text-gray-500 mt-1">{doctor.email}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No doctors assigned yet</p>
                )}
              </div>
            </div>

            {/* Forms Overview */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">My Forms</h2>
                <button
                  onClick={() => onNavigate('formList')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  View All Forms
                </button>
              </div>
              
              <div className="grid gap-4">
                {forms.length > 0 ? (
                  forms.slice(0, 3).map(form => (
                    <div key={form.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-800">{form.formTitle}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          form.status === 'completed'
                            ? 'bg-green-200 text-green-800'
                            : 'bg-yellow-200 text-yellow-800'
                        }`}>
                          {form.status === 'completed' ? '✓ Completed' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{form.formDescription}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                        <span>Assigned: {form.assignedDate}</span>
                        <span>Due: <strong>{form.dueDate}</strong></span>
                      </div>
                      {form.status === 'not-completed' && (
                        <button
                          onClick={() => setFillingFormId(form.id)}
                          className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold py-2 rounded-lg transition"
                        >
                          Fill Form
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No forms assigned yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
