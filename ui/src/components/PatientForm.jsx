import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createForm,
  createPatient,
  createPatientForm,
  listForms,
  listPatients,
} from '../services/api'
import './PatientForm.css'

export default function PatientForm() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    age: '',
    gender: '',
    mainSymptom: '',
    symptoms: [],
    duration: '',
    severity: '',
    medicalHistory: '',
    medications: '',
    additionalNotes: ''
  })

  const [submitted, setSubmitted] = useState(false)
  const [submissionId, setSubmissionId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const commonSymptoms = [
    'Headache',
    'Fever',
    'Cough',
    'Sore Throat',
    'Fatigue',
    'Nausea',
    'Dizziness',
    'Back Pain',
    'Chest Pain',
    'Shortness of Breath'
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSymptomToggle = (symptom) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')

    const patientName = `${formData.firstName} ${formData.lastName}`.trim()
    const subjectiveText = [
      `Primary symptom: ${formData.mainSymptom}`,
      formData.symptoms.length ? `Additional symptoms: ${formData.symptoms.join(', ')}` : '',
      `Duration: ${formData.duration}`,
      `Severity: ${formData.severity}`,
      formData.medicalHistory ? `Medical history: ${formData.medicalHistory}` : '',
      formData.medications ? `Current medications: ${formData.medications}` : '',
      formData.additionalNotes ? `Additional notes: ${formData.additionalNotes}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    try {
      const patients = await listPatients()
      const existingPatient = patients.find(
        (patient) => patient.email && patient.email.toLowerCase() === formData.email.toLowerCase()
      )

      const patient =
        existingPatient ||
        (await createPatient({
          name: patientName,
          email: formData.email,
          age: Number(formData.age),
          gender: formData.gender,
          medical_history: formData.medicalHistory || null,
        }))

      const forms = await listForms()
      const existingForm = forms.find((form) => form.title === 'Patient Symptom Submission Form')

      const formTemplate =
        existingForm ||
        (await createForm({
          title: 'Patient Symptom Submission Form',
          description: 'Standard symptom intake submitted by patient before doctor review.',
          category: 'Symptoms',
          created_by: 'ui-patient-portal',
        }))

      const submission = await createPatientForm({
        patient_id: patient.id,
        form_id: formTemplate.id,
        patient_name: patientName,
        subjective_text: subjectiveText,
        extracted_symptoms_json: JSON.stringify({
          mainSymptom: formData.mainSymptom,
          selectedSymptoms: formData.symptoms,
          duration: formData.duration,
          severity: formData.severity,
        }),
      })

      setSubmissionId(`PF-${submission.id}`)
      setSubmitted(true)
    } catch (error) {
      setSubmitError(error.message || 'Unable to submit to backend API.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="patient-form-container">
        <div className="success-message">
          <div className="success-icon">✓</div>
          <h2>Form Submitted Successfully!</h2>
          <p>Your medical information has been submitted for evaluation.</p>
          
          <div className="submission-details">
            <div className="detail-box">
              <label>Your Submission ID:</label>
              <div className="submission-id">{submissionId}</div>
              <small>Save this ID to track your evaluation status</small>
            </div>
          </div>

          <div className="next-steps">
            <h3>What happens next?</h3>
            <ol>
              <li>A doctor will review your symptoms and medical history</li>
              <li>Diagnostic analysis will be performed</li>
              <li>You'll receive evaluation results within 24-48 hours</li>
              <li>You can track status using your Submission ID</li>
            </ol>
          </div>

          <button 
            className="btn-secondary"
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="patient-form-container">
      <button className="btn-back" onClick={() => navigate('/')}>← Back</button>
      
      <div className="form-wrapper">
        <div className="form-header">
          <h1>Patient Symptom Submission Form</h1>
          <p>Please provide detailed information about your symptoms for accurate diagnosis</p>
        </div>

        <form onSubmit={handleSubmit} className="patient-form">
          {/* Personal Information */}
          <section className="form-section">
            <h2>Personal Information</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="age">Age *</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  min="0"
                  max="150"
                  value={formData.age}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender *</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </section>

          {/* Symptom Information */}
          <section className="form-section">
            <h2>Symptom Information</h2>
            
            <div className="form-group">
              <label htmlFor="mainSymptom">Primary Symptom *</label>
              <input
                type="text"
                id="mainSymptom"
                name="mainSymptom"
                placeholder="e.g., Headache, Fever"
                value={formData.mainSymptom}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Additional Symptoms (Select all that apply)</label>
              <div className="symptoms-grid">
                {commonSymptoms.map(symptom => (
                  <label key={symptom} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.symptoms.includes(symptom)}
                      onChange={() => handleSymptomToggle(symptom)}
                    />
                    <span>{symptom}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="duration">Duration *</label>
                <select
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Duration</option>
                  <option value="less-than-24h">Less than 24 hours</option>
                  <option value="1-3-days">1-3 days</option>
                  <option value="1-week">1 week</option>
                  <option value="1-month">1 month</option>
                  <option value="more-than-month">More than 1 month</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="severity">Severity *</label>
                <select
                  id="severity"
                  name="severity"
                  value={formData.severity}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Severity</option>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>
            </div>
          </section>

          {/* Medical History */}
          <section className="form-section">
            <h2>Medical History</h2>
            
            <div className="form-group">
              <label htmlFor="medicalHistory">Previous Medical Conditions</label>
              <textarea
                id="medicalHistory"
                name="medicalHistory"
                placeholder="List any chronic conditions, allergies, surgeries, etc."
                value={formData.medicalHistory}
                onChange={handleInputChange}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="medications">Current Medications</label>
              <textarea
                id="medications"
                name="medications"
                placeholder="List any medications you're currently taking"
                value={formData.medications}
                onChange={handleInputChange}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="additionalNotes">Additional Notes</label>
              <textarea
                id="additionalNotes"
                name="additionalNotes"
                placeholder="Any other relevant information"
                value={formData.additionalNotes}
                onChange={handleInputChange}
                rows="3"
              />
            </div>
          </section>

          <div className="form-actions">
            {submitError ? <p className="submit-error">{submitError}</p> : null}
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Form'}
            </button>
            <button 
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/')}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
