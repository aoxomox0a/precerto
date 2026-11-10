import React, { useState } from 'react'
import './ClinicianConfirmation.css'

export default function ClinicianConfirmation({
  diagnosis,
  symptoms,
  explanation,
  tags = [],
  onConfirm,
  onBack
}) {
  const [clinicianNotes, setClinicianNotes] = useState('')
  const [additionalTests, setAdditionalTests] = useState([])
  const [treatment, setTreatment] = useState('')
  const [confidence, setConfidence] = useState('high')
  const [testInput, setTestInput] = useState('')

  const addTest = () => {
    if (testInput.trim()) {
      setAdditionalTests([...additionalTests, testInput])
      setTestInput('')
    }
  }

  const removeTest = (index) => {
    setAdditionalTests(additionalTests.filter((_, i) => i !== index))
  }

  const handleConfirm = () => {
    if (!treatment.trim()) {
      alert('Please specify treatment plan')
      return
    }

    onConfirm({
      ...diagnosis,
      confirmedAt: new Date().toISOString(),
      clinicianConfidence: confidence
    }, {
      notes: clinicianNotes,
      tests: additionalTests,
      treatment: treatment,
      confidence: confidence
    })
  }

  return (
    <div className="confirmation-container">
      <div className="card confirmation-card">
        <div className="card-header">
          <h2>✓ Clinician Confirmation & Action Plan</h2>
          <p className="subtitle">Review and confirm the recommended diagnosis</p>
        </div>

        <div className="confirmation-content">
          {/* Diagnosis Summary */}
          <section className="diagnosis-summary-section">
            <h3>Primary Diagnosis</h3>
            <div className="diagnosis-summary">
              <div className="diagnosis-main">
                <h4>{diagnosis.name}</h4>
                <p className="diagnosis-code">ICD-10: {diagnosis.code}</p>
                <p className="diagnosis-description">{diagnosis.description}</p>
              </div>
              <div className="diagnosis-stats">
                <div className="stat">
                  <span className="stat-label">AI Confidence</span>
                  <span className="stat-value">{(diagnosis.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Likelihood</span>
                  <span className="stat-value">{diagnosis.likelihood}%</span>
                </div>
              </div>
            </div>
          </section>

          {/* Clinical Reasoning */}
          {explanation && (
            <section className="clinical-reasoning-section">
              <h3>Clinical Reasoning</h3>
              <div className="reasoning-box">
                <p>{explanation}</p>
              </div>
            </section>
          )}

          {/* Matching Symptoms */}
          <section className="matching-symptoms-section">
            <h3>Matching Patient Symptoms</h3>
            <div className="symptoms-checklist">
              {symptoms.map((symptom) => (
                <div key={symptom.id} className="symptom-check">
                  <div className="check-mark">✓</div>
                  <div className="symptom-info">
                    <p className="symptom-name">{symptom.name}</p>
                    <p className="symptom-details">
                      {symptom.onset} onset, {symptom.duration} duration
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tagged Important Moments */}
          {tags && tags.length > 0 && (
            <section className="tagged-moments-section">
              <h3>📌 Tagged Important Moments ({tags.length})</h3>
              <div className="tags-summary-list">
                {tags.map((tag) => (
                  <div key={tag.id} className="tag-summary-item">
                    <span className="tag-time-badge">{tag.timestamp}</span>
                    <p className="tag-summary-text">"{tag.text}"</p>
                  </div>
                ))}
              </div>
              <p className="tags-note">
                💡 These tagged moments from your consultation will be included in the patient's clinical notes.
              </p>
            </section>
          )}

          {/* Clinician Confirmation */}
          <section className="clinician-confirmation-section">
            <h3>Clinician Assessment</h3>

            {/* Confidence Level */}
            <div className="form-group">
              <label htmlFor="confidence">Your Confidence Level</label>
              <div className="confidence-selector">
                {['low', 'moderate', 'high', 'very high'].map((level) => (
                  <button
                    key={level}
                    className={`confidence-btn ${confidence === level ? 'active' : ''}`}
                    onClick={() => setConfidence(level)}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Treatment Plan */}
            <div className="form-group">
              <label htmlFor="treatment">Treatment Plan *</label>
              <textarea
                id="treatment"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                placeholder="Specify the treatment plan, medications, dosages, and duration..."
                className="form-textarea"
              />
            </div>

            {/* Additional Tests */}
            <div className="form-group">
              <label>Recommended Additional Tests</label>
              <div className="test-input-group">
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTest()}
                  placeholder="E.g., CBC, Chest X-ray, ECG..."
                />
                <button className="btn btn-secondary" onClick={addTest}>
                  + Add
                </button>
              </div>
              {additionalTests.length > 0 && (
                <div className="tests-list">
                  {additionalTests.map((test, idx) => (
                    <div key={idx} className="test-item">
                      <span>{test}</span>
                      <button
                        className="remove-test-btn"
                        onClick={() => removeTest(idx)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Notes */}
            <div className="form-group">
              <label htmlFor="notes">Additional Clinician Notes</label>
              <textarea
                id="notes"
                value={clinicianNotes}
                onChange={(e) => setClinicianNotes(e.target.value)}
                placeholder="Add any additional clinical notes or observations..."
                className="form-textarea"
              />
            </div>
          </section>

          {/* Clinical Guidelines */}
          <section className="guidelines-section">
            <div className="guidelines-card">
              <h4>📋 Clinical Guidelines</h4>
              <ul className="guidelines-list">
                <li>Follow current clinical practice guidelines for {diagnosis.name}</li>
                <li>Consider differential diagnoses before finalizing treatment</li>
                <li>Monitor patient response to treatment</li>
                <li>Document all clinical decisions in patient record</li>
                <li>Escalate to specialist if no improvement within expected timeframe</li>
              </ul>
            </div>
          </section>
        </div>

        <div className="card-footer">
          <button className="btn btn-secondary" onClick={onBack}>
            ← Back to Diagnoses
          </button>
          <button
            className="btn btn-success"
            onClick={handleConfirm}
            disabled={!treatment.trim()}
          >
            ✓ Confirm & Save
          </button>
        </div>
      </div>
    </div>
  )
}
