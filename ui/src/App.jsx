import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import RoleSelector from './components/RoleSelector'
import DoctorDashboard from './components/DoctorDashboard'
import PatientForm from './components/PatientForm'
import HealthcareRoleSelector from './healthcare/HealthcareRoleSelector'
import { HealthcareProvider } from './context/HealthcareContext'
import { AppProvider } from './store/AppProvider'
import PatientHub from '../patient/pages/patient/PatientHub'
import DoctorHub from '../doctor/pages/pages/DoctorHub'
import { ConsultationResults } from '../doctor/pages/pages/ConsultationResults'
import './App.css'

export default function App() {
  return (
    <Router>
      <AppProvider>
        <Routes>
          {/* Original Precerto UI Routes */}
          <Route path="/" element={<RoleSelector />} />
          <Route path="/doctor-legacy" element={<DoctorDashboard />} />
          <Route path="/patient-legacy" element={<PatientForm />} />

          {/* New Clinical Management System Routes */}
          <Route path="/patient" element={<PatientHub />} />
          <Route path="/doctor" element={<DoctorHub />} />
          <Route path="/doctor/consultations/:consultationId/results" element={<ConsultationResults />} />

          {/* Healthcare App Routes */}
          <Route
            path="/healthcare/*"
            element={
              <HealthcareProvider>
                <HealthcareRoleSelector />
              </HealthcareProvider>
            }
          />
        </Routes>
      </AppProvider>
    </Router>
  )
}
