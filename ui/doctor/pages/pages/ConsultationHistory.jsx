import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../../../src/store/AppProvider'
import './ConsultationHistory.css'

const formatDuration = (seconds) => {
  if (!seconds) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const formatDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const getRecordTimestamp = (record) => {
  const value = record.savedAt || record.completedAt || record.endedAt || record.updatedAt || record.createdAt || record.date || record.scheduledFor
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

const hasPersistedResults = (record) => Boolean(record.hasPersistedResults)

export const ConsultationHistory = () => {
  const { consultations, getPatientById, refreshCoreData } = useAppContext()
  const navigate = useNavigate()
  const [localRecords, setLocalRecords] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [editingNotes, setEditingNotes] = useState(null)
  const [draftNote, setDraftNote] = useState('')

  useEffect(() => {
    refreshCoreData().catch(() => {})
    const stored = JSON.parse(localStorage.getItem('precerto_consultation_history') || '[]')
    setLocalRecords(stored)
  }, [refreshCoreData])

  // Map completed backend consultations to display format
  const backendRecords = consultations
    .filter((c) => c.status === 'completed')
    .map((c) => ({
      id: String(c.backendId || c.id),
      backendId: c.backendId || c.id,
      patientName: c.results?.patient?.name || getPatientById(c.patientId)?.name || 'Unknown Patient',
      consultationId: c.id,
      date: c.results?.savedAt || c.results?.saved_at || c.endedAt || c.updatedAt || c.createdAt,
      duration: c.recordingDurationSeconds || 0,
      tags: c.results?.analysis?.tags || [],
      summary: c.results?.analysis?.summary || null,
      hasPersistedResults: Boolean(c.resultsJson || c.results),
      fromBackend: true,
    }))

  // Merge: backend first, skip localStorage entries that duplicate a backend record
  const backendIds = new Set(backendRecords.map((r) => String(r.consultationId)))
  const filteredLocal = localRecords.filter((r) => !backendIds.has(String(r.consultationId)))
  const records = [...backendRecords, ...filteredLocal].sort((a, b) => getRecordTimestamp(b) - getRecordTimestamp(a))

  const handleRecordClick = (record) => {
    if (record.fromBackend && hasPersistedResults(record) && record.consultationId) {
      navigate(`/doctor/consultations/${record.backendId || String(record.consultationId || record.id).replace('cons-', '')}/results`)
      return
    }

    setExpanded(expanded === record.id ? null : record.id)
  }

  const handleDelete = (id) => {
    const updated = localRecords.filter((r) => r.id !== id)
    setLocalRecords(updated)
    localStorage.setItem('precerto_consultation_history', JSON.stringify(updated))
    if (expanded === id) setExpanded(null)
  }

  const startEditingNotes = (record) => {
    setEditingNotes(record.id)
    setDraftNote(record.notes || '')
  }

  const saveNotes = (id) => {
    const updated = localRecords.map((r) => r.id === id ? { ...r, notes: draftNote } : r)
    setLocalRecords(updated)
    localStorage.setItem('precerto_consultation_history', JSON.stringify(updated))
    setEditingNotes(null)
  }

  if (records.length === 0) {
    return (
      <div className="ch-empty">
        <div className="ch-empty-icon">🗂️</div>
        <h3>No saved consultations yet</h3>
        <p>After finishing a consultation recording, click <strong>Save Consultation</strong> to archive it here.</p>
      </div>
    )
  }

  return (
    <div className="ch-root">
      <div className="ch-header">
        <h2>Consultation History</h2>
        <span className="ch-count">{records.length} saved</span>
      </div>

      <div className="ch-list">
        {records.map((record) => (
          <div key={record.id} className={`ch-card ${expanded === record.id ? 'ch-card--open' : ''}`}>
            <div className="ch-card-main" onClick={() => handleRecordClick(record)}>
              <div className="ch-card-left">
                <div className="ch-avatar">{record.patientName?.[0] ?? '?'}</div>
                <div className="ch-card-info">
                  <strong className="ch-patient">{record.patientName || 'Unknown Patient'}</strong>
                  <span className="ch-date">{formatDate(record.date)}</span>
                </div>
              </div>

              <div className="ch-card-right">
                {record.tags?.length > 0 && (
                  <span className="ch-pill ch-pill--tags">⚑ {record.tags.length} tagged</span>
                )}
                <span className="ch-pill">{formatDuration(record.duration)}</span>
                <span className="ch-chevron">{expanded === record.id ? '▲' : '▼'}</span>
              </div>
            </div>

            {expanded === record.id && (
              <div className="ch-details">
                {/* Meta */}
                <div className="ch-meta-row">
                  <span><span className="ch-meta-label">ID</span> {record.consultationId || '—'}</span>
                  <span><span className="ch-meta-label">Duration</span> {formatDuration(record.duration)}</span>
                  <span><span className="ch-meta-label">Saved</span> {formatDate(record.date)}</span>
                </div>

                {/* Summary stats */}
                {record.summary && (
                  <div className="ch-summary-stats">
                    <div className="ch-stat"><span className="ch-stat-val">{record.summary.stats.symptomsCount}</span><span className="ch-stat-label">Symptoms</span></div>
                    <div className="ch-stat"><span className="ch-stat-val">{record.summary.stats.riskFactorsCount}</span><span className="ch-stat-label">Risk factors</span></div>
                    <div className="ch-stat"><span className="ch-stat-val">{record.summary.stats.avgConfidence}%</span><span className="ch-stat-label">Avg confidence</span></div>
                    <div className="ch-stat"><span className="ch-stat-val">{record.summary.stats.taggedCount}</span><span className="ch-stat-label">Tagged</span></div>
                  </div>
                )}

                {/* Top symptoms */}
                {record.summary?.topSymptoms?.length > 0 && (
                  <div className="ch-section">
                    <h4>Symptoms Extracted</h4>
                    <div className="ch-symptom-grid">
                      {record.summary.topSymptoms.map((s) => (
                        <div key={s.code} className="ch-symptom-card">
                          <div className="ch-symptom-top">
                            <span className="ch-symptom-name">{s.name}</span>
                            <code className="ch-symptom-code">{s.code}</code>
                          </div>
                          <span className="ch-symptom-sev">{s.severity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clinical insights */}
                {record.summary?.topInsights?.length > 0 && (
                  <div className="ch-section">
                    <h4>Clinical Insights</h4>
                    <div className="ch-insights-list">
                      {record.summary.topInsights.map((ins, i) => (
                        <div key={i} className="ch-insight-card">
                          <div className="ch-insight-top">
                            <span className="ch-insight-entity">{ins.entity}</span>
                            <span className="ch-insight-conf">{Math.round(ins.confidence * 100)}%</span>
                          </div>
                          <div className="ch-conf-bar"><div className="ch-conf-fill" style={{ width: `${ins.confidence * 100}%` }} /></div>
                          <p className="ch-insight-note">{ins.insight}</p>
                          <div className="ch-disease-tags">
                            {ins.linkedDiseases.map((d) => <span key={d} className="ch-disease-tag">{d}</span>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {record.summary?.suggestions?.length > 0 && (
                  <div className="ch-section">
                    <h4>Suggested Actions</h4>
                    <div className="ch-suggestions-list">
                      {record.summary.suggestions.map((s, i) => (
                        <div key={i} className="ch-suggestion-item">
                          <strong>{s.title}</strong>
                          <p>{s.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tagged moments */}
                {record.tags?.length > 0 && (
                  <div className="ch-section">
                    <h4>Tagged Moments</h4>
                    <div className="ch-tags-list">
                      {record.tags.map((tag) => (
                        <div key={tag.id} className="ch-tag-item">
                          <span className="ch-tag-ts">{tag.ts}</span>
                          <span className={`ch-tag-speaker ${tag.isDoctor ? 'ch-tag-speaker--doctor' : 'ch-tag-speaker--patient'}`}>
                            {tag.speaker}
                          </span>
                          <span className="ch-tag-text">{tag.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Doctor Notes */}
                <div className="ch-section ch-notes-section">
                  <h4>Doctor Notes</h4>
                  {editingNotes === record.id ? (
                    <div className="ch-notes-edit">
                      <textarea
                        className="ch-notes-textarea"
                        value={draftNote}
                        onChange={(e) => setDraftNote(e.target.value)}
                        rows={4}
                        placeholder="Add clinical observations, follow-up actions, or any remarks…"
                        autoFocus
                      />
                      <div className="ch-notes-edit-actions">
                        <span className="ch-notes-count">{draftNote.length} characters</span>
                        <button className="ch-notes-cancel-btn" onClick={() => setEditingNotes(null)}>Cancel</button>
                        <button className="ch-notes-save-btn" onClick={() => saveNotes(record.id)} disabled={!draftNote.trim()}>Save</button>
                      </div>
                    </div>
                  ) : record.notes ? (
                    <div className="ch-notes-view">
                      <p className="ch-notes-text">{record.notes}</p>
                      <button className="ch-notes-edit-btn" onClick={() => startEditingNotes(record)}>Edit notes</button>
                    </div>
                  ) : (
                    <button className="ch-notes-add-btn" onClick={() => startEditingNotes(record)}>+ Add notes</button>
                  )}
                </div>

                {!record.fromBackend && (
                  <button className="ch-delete-btn" onClick={() => handleDelete(record.id)}>
                    Delete record
                  </button>
                )}
                {record.fromBackend && record.consultationId && hasPersistedResults(record) && (
                  <button
                    className="ch-delete-btn"
                    onClick={() => navigate(`/doctor/consultations/${record.backendId || String(record.consultationId || record.id).replace('cons-', '')}/results`)}
                  >
                    View Consultation Results
                  </button>
                )}
                {record.fromBackend && record.consultationId && !hasPersistedResults(record) && (
                  <div className="ch-results-unavailable">Results are not saved for this consultation yet.</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
