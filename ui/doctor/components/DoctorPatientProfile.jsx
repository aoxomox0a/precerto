import React, { useState, useEffect } from 'react'
import { useHealthcare } from '../../src/context/HealthcareContext'
import './DoctorPatientProfile.css'

export default function DoctorPatientProfile({ doctorId, patientId, onBack, onAssignForm }) {
  const { patients, getDoctorPatientAssignments, createFormAssignment, formTemplates } = useHealthcare()
  const [patient, setPatient] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedFormId, setSelectedFormId] = useState('')
  const [selectedDueDate, setSelectedDueDate] = useState('')

  useEffect(() => {
    const foundPatient = patients.find(p => p.id === patientId)
    setPatient(foundPatient)

    const patientAssignments = getDoctorPatientAssignments(doctorId, patientId)
    setAssignments(patientAssignments)
  }, [patientId, doctorId, patients, getDoctorPatientAssignments])

  const handleAssignForm = () => {
    if (selectedFormId && selectedDueDate) {
      createFormAssignment(patientId, doctorId, selectedFormId, selectedDueDate)
      setShowAssignModal(false)
      setSelectedFormId('')
      setSelectedDueDate('')
      // Refresh assignments
      const updatedAssignments = getDoctorPatientAssignments(doctorId, patientId)
      setAssignments(updatedAssignments)
    }
  }

  if (!patient) return <div className="text-center p-8">Patient not found</div>

  const completedForms = assignments.filter(a => a.completed).length
  const pendingForms = assignments.length - completedForms
  const availableFormTemplates = formTemplates.filter(
    ft => !assignments.some(a => a.formId === ft.id)
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-6 text-blue-600 hover:text-blue-800 font-bold text-lg"
        >
          ← Back to Patients
        </button>

        {/* Patient Header Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border-l-4 border-blue-600">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Patient Info */}
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">{patient.name}</h1>
              <p className="text-gray-600 text-lg mb-6">Patient ID: {patient.id}</p>

              {/* Health Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                  <p className="text-gray-600 text-xs font-semibold">BMI</p>
                  <p className="text-2xl font-bold text-blue-700">{patient.bmi}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-600">
                  <p className="text-gray-600 text-xs font-semibold">Weight</p>
                  <p className="text-2xl font-bold text-purple-700">{patient.weight} kg</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-600">
                  <p className="text-gray-600 text-xs font-semibold">Age</p>
                  <p className="text-2xl font-bold text-green-700">{patient.age}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-600">
                  <p className="text-gray-600 text-xs font-semibold">Height</p>
                  <p className="text-2xl font-bold text-orange-700">{patient.height} cm</p>
                </div>
              </div>
            </div>

            {/* Right: Goals & History */}
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Current Health Goal</h3>
                <p className="text-gray-700 leading-relaxed">{patient.currentGoal}</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Medical History</h3>
                <p className="text-gray-700 text-sm leading-relaxed">{patient.medicalHistory}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Forms Assignment Section */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left: Stats */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Form Status</h2>

            <div className="space-y-4 mb-8">
              <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-600">
                <p className="text-gray-600 text-sm">Completed</p>
                <p className="text-3xl font-bold text-green-700">{completedForms}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-600">
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-3xl font-bold text-orange-700">{pendingForms}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                <p className="text-gray-600 text-sm">Total</p>
                <p className="text-3xl font-bold text-blue-700">{assignments.length}</p>
              </div>
            </div>

            <button
              onClick={() => setShowAssignModal(true)}
              disabled={availableFormTemplates.length === 0}
              className={`w-full py-3 rounded-lg font-bold transition ${
                availableFormTemplates.length === 0
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {availableFormTemplates.length === 0 ? 'All Forms Assigned' : '➕ Assign New Form'}
            </button>
          </div>

          {/* Right: Form History */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Form History</h2>

            {assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.map(assignment => (
                  <div key={assignment.id} className="border-l-4 border-blue-600 bg-blue-50 p-4 rounded-lg hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-800">{assignment.formTitle}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        assignment.completed
                          ? 'bg-green-200 text-green-800'
                          : 'bg-orange-200 text-orange-800'
                      }`}>
                        {assignment.completed ? '✓ Completed' : '⏳ Pending'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{assignment.formDescription}</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Assigned: {assignment.assignedDate}</span>
                      <span>Due: <strong>{assignment.dueDate}</strong></span>
                    </div>
                    {assignment.completed && assignment.completedDate && (
                      <div className="mt-2 text-xs text-green-600 font-semibold">
                        Completed: {assignment.completedDate}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 text-lg mb-2">📋 No forms assigned yet</p>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Assign the first form
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Assign Form Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Assign New Form</h3>

              <div className="space-y-4 mb-6">
                {/* Form Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Form
                  </label>
                  <select
                    value={selectedFormId}
                    onChange={(e) => setSelectedFormId(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Choose a form...</option>
                    {availableFormTemplates.map(form => (
                      <option key={form.id} value={form.id}>
                        {form.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={selectedDueDate}
                    onChange={(e) => setSelectedDueDate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-3 rounded-lg font-bold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignForm}
                  disabled={!selectedFormId || !selectedDueDate}
                  className={`flex-1 px-4 py-3 rounded-lg font-bold transition ${
                    !selectedFormId || !selectedDueDate
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Assign Form
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
