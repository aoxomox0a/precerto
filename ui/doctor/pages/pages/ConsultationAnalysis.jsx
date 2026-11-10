import React, { useState, useEffect, useRef } from 'react'
import './LiveConsultationView.css'
import './ConsultationAnalysis.css'

const ReasoningPathChain = ({ path }) => {
  const normalizedPath = Array.isArray(path)
    ? path.join(' ➜ ')
    : typeof path === 'string'
      ? path
      : String(path || '')
  const nodes = normalizedPath.split(' ➜ ').map((n) => n.trim()).filter(Boolean)
  return (
    <div className="lcv-path-chain">
      {nodes.map((node, i) => (
        <React.Fragment key={i}>
          <span className="lcv-path-node">{node}</span>
          {i < nodes.length - 1 && <span className="lcv-path-arrow">➜</span>}
        </React.Fragment>
      ))}
    </div>
  )
}

const normalizeSynthesizedDrivers = (reasoning = {}) => {
  const drivers = reasoning.synthesized_drivers || reasoning.synthesizedDrivers || []
  if (!Array.isArray(drivers)) return []

  return drivers
    .map((driver) => {
      if (!driver) return null
      if (typeof driver === 'string') {
        return {
          primary_driver: driver,
          confidence: null,
          driven_conditions: [],
        }
      }

      return {
        primary_driver: driver.primary_driver || driver.driver || driver.name || '',
        confidence: driver.confidence ?? null,
        driven_conditions: driver.driven_conditions || driver.driving_complications || driver.conditions || [],
      }
    })
    .filter((driver) => driver && driver.primary_driver)
}

export const buildAnalysisSummary = (tags = [], entities = [], reasoning = { suggestions: [], reasoning_path: [] }) => ({
  topSymptoms: entities.slice(0, 4).map((name) => ({ name })),
  topInsights: (reasoning.reasoning_path || []).slice(0, 3).map((path) => ({ path })),
  suggestions: (reasoning.suggestions || []).slice(0, 3).map(({ condition, confidence }) => ({ title: condition, text: `Confidence: ${confidence}%` })),
  stats: {
    symptomsCount: entities.length,
    insightsCount: (reasoning.reasoning_path || []).length,
    suggestionsCount: (reasoning.suggestions || []).length,
    taggedCount: tags.length,
  },
})

export const ConsultationAnalysis = ({
  recordingDuration,
  patientName,
  consultationId,
  tags = [],
  transcriptChunks = [],
  entities = [],
  reasoning = { suggestions: [], reasoning_path: [] },
  initialAnalysisComplete = false,
}) => {
  const [isAnalyzing, setIsAnalyzing]           = useState(!initialAnalysisComplete)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const transcriptEndRef                        = useRef(null)

  const taggedIds    = new Set(tags.map((t) => t.id))
  const taggedTexts  = new Set(tags.map((t) => t.text))
  const suggestions  = reasoning.suggestions    || []
  const synthesizedDrivers = normalizeSynthesizedDrivers(reasoning)
  const reasoningPath = Array.isArray(reasoning.reasoning_path)
    ? reasoning.reasoning_path
        .map((path) => {
          if (typeof path === 'string') return path
          if (Array.isArray(path)) return path.join(' ➜ ')
          if (path && typeof path === 'object') {
            return path.path || path.reasoning_path || path.steps?.join?.(' ➜ ') || path.text || ''
          }
          return ''
        })
        .filter(Boolean)
    : []

  useEffect(() => {
    let interval
    if (isAnalyzing) {
      interval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev >= 100) { setIsAnalyzing(false); return 100 }
          return prev + Math.random() * 30
        })
      }, 500)
    }
    return () => clearInterval(interval)
  }, [isAnalyzing])

  return (
    <div className="lcv-root">

      {/* Header — same structure as live view, stopped state */}
      <div className="lcv-header">
        <div className="lcv-header-left">
          <span className="lcv-dot" />
          <span className="lcv-title">Consultation complete</span>
          {patientName && <span className="lcv-patient">{patientName}</span>}
        </div>
        <span className="lcv-badge lcv-badge--paused">
          {recordingDuration != null ? `${recordingDuration}s recorded` : 'Saved'}
        </span>
      </div>

      {/* Processing spinner */}
      {isAnalyzing && (
        <div className="analysis-processing">
          <div className="processing-spinner" />
          <h4>Backend Analysis in Progress…</h4>
          <p>Transcribing audio → Extracting entities → Linking to knowledge graph</p>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${analysisProgress}%` }} />
          </div>
          <p className="progress-text">{Math.round(analysisProgress)}%</p>
        </div>
      )}

      {!isAnalyzing && (
        <>
          {/* TOP: Knowledge graph reasoning */}
          <div className="lcv-reasoning-section">
            <div className="lcv-reasoning-header">
              <h4>Knowledge Graph Reasoning</h4>
              <span className="lcv-panel-count">{reasoningPath.length} path{reasoningPath.length !== 1 ? 's' : ''}</span>
            </div>

            {suggestions.length === 0 && reasoningPath.length === 0 && synthesizedDrivers.length === 0 ? (
              <div className="lcv-waiting">
                <span className="lcv-listening-dot" />
                No reasoning paths — connect backend to enable knowledge graph analysis.
              </div>
            ) : (
              <div className="lcv-reasoning-body">
                {synthesizedDrivers.length > 0 && (
                  <div className="lcv-synthesized-block">
                    <h5>Synthesized Clinical Diagnosis</h5>
                    <div className="lcv-suggestions">
                      {synthesizedDrivers.map((driver, index) => (
                        <div key={`${driver.primary_driver}-${index}`} className="lcv-suggestion-card lcv-synthesized-card">
                          <div className="lcv-synthesized-row">
                            <span className="lcv-synthesized-label">Primary driver:</span>
                            <span className="lcv-suggestion-name">{driver.primary_driver}</span>
                          </div>
                          <div className="lcv-synthesized-row">
                            <span className="lcv-synthesized-label">Confidence:</span>
                            <span className="lcv-synthesized-value">{driver.confidence != null ? `${driver.confidence}%` : '—'}</span>
                          </div>
                          <div className="lcv-synthesized-row lcv-synthesized-row--stacked">
                            <span className="lcv-synthesized-label">Driving complications:</span>
                            <div className="lcv-suggestion-symptoms">
                              {driver.driven_conditions.length > 0 ? (
                                driver.driven_conditions.map((condition) => (
                                  <span key={condition} className="lcv-symptom-tag">{condition}</span>
                                ))
                              ) : (
                                <span className="lcv-symptom-tag">No driving complications listed</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {suggestions.length > 0 && (
                  <div className="lcv-suggestions">
                    {suggestions.map((s, i) => (
                      <div key={i} className={`lcv-suggestion-card ${s.urgency === 'urgent' ? 'lcv-suggestion--urgent' : ''}`}>
                        <div className="lcv-suggestion-top">
                          <span className="lcv-suggestion-name">{s.condition}</span>
                          <span className={`lcv-suggestion-badge ${s.urgency === 'urgent' ? 'lcv-badge--urgent' : 'lcv-badge--routine'}`}>
                            {s.urgency}
                          </span>
                        </div>
                        <div className="lcv-suggestion-confidence">
                          <div className="lcv-conf-bar">
                            <div className="lcv-conf-fill" style={{ width: `${s.confidence}%` }} />
                          </div>
                          <span>{s.confidence}%</span>
                        </div>
                        {s.matched_symptoms?.length > 0 && (
                          <div className="lcv-suggestion-symptoms">
                            {s.matched_symptoms.map((sym) => (
                              <span key={sym} className="lcv-symptom-tag">{sym}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {reasoningPath.length > 0 && (
                  <div className="lcv-paths">
                    <h5>Reasoning paths</h5>
                    {reasoningPath.map((path, i) => (
                      <ReasoningPathChain key={i} path={path} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* BOTTOM: Two panels side by side */}
          <div className="lcv-panels">

            {/* LEFT: Transcript */}
            <div className="lcv-panel">
              <div className="lcv-panel-head">
                <h4>Transcription</h4>
                <div className="lcv-panel-head-right">
                  {tags.length > 0 && (
                    <span className="lcv-tag-count">{tags.length} tagged</span>
                  )}
                  <span className="lcv-panel-count">{transcriptChunks.length} segments</span>
                </div>
              </div>

              <div className="lcv-transcript">
                {transcriptChunks.length === 0 ? (
                  <div className="lcv-waiting">
                    No transcript available — backend was not connected during this session.
                  </div>
                ) : (
                  transcriptChunks.map((chunk) => {
                    const isTagged = taggedIds.has(chunk.id) || taggedTexts.has(chunk.text)
                    return (
                      <div
                        key={chunk.id}
                        className={`lcv-line ${isTagged ? 'lcv-line--tagged' : ''}`}
                      >
                        <span className="lcv-ts">{chunk.ts}</span>
                        <span className="lcv-text">{chunk.text}</span>
                        {isTagged && <span className="ca-tagged-badge">⚑</span>}
                      </div>
                    )
                  })
                )}
                <div ref={transcriptEndRef} />
              </div>
            </div>

            {/* RIGHT: Entity extraction */}
            <div className="lcv-panel">
              <div className="lcv-panel-head">
                <h4>Entity Extraction</h4>
                <span className="lcv-panel-count">{entities.length} entities</span>
              </div>

              <div className="lcv-entities">
                {entities.length === 0 ? (
                  <div className="lcv-waiting">
                    No entities extracted — connect the backend to enable NLP analysis.
                  </div>
                ) : (
                  <div className="lcv-entity-group">
                    <h5>Detected Medical Terms</h5>
                    {entities.map((entity, i) => (
                      <div key={i} className="lcv-entity-card">
                        <div className="lcv-entity-top">
                          <span className="lcv-entity-name">{entity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  )
}
