import React, { useState } from 'react'
import { useAppContext } from '../../../src/store/AppProvider'
import { Button } from '../../../src/components/shared'
import './doctor-pages.css'

export const DoctorPatientManagement = ({ selectedDoctor }) => {
  const { patients, getDoctorPatients, addPatient, deletePatient } = useAppContext()
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    medicalHistory: '',
  })

  const doctorPatients = getDoctorPatients(selectedDoctor.id)

  const handleAddPatient = () => {
    if (formData.name && formData.age && formData.email) {
      const newPatient = {
        id: `pat-${Date.now()}`,
        name: formData.name,
        age: Number(formData.age),
        email: formData.email,
        medicalHistory: formData.medicalHistory ? formData.medicalHistory.split(',').map((h) => h.trim()) : [],
        assignedDoctorIds: [selectedDoctor.id],
        avatar: `https://via.placeholder.com/120?text=${formData.name.split(' ').map((n) => n[0]).join('')}`,
      }
      addPatient(newPatient)
      setFormData({ name: '', age: '', email: '', medicalHistory: '' })
      setShowAddForm(false)
    }
  }

  return (
    <div className="doctor-patient-management">
      <div className="section-header">
        <h2>👥 Patient Management</h2>
        <Button variant="primary" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : '+ Add Patient'}
        </Button>
      </div>

      {showAddForm && (
        <div className="form-container">
          <input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <input
            type="number"
            placeholder="Age"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            type="text"
            placeholder="Medical history (comma-separated)"
            value={formData.medicalHistory}
            onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
          />
          <Button variant="success" onClick={handleAddPatient}>
            Add Patient
          </Button>
        </div>
      )}

      <div className="patients-list">
        {doctorPatients.length === 0 ? (
          <p className="empty-state">No patients assigned</p>
        ) : (
          doctorPatients.map((patient) => (
            <div key={patient.id} className="patient-item">
              <div className="patient-info">
                <h4>{patient.name}</h4>
                <p>Age: {patient.age} | {patient.email}</p>
                {patient.medicalHistory.length > 0 && (
                  <p className="history">History: {patient.medicalHistory.join(', ')}</p>
                )}
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => deletePatient(patient.id)}
              >
                Remove
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
