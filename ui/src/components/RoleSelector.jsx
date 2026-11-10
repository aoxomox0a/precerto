import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../store/AppProvider'
import landingFlower from '../assets/wellness-plant-progress.png'
import appLogo from '../assets/app-logo.png'
import './RoleSelector.css'

export default function RoleSelector() {
  const navigate = useNavigate()
  const { patients, selectedPatientId, setSelectedPatientId } = useAppContext()
  const selectedPatient =
    patients.find((patient) => patient.id === selectedPatientId) || patients[0]

  const enterPatientPortal = () => {
    if (selectedPatient) {
      setSelectedPatientId(selectedPatient.id)
    }
    navigate('/patient')
  }

  return (
    <div className="role-selector-container">
      <header className="landing-header" aria-label="Precerto clinical system">
        <div className="landing-brand">
          <div className="brand-mark" aria-hidden="true">
            <img src={appLogo} alt="Precerto logo" className="brand-logo-img" />
          </div>
          <div className="brand-copy">
            <strong>Precerto</strong>
            <span>Clinical System</span>
          </div>
        </div>

        <div className="secure-access">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 10V8a4 4 0 0 1 8 0v2" />
            <rect x="6" y="10" width="12" height="10" rx="2" />
          </svg>
          <span>Secure clinical access</span>
        </div>
      </header>

      <main className="role-selector-content">
        <section className="portal-selection" aria-labelledby="portal-heading">
          <div className="portal-heading">
            <h1 id="portal-heading">Select your portal</h1>
            <p>Choose how you would like to continue</p>
          </div>

          <div className="role-buttons" aria-label="Portal options">
            <button className="role-btn doctor-btn" onClick={() => navigate('/doctor')}>
              <span className="role-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M7.35 4.25v4.05c0 2.72 2.03 4.78 4.65 4.78s4.65-2.06 4.65-4.78V4.25" />
                  <path d="M9.9 4.25v4.03c0 1.28.83 2.18 2.1 2.18s2.1-.9 2.1-2.18V4.25" />
                  <path d="M12 13.08v2.08a4.34 4.34 0 0 0 4.34 4.34h.58" />
                  <circle cx="18.9" cy="18.84" r="1.72" />
                  <path d="M18.9 17.58v2.52" />
                </svg>
              </span>
              <span className="role-title">Doctor Portal</span>
              <span className="role-subtitle">Clinical Workspace</span>
              <span className="role-divider" aria-hidden="true" />
              <span className="feature-row">
                <span className="feature-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M6 18.5V9.5M12 18.5V5.5M18 18.5v-7" /><path d="M4.8 18.5h14.4" /></svg>
                </span>
                <span>Access secure patient records and clinical tools</span>
              </span>
              <span className="feature-row">
                <span className="feature-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M8 4.5h8l2 2v13H6v-15h2Z" /><path d="M16 4.5v3h3M9 11h6M9 15h4" /></svg>
                </span>
                <span>AI-assisted clinical decision support</span>
              </span>
              <span className="feature-row">
                <span className="feature-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M7 5.5h10v13H7z" /><path d="M9.5 5.5V4h5v1.5M10 10h4M10 14h4" /></svg>
                </span>
                <span>Manage cases and care workflows</span>
              </span>
              <span className="role-cta">Enter Doctor Portal</span>
            </button>

            <div className="role-btn patient-btn patient-portal-card">
              <span className="role-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M11.1 10.35a2.78 2.78 0 1 0 0-5.56 2.78 2.78 0 0 0 0 5.56Z" />
                  <path d="M5.85 18.95c.48-2.8 2.55-4.58 5.25-4.58 1.06 0 2.02.27 2.82.76" />
                  <path d="M17.25 13.28 20 14.32v1.95c0 1.9-1.08 3.35-2.75 4.1-1.67-.75-2.75-2.2-2.75-4.1v-1.95l2.75-1.04Z" />
                  <path d="M16.02 16.72h2.46M17.25 15.5v2.46" />
                </svg>
              </span>
              <span className="role-title">Patient Portal</span>
              <span className="role-subtitle">Your Health Hub</span>
              <span className="role-divider" aria-hidden="true" />
              <span className="feature-row">
                <span className="feature-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M8 4.5h8v15H8z" /><path d="M10.2 8.5h3.6M10.2 12h3.6M10.2 15.5h2.6" /></svg>
                </span>
                <span>Complete guided forms shared by your doctor</span>
              </span>
              <span className="feature-row">
                <span className="feature-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><rect x="5.5" y="5.5" width="13" height="13" rx="2" /><path d="M8.5 4v3M15.5 4v3M5.5 10h13" /></svg>
                </span>
                <span>View appointments and care instructions</span>
              </span>
              <span className="feature-row">
                <span className="feature-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M5.5 7h13v8.5H9.2l-3.7 3.4z" /><path d="M9 11h6" /></svg>
                </span>
                <span>Message your care team securely</span>
              </span>
              <label className="patient-portal-selector">
                <span>Patient</span>
                <span className="patient-select-control">
                  <select
                    value={selectedPatient?.id || ''}
                    onChange={(event) => setSelectedPatientId(event.target.value)}
                    disabled={patients.length === 0}
                  >
                    {patients.length === 0 ? (
                      <option value="">No patients available</option>
                    ) : (
                      patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name}
                        </option>
                      ))
                    )}
                  </select>
                </span>
              </label>
              <button
                className="role-cta role-cta-button"
                type="button"
                onClick={enterPatientPortal}
                disabled={patients.length === 0}
              >
                Enter Patient Portal
              </button>
            </div>
          </div>
        </section>

        <aside className="wellness-visual" aria-hidden="true">
          <div className="plant-atmosphere">
            <img src={landingFlower} alt="" />
          </div>
        </aside>
      </main>
    </div>
  )
}
