import React, { useState } from 'react';
import './DiagnosticReasoning.css';

export default function DiagnosticReasoning({
  kgData,
  onDiagnosisSelected,
  onRejectDiagnoses,
  loading
}) {
  const [selectedDiagnosisId, setSelectedDiagnosisId] = useState(null);
  const [expandedDiagnosisId, setExpandedDiagnosisId] = useState(null);

  // Safely extract the data from kgData (falling back to empty arrays if null/undefined)
  const safeSymptoms = kgData?.symptoms || [];
  const safeDiagnoses = kgData?.diagnoses || [];
  const safePaths = kgData?.reasoningPaths || [];

  const toggleExpand = (id) => {
    setExpandedDiagnosisId(expandedDiagnosisId === id ? null : id);
  };

  const handleSelect = (diagnosis) => {
    // Use condition name as ID if no explicit ID exists
    setSelectedDiagnosisId(diagnosis.id || diagnosis.condition);
    if (onDiagnosisSelected) {
      onDiagnosisSelected(diagnosis);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return '#e53e3e';
      case 'high': return '#ed8936';
      case 'urgent': return '#ed8936'; // Mapped from Python backend
      case 'moderate': return '#ecc94b';
      case 'low': return '#48bb78';
      case 'routine': return '#48bb78'; // Mapped from Python backend
      default: return '#10b981'; // Default Emerald
    }
  };

  return (
    <div className="diagnostic-reasoning flex flex-col h-full bg-slate-900 text-slate-100 rounded-lg p-5 shadow-xl">
      <div className="header mb-4 border-b border-slate-700 pb-3">
        <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Knowledge Graph Engine
        </h2>
        <p className="text-sm text-slate-400 mt-1">Live semantic deterministic mapping</p>
      </div>

      {/* 1. EXTRACTED CLINICAL ENTITIES */}
      <div className="mb-6">
        <h3 className="font-semibold text-sm mb-2 text-slate-300 uppercase tracking-wider">
          Verified Entities
        </h3>
        <div className="flex flex-wrap gap-2 min-h-[32px]">
          {safeSymptoms.length === 0 ? (
            <span className="text-slate-600 italic text-sm">Awaiting clinical entities...</span>
          ) : (
            safeSymptoms.map((symptom, idx) => (
              <span 
                key={idx} 
                className="bg-emerald-900 text-emerald-300 px-3 py-1 rounded-full text-xs border border-emerald-700 shadow-sm"
              >
                {symptom}
              </span>
            ))
          )}
        </div>
      </div>

      {/* 2. REASONING PATHS */}
      <div className="mb-6 flex-1">
        <h3 className="font-semibold text-sm mb-2 text-slate-300 uppercase tracking-wider">
          Graph Traversal Paths
        </h3>
        <div className="bg-black p-4 rounded-md font-mono text-xs text-emerald-400 overflow-y-auto min-h-[150px] border border-slate-800 shadow-inner">
          {safePaths.length === 0 ? (
            <span className="text-slate-700">Listening for graph query execution...</span>
          ) : (
            safePaths.map((path, idx) => (
              <div key={idx} className="mb-2 leading-relaxed">
                <span className="text-slate-500 select-none">{`[${new Date().toLocaleTimeString()}] `}</span>
                {path}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. CONVERGED DIAGNOSES */}
      <div className="diagnoses-section mt-auto">
        <h3 className="font-semibold text-sm mb-3 text-slate-300 uppercase tracking-wider">
          Path Convergence
        </h3>
        <div className="space-y-4 min-h-[100px]">
          {safeDiagnoses.length === 0 ? (
            <span className="text-slate-600 italic text-sm">Awaiting data convergence...</span>
          ) : (
            safeDiagnoses.map((diag, idx) => (
              <div 
                key={idx} 
                onClick={() => handleSelect(diag)}
                className={`p-3 rounded-md border transition-all cursor-pointer ${
                  selectedDiagnosisId === (diag.id || diag.condition) 
                    ? 'bg-slate-700 border-emerald-500 shadow-md' 
                    : 'bg-slate-800 border-slate-700 hover:bg-slate-700/50'
                }`}
              >
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-200">{diag.condition}</span>
                  <div className="flex items-center gap-2">
                    {/* Status Dot based on Backend Urgency */}
                    {diag.urgency && (
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: getPriorityColor(diag.urgency) }}
                      ></span>
                    )}
                    <span className="text-emerald-400 font-bold">{diag.confidence}% Match</span>
                  </div>
                </div>
                
                {/* Progress Bar Container */}
                <div className="w-full bg-slate-900 rounded-full h-2.5 mb-2 overflow-hidden shadow-inner">
                  <div 
                    className="h-2.5 rounded-full transition-all duration-700 ease-out relative" 
                    style={{ 
                      width: `${diag.confidence}%`, 
                      backgroundColor: getPriorityColor(diag.urgency) 
                    }}
                  >
                    <div className="absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>
                
                {/* Supporting Evidence */}
                <div className="text-xs text-slate-400 flex items-start gap-1 mt-2">
                  <span className="text-slate-500 font-semibold">Evidence:</span> 
                  <span>{diag.matched_symptoms?.join(', ')}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
