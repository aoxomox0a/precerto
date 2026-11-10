import React, { useState, useEffect } from 'react'
import { Button } from '../../../src/components/shared'
import { diagnose } from '../../../src/services/api'
import './DiagnosticResults.css'

const MOCK_DISEASES = [
  {
    id: 'disease-001',
    name: 'Acute Bronchitis',
    confidence: 0.87,
    severity: 'moderate',
    reasoning: [
      'Persistent cough documented',
      'Chest discomfort with deep inspiration',
      'Recent respiratory infection pattern',
      'Acute two-week timeline'
    ],
    matchedSymptoms: ['cough', 'chest_pain', 'shortness_of_breath'],
    recommendedTests: ['Chest X-ray', 'Blood cultures', 'Sputum analysis'],
    icdCode: 'J20.9'
  },
  {
    id: 'disease-002',
    name: 'Community-Acquired Pneumonia (CAP)',
    confidence: 0.72,
    severity: 'moderate-high',
    reasoning: [
      'Fever during consultation',
      'Persistent cough with fatigue',
      'Former smoking history raises respiratory risk',
      'Presentation overlaps CAP pattern'
    ],
    matchedSymptoms: ['fever', 'cough', 'fatigue', 'dyspnea'],
    recommendedTests: ['Chest imaging', 'Blood cultures', 'CBC with differential'],
    icdCode: 'J18.9'
  },
  {
    id: 'disease-003',
    name: 'Influenza (Seasonal)',
    confidence: 0.65,
    severity: 'mild-moderate',
    reasoning: [
      'Systemic fatigue reported',
      'Intermittent fever pattern',
      'Recent workplace illness context',
      'Lower specificity due to respiratory overlap'
    ],
    matchedSymptoms: ['fever', 'myalgia', 'fatigue', 'headache'],
    recommendedTests: ['Rapid flu test', 'PCR culture', 'Throat swab'],
    icdCode: 'J09.X9'
  },
  {
    id: 'disease-004',
    name: 'Chronic Obstructive Pulmonary Disease (COPD)',
    confidence: 0.58,
    severity: 'variable',
    reasoning: [
      'Former smoking history documented',
      'Chronic dyspnea reported',
      'Cough may reflect baseline airway disease',
      'Lower confidence because presentation is acute'
    ],
    matchedSymptoms: ['chronic_cough', 'dyspnea', 'wheezing'],
    recommendedTests: ['Spirometry', 'Chest X-ray', 'Lung function tests'],
    icdCode: 'J44.9'
  }
]

export const DiagnosticResults = ({
  consultationId,
  patientName,
  recordingDuration,
  transcriptText,
  onDiagnosisAccepted
}) => {
  const [diseases, setDiseases] = useState(MOCK_DISEASES)
  const [loading, setLoading] = useState(false)
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(MOCK_DISEASES[0].id)
  const [acceptedDiagnoses, setAcceptedDiagnoses] = useState([])
  const [expandedDiagnoses, setExpandedDiagnoses] = useState([MOCK_DISEASES[0].id])
  const [confirmingRejectId, setConfirmingRejectId] = useState(null)
  const [showAdditionalHypotheses, setShowAdditionalHypotheses] = useState(false)

  useEffect(() => {
    if (!transcriptText || !consultationId) return
    setLoading(true)
    diagnose(consultationId, transcriptText)
      .then((data) => {
        if (data.suggestions?.length > 0) {
          const mapped = data.suggestions.map((s, i) => ({
            id: `disease-${i}`,
            name: s.condition,
            confidence: s.confidence / 100,
            severity: s.urgency === 'urgent' ? 'high' : 'moderate',
            reasoning: s.matched_symptoms || [],
            matchedSymptoms: s.matched_symptoms || [],
            recommendedTests: [],
            icdCode: '—',
          }))
          setDiseases(mapped)
          setSelectedDiagnosis(mapped[0].id)
          setExpandedDiagnoses([mapped[0].id])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [consultationId, transcriptText])

  const primaryHypotheses = diseases.slice(0, 3)
  const additionalHypotheses = diseases.slice(3)

  const toggleDiagnosisDetails = (diseaseId) => {
    setSelectedDiagnosis(diseaseId)
    setConfirmingRejectId(null)
    setExpandedDiagnoses((prev) =>
      prev.includes(diseaseId)
        ? prev.filter((id) => id !== diseaseId)
        : [...prev, diseaseId]
    )
  }

  const handleAcceptDiagnosis = (diseaseId) => {
    if (!acceptedDiagnoses.includes(diseaseId)) {
      setAcceptedDiagnoses([...acceptedDiagnoses, diseaseId])
      onDiagnosisAccepted?.(diseaseId)
      console.log(`Diagnosis accepted: ${diseaseId}`)
    }
  }

  const handleRejectDiagnosis = (diseaseId) => {
    setAcceptedDiagnoses(acceptedDiagnoses.filter((id) => id !== diseaseId))
    setConfirmingRejectId(null)
    console.log(`Diagnosis rejected: ${diseaseId}`)
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'mild':
        return '#48bb78'
      case 'mild-moderate':
        return '#ed8936'
      case 'moderate':
        return '#f6ad55'
      case 'moderate-high':
        return '#fc8181'
      case 'high':
        return '#e53e3e'
      case 'variable':
        return '#64748b'
      default:
        return '#718096'
    }
  }

  const getConfidenceGradient = (confidence) => {
    if (confidence >= 0.8) return 'confidence-high'
    if (confidence >= 0.7) return 'confidence-med-high'
    if (confidence >= 0.6) return 'confidence-medium'
    return 'confidence-low'
  }

  const renderDiagnosisCard = (disease, isAdditional = false) => {
    const isExpanded = expandedDiagnoses.includes(disease.id)
    const isAccepted = acceptedDiagnoses.includes(disease.id)
    const keySymptoms = disease.matchedSymptoms.slice(0, 2).map((symptom) => symptom.replace(/_/g, ' '))

    return (
      <div
        key={disease.id}
        className={`disease-card ${selectedDiagnosis === disease.id ? 'selected' : ''} ${
          isAccepted ? 'accepted' : ''
        } ${isExpanded ? 'expanded' : 'collapsed'} ${isAdditional ? 'additional' : ''}`}
        onClick={() => setSelectedDiagnosis(disease.id)}
      >
        <div className="disease-header">
          <div className="disease-title">
            <h4>{disease.name}</h4>
            <code className="icd-code">{disease.icdCode}</code>
          </div>
          <div className="disease-metrics">
            <span className={`confidence-pill ${getConfidenceGradient(disease.confidence)}`}>
              {Math.round(disease.confidence * 100)}%
            </span>
            <span
              className="severity-pill"
              style={{ borderColor: getSeverityColor(disease.severity), color: getSeverityColor(disease.severity) }}
            >
              {disease.severity}
            </span>
          </div>
        </div>

        <div className="disease-summary">
          <p>{isExpanded ? disease.reasoning[0] : keySymptoms.join(' + ')}</p>
          {!isExpanded && <span className="review-hint">Open case</span>}
        </div>

        {isExpanded && (
          <div className="disease-details">
            <div className="evidence-grid">
              <div className="disease-reasoning">
                <h5>Evidence chain</h5>
                <div className="reasoning-list">
                  {disease.reasoning.map((reason, idx) => (
                    <div key={idx} className="reasoning-item">
                      <span className="reason-index">{idx + 1}</span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="disease-symptoms">
                <h5>Matched symptoms</h5>
                <div className="symptoms-tags">
                  {disease.matchedSymptoms.map((symptom, idx) => (
                    <span key={idx} className="symptom-tag">
                      {symptom.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="disease-tests">
                <h5>Suggested tests</h5>
                <div className="tests-list">
                  {disease.recommendedTests.map((test, idx) => (
                    <div key={idx} className="test-item">
                      <span>{test}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="disease-actions">
          <button
            type="button"
            className="detail-toggle"
            onClick={(event) => {
              event.stopPropagation()
              toggleDiagnosisDetails(disease.id)
            }}
          >
            {isExpanded ? 'Close review' : 'Review'}
          </button>

          {isExpanded && !isAccepted && (
            <>
              <Button
                variant="success"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation()
                  handleAcceptDiagnosis(disease.id)
                }}
              >
                Accept
              </Button>

              {confirmingRejectId === disease.id ? (
                <div className="reject-confirmation">
                  <span>Confirm reject?</span>
                  <button
                    type="button"
                    className="btn-reject-confirm"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleRejectDiagnosis(disease.id)
                    }}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="btn-reject-cancel"
                    onClick={(event) => {
                      event.stopPropagation()
                      setConfirmingRejectId(null)
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-reject"
                  onClick={(event) => {
                    event.stopPropagation()
                    setConfirmingRejectId(disease.id)
                  }}
                >
                  Reject
                </button>
              )}
            </>
          )}

          {isExpanded && isAccepted && (
            <>
              <div className="accepted-badge">Accepted</div>
              <Button
                variant="secondary"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation()
                  handleRejectDiagnosis(disease.id)
                }}
              >
                Undo
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="diagnostic-results">
      <div className="results-header">
        <h3>Most Relevant Clinical Hypotheses</h3>
        <p className="results-meta">
          Patient: <strong>{patientName}</strong> |
          Recording: <strong>{recordingDuration}s</strong> |
          Analysis: <strong>SNOMED CT + Graph Reasoning</strong>
        </p>
      </div>

      <div className="hypotheses-summary">
        <strong>Clinical priority view</strong>
        <p>Top hypothesis is open for review. Secondary possibilities stay compact until the physician opens them.</p>
      </div>

      <div className="diseases-list">
        {primaryHypotheses.map((disease) => renderDiagnosisCard(disease))}
      </div>

      {additionalHypotheses.length > 0 && (
        <div className="additional-hypotheses">
          <button
            type="button"
            className="additional-toggle"
            onClick={() => setShowAdditionalHypotheses((prev) => !prev)}
          >
            {showAdditionalHypotheses
              ? 'Hide additional hypotheses'
              : `View additional hypotheses (${additionalHypotheses.length})`}
          </button>

          {!showAdditionalHypotheses ? (
            <div className="additional-summary">
              <ul>
                {additionalHypotheses.map((disease) => (
                  <li key={disease.id}>
                    <span>{disease.name}</span>
                    <span className={`confidence-pill ${getConfidenceGradient(disease.confidence)}`}>
                      {Math.round(disease.confidence * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="additional-list">
              {additionalHypotheses.map((disease) => renderDiagnosisCard(disease, true))}
            </div>
          )}
        </div>
      )}

      <div className="results-summary">
        <h4>Decision state</h4>
        <p>
          <strong>Total analyzed:</strong> {diseases.length}
        </p>
        <p>
          <strong>Accepted for follow-up:</strong> {acceptedDiagnoses.length}
        </p>
        {acceptedDiagnoses.length > 0 && (
          <div className="accepted-list">
            <strong>Selected for further investigation:</strong>
            <ul>
              {diseases.filter((disease) => acceptedDiagnoses.includes(disease.id)).map((disease) => (
                <li key={disease.id}>
                  {disease.name} (ICD: {disease.icdCode}, Confidence: {Math.round(disease.confidence * 100)}%)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="results-footer">
        <p className="disclaimer">
          <strong>Clinical disclaimer:</strong> AI-assisted hypotheses support, but do not replace,
          clinician judgment. Final diagnosis and treatment decisions remain with the qualified clinician.
        </p>
      </div>
    </div>
  )
}
