import React, { useState, useEffect } from 'react'
import './SymptomExtraction.css'

export default function SymptomExtraction({ transcription, onSymptomExtracted, loading }) {
  const [editableTranscription, setEditableTranscription] = useState(transcription)
  const [extractedSymptoms, setExtractedSymptoms] = useState([])
  const [newSymptom, setNewSymptom] = useState('')
  const [severity, setSeverity] = useState('moderate')

  useEffect(() => {
    setEditableTranscription(transcription)
    // Auto-extract symptoms from transcription
    const symptoms = extractSymptomsFromText(transcription)
    setExtractedSymptoms(symptoms)
  }, [transcription])

  const extractSymptomsFromText = (text) => {
    // Simple keyword-based extraction
    const symptomKeywords = {
      'fever': { name: 'Fever', severity: 'high', confidence: 0.95 },
      'cough': { name: 'Cough', severity: 'moderate', confidence: 0.92 },
      'headache': { name: 'Headache', severity: 'moderate', confidence: 0.88 },
      'fatigue': { name: 'Fatigue', severity: 'moderate', confidence: 0.85 },
      'sore throat': { name: 'Sore Throat', severity: 'moderate', confidence: 0.90 },
      'shortness of breath': { name: 'Shortness of Breath', severity: 'high', confidence: 0.93 },
      'nausea': { name: 'Nausea', severity: 'moderate', confidence: 0.87 },
      'chest pain': { name: 'Chest Pain', severity: 'high', confidence: 0.96 },
      'dizziness': { name: 'Dizziness', severity: 'moderate', confidence: 0.89 },
      'abdominal pain': { name: 'Abdominal Pain', severity: 'moderate', confidence: 0.91 },
    }

    const symptoms = []
    const lowerText = text.toLowerCase()

    for (const [keyword, symptom] of Object.entries(symptomKeywords)) {
      if (lowerText.includes(keyword)) {
        symptoms.push({
          id: Math.random().toString(36).substr(2, 9),
          ...symptom,
          duration: 'recent',
          onset: 'acute'
        })
      }
    }

    return symptoms.length > 0 ? symptoms : [
      {
        id: '1',
        name: 'General Malaise',
        severity: 'moderate',
        confidence: 0.7,
        duration: 'recent',
        onset: 'acute'
      }
    ]
  }

  const addSymptom = () => {
    if (newSymptom.trim()) {
      const newSymptomObj = {
        id: Math.random().toString(36).substr(2, 9),
        name: newSymptom,
        severity: severity,
        confidence: 0.85,
        duration: 'recent',
        onset: 'acute'
      }
      setExtractedSymptoms([...extractedSymptoms, newSymptomObj])
      setNewSymptom('')
      setSeverity('moderate')
    }
  }

  const removeSymptom = (id) => {
    setExtractedSymptoms(extractedSymptoms.filter(s => s.id !== id))
  }

  const updateSymptom = (id, field, value) => {
    setExtractedSymptoms(
      extractedSymptoms.map(s => (s.id === id ? { ...s, [field]: value } : s))
    )
  }

  const handleProceed = () => {
    if (extractedSymptoms.length > 0) {
      onSymptomExtracted(extractedSymptoms)
    } else {
      alert('Please add at least one symptom')
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return '#48bb78'
      case 'moderate': return '#ed8936'
      case 'high': return '#e53e3e'
      default: return '#718096'
    }
  }

  return (
    <div className="symptom-extraction-container">
      <div className="card extraction-card">
        <div className="card-header">
          <h2>Clinical Entity Review</h2>
        </div>

        <div className="extraction-content">
          {/* Transcription Section */}
          <section className="transcription-section">
            <h3>Clinical Transcript</h3>
            <textarea
              value={editableTranscription}
              onChange={(e) => setEditableTranscription(e.target.value)}
              className="transcription-textarea"
              placeholder="Edited clinical dialogue appears here..."
            />
            <p className="section-help">Edit the transcription if needed. Changes will be reflected in symptom analysis.</p>
          </section>

          {/* Symptoms List Section */}
          <section className="symptoms-section">
            <h3>Extracted Symptoms</h3>
            
            <div className="symptoms-list">
              {extractedSymptoms.map((symptom) => (
                <div key={symptom.id} className="symptom-item">
                  <div className="symptom-header">
                    <div className="symptom-info">
                      <h4>{symptom.name}</h4>
                      <div className="symptom-tags">
                        <span
                          className="badge badge-severity"
                          style={{ background: `${getSeverityColor(symptom.severity)}20`, color: getSeverityColor(symptom.severity) }}
                        >
                          {symptom.severity}
                        </span>
                        <span className="badge badge-primary">
                          Confidence: {(symptom.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn-remove"
                      onClick={() => removeSymptom(symptom.id)}
                      title="Remove symptom"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="symptom-details">
                    <div className="detail-group">
                      <label>Onset:</label>
                      <select
                        value={symptom.onset}
                        onChange={(e) => updateSymptom(symptom.id, 'onset', e.target.value)}
                      >
                        <option>acute</option>
                        <option>subacute</option>
                        <option>chronic</option>
                      </select>
                    </div>
                    <div className="detail-group">
                      <label>Duration:</label>
                      <select
                        value={symptom.duration}
                        onChange={(e) => updateSymptom(symptom.id, 'duration', e.target.value)}
                      >
                        <option>recent</option>
                        <option>days</option>
                        <option>weeks</option>
                        <option>months</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Symptom */}
            <div className="add-symptom-section">
              <h4>Add Additional Symptom</h4>
              <div className="add-symptom-form">
                <input
                  type="text"
                  value={newSymptom}
                  onChange={(e) => setNewSymptom(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
                  placeholder="Enter symptom name..."
                />
                <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                </select>
                <button className="btn btn-secondary" onClick={addSymptom}>
                  + Add
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="card-footer">
          <button
            className="btn btn-secondary"
            onClick={() => window.location.reload()}
          >
            Back
          </button>
          <button
            className="btn btn-primary"
            onClick={handleProceed}
            disabled={loading || extractedSymptoms.length === 0}
          >
            {loading ? 'Processing...' : 'Next: Diagnostic Reasoning'}
          </button>
        </div>
      </div>
    </div>
  )
}
