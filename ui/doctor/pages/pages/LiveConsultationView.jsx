import React, { useState, useEffect, useRef } from 'react'
import './LiveConsultationView.css'

const ReasoningPathChain = ({ path }) => {
  const nodes = path.split(' ➜ ').map((n) => n.trim()).filter(Boolean)
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

export const LiveConsultationView = ({
  patientName,
  isRecording,
  transcriptChunks = [],
  entities = [],
  reasoning = { suggestions: [], reasoning_path: [] },
  tags = [],
  onTag,
}) => {
  const suggestions = reasoning.suggestions || []
  const reasoningPath = reasoning.reasoning_path || []
  const [activeChunkId, setActiveChunkId] = useState(null)
  const [tagFlash, setTagFlash]           = useState(false)
  const transcriptEndRef                  = useRef(null)

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcriptChunks])

  const taggedIds = new Set(tags.map((t) => t.id))

  const handleTagCurrent = () => {
    if (transcriptChunks.length === 0) return
    const current = transcriptChunks[transcriptChunks.length - 1]
    onTag?.({ id: current.id, text: current.text, ts: current.ts })
    setTagFlash(true)
    setTimeout(() => setTagFlash(false), 600)
  }

  return (
    <div className="lcv-root">
      {/* Header bar */}
      <div className="lcv-header">
        <div className="lcv-header-left">
          <span className={`lcv-dot ${isRecording ? 'lcv-dot--live' : ''}`} />
          <span className="lcv-title">{isRecording ? 'Live consultation' : 'Paused'}</span>
          {patientName && <span className="lcv-patient">{patientName}</span>}
        </div>
        <span className={`lcv-badge ${isRecording ? '' : 'lcv-badge--paused'}`}>
          {isRecording ? 'Live' : 'Paused — content preserved'}
        </span>
      </div>

      {/* TOP: Reasoning paths + suggestions */}
      <div className="lcv-reasoning-section">
        <div className="lcv-reasoning-header">
          <h4>Knowledge Graph Reasoning</h4>
          <span className="lcv-panel-count">{reasoningPath.length} path{reasoningPath.length !== 1 ? 's' : ''}</span>
        </div>

        {suggestions.length === 0 && reasoningPath.length === 0 ? (
          <div className="lcv-waiting">
            <span className="lcv-listening-dot" />
            Waiting for clinical entities to build reasoning paths…
          </div>
        ) : (
          <div className="lcv-reasoning-body">
            {/* Suggestion cards */}
            {suggestions.length > 0 && (
              <div className="lcv-suggestions">
                {suggestions.map((s, i) => (
                  <div key={i} className={`lcv-suggestion-card lcv-appear ${s.urgency === 'urgent' ? 'lcv-suggestion--urgent' : ''}`}>
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

            {/* Path chains */}
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

      {/* Two panels side by side */}
      <div className="lcv-panels">

        {/* LEFT: Transcription */}
        <div className="lcv-panel">
          <div className="lcv-panel-head">
            <h4>Transcription</h4>
            <div className="lcv-panel-head-right">
              {tags.length > 0 && (
                <span className="lcv-tag-count">{tags.length} tagged</span>
              )}
              <span className="lcv-panel-count">{transcriptChunks.length} segments</span>
              <button
                className={`lcv-tag-btn ${tagFlash ? 'lcv-tag-btn--flash' : ''}`}
                onClick={handleTagCurrent}
                disabled={transcriptChunks.length === 0}
                title="Tag the current segment"
              >
                ⚑ Tag
              </button>
            </div>
          </div>

          <div className="lcv-transcript">
            {transcriptChunks.length === 0 && (
              <div className="lcv-waiting">
                <span className="lcv-listening-dot" />
                Listening for speech…
              </div>
            )}

            {transcriptChunks.map((chunk, i) => {
              const isTagged = taggedIds.has(chunk.id)
              return (
                <div
                  key={chunk.id}
                  className={[
                    'lcv-line',
                    activeChunkId === chunk.id ? 'lcv-line--active' : '',
                    isTagged ? 'lcv-line--tagged' : '',
                    i === transcriptChunks.length - 1 ? 'lcv-appear' : '',
                  ].join(' ')}
                  onClick={() => setActiveChunkId(chunk.id)}
                >
                  <span className="lcv-ts">{chunk.ts}</span>
                  <span className="lcv-text">{chunk.text}</span>
                </div>
              )
            })}

            {isRecording && (
              <div className="lcv-typing">
                <span /><span /><span />
              </div>
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
            {entities.length === 0 && (
              <div className="lcv-waiting">
                <span className="lcv-listening-dot" />
                Extracting clinical entities…
              </div>
            )}

            {entities.length > 0 && (
              <div className="lcv-entity-group">
                <h5>Detected Medical Terms</h5>
                {entities.map((entity, i) => (
                  <div key={i} className="lcv-entity-card lcv-appear">
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


    </div>
  )
}
