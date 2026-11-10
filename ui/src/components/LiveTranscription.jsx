import React, { useState } from 'react';
import './LiveTranscription.css';

export default function LiveTranscription({ transcripts = [], isRecording = false }) {
  const [tags, setTags] = useState([]);

  const fullText = transcripts.map(t => t.text).join(' ');

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (text) {
      setTags(prev => [...prev, { id: Date.now(), text, time: new Date().toLocaleTimeString() }]);
    }
  };

  return (
    <div className="live-transcription-container p-4 flex flex-col h-full">
      <div className="header mb-4 border-b pb-2">
        <h2 className="text-xl font-bold text-slate-800">Live Transcription</h2>
        <p className="text-sm text-slate-500">Highlight text to add clinical tags</p>
      </div>

      <div 
        className="transcription-box flex-1 min-h-[300px] p-4 bg-slate-50 border rounded-lg overflow-y-auto"
        onMouseUp={handleTextSelection}
      >
        {transcripts.length === 0 ? (
          <p className="text-slate-400 italic">
            {isRecording ? "Listening for audio..." : "Start recording to see live transcription."}
          </p>
        ) : (
          <p className="text-slate-800 leading-relaxed text-lg">
            {fullText}
          </p>
        )}
      </div>

      {tags.length > 0 && (
        <div className="tags-section mt-4">
          <h3 className="font-semibold text-sm mb-2 text-slate-600">Saved Tags:</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <span key={tag.id} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm shadow-sm flex items-center gap-2">
                "{tag.text}" 
                <button onClick={() => setTags(tags.filter(t => t.id !== tag.id))} className="text-indigo-400 hover:text-indigo-800">×</button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
