import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Sidebar.css'

const navItems = [
  { path: '/patient', label: 'Patient Dashboard', role: 'patient' },
  { path: '/doctor', label: 'Doctor Dashboard', role: 'doctor' },
]

export const Sidebar = ({ role }) => {
  const location = useLocation()

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">P</div>
        <div>
          <p className="brand-label">Precerto</p>
          <small>Clinical Support</small>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems
          .filter((item) => item.role === role)
          .map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
      </nav>
    </aside>
  )
}
