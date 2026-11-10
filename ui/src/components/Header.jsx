import React from 'react'
import './Header.css'

export default function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-section">
          <h1 className="logo">🏥 Precerto</h1>
          <p className="tagline">Clinical Diagnostic Decision Support System</p>
        </div>
        <div className="header-info">
          <p className="info-text">AI-Powered Clinical Decision Support</p>
        </div>
      </div>
    </header>
  )
}
