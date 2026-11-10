import React, { useEffect, useState } from 'react'
import { useHealthcare } from '../../src/context/HealthcareContext'
import './DoctorPatientList.css'

export default function DoctorPatientList({ doctorId, onSelectPatient }) {
  const { getDoctorData } = useHealthcare()
  const { patients } = getDoctorData(doctorId)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')

  const filteredPatients = patients
    .filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'bmi') return b.bmi - a.bmi
      if (sortBy === 'joined') return new Date(b.joinDate) - new Date(a.joinDate)
      return 0
    })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">👨‍⚕️ My Patients</h1>
          <p className="text-gray-600 text-lg">View and manage your assigned patients</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search Patients</label>
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="name">Name (A-Z)</option>
                <option value="bmi">BMI (High to Low)</option>
                <option value="joined">Recently Joined</option>
              </select>
            </div>
          </div>
        </div>

        {/* Patients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.length > 0 ? (
            filteredPatients.map(patient => (
              <div key={patient.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition transform hover:scale-105">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                  <h3 className="text-xl font-bold mb-1">{patient.name}</h3>
                  <p className="text-sm text-blue-100">ID: {patient.id}</p>
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-4">
                  {/* Health Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 font-semibold">BMI</p>
                      <p className="text-2xl font-bold text-blue-600">{patient.bmi}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 font-semibold">Weight</p>
                      <p className="text-2xl font-bold text-purple-600">{patient.weight} kg</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 font-semibold">Age</p>
                      <p className="text-2xl font-bold text-green-600">{patient.age}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 font-semibold">Height</p>
                      <p className="text-2xl font-bold text-orange-600">{patient.height} cm</p>
                    </div>
                  </div>

                  {/* Current Goal */}
                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-600 font-semibold mb-2">Current Goal</p>
                    <p className="text-sm text-gray-800">{patient.currentGoal}</p>
                  </div>

                  {/* Joined Date */}
                  <div className="text-xs text-gray-500">
                    Joined: {patient.joinDate}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => onSelectPatient(patient.id)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-lg font-bold transition transform hover:shadow-lg"
                  >
                    View Profile & Forms
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-2xl text-gray-600 mb-2">🔍 No patients found</p>
              <p className="text-gray-500">Try adjusting your search filters</p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8 text-center">
          <p className="text-gray-700 text-lg">
            Showing <strong>{filteredPatients.length}</strong> of <strong>{patients.length}</strong> patients
          </p>
        </div>
      </div>
    </div>
  )
}
