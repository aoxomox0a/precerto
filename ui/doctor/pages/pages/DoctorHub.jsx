import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../../../src/store/AppProvider'
import { usePullToRefresh } from '../../../src/hooks/usePullToRefresh'
import { PatientListView } from './PatientListView'
import { DoctorFormManagement } from './FormManagement'
import { DoctorConsultations } from './Consultations'
import { ConsultationHistory } from './ConsultationHistory'
import appLogo from '../../../src/assets/app-logo.png'
import './doctor-pages.css'

const TABS = ['Overview', 'Patients', 'Forms', 'Consultations', 'History']

export const DoctorHub = () => {
  const {
    doctors,
    getNotificationsForUser,
    markNotificationRead,
    getDoctorPatients,
    getDoctorFormResponses,
    getDoctorConsultations,
    refreshPatients,
    refreshForms,
    refreshConsultations,
    refreshCoreData,
  } = useAppContext()

  const navigate = useNavigate()
  const [selectedDoctor, setSelectedDoctor] = useState(doctors[0])
  const [activeTab, setActiveTab] = useState('Overview')
  const [showNotifications, setShowNotifications] = useState(false)
  const mainContentRef = useRef(null)
  const contentAreaRef = useRef(null)
  const scrollPositionsRef = useRef({})
  const { isRefreshing, pullDistance, status: pullStatus, pullHandlers } = usePullToRefresh(
    [mainContentRef, contentAreaRef],
    refreshCoreData
  )

  const userNotifications = selectedDoctor ? getNotificationsForUser(selectedDoctor.id) : []
  const unreadCount = userNotifications.filter((n) => !n.read).length

  const getScrollSnapshot = () => ({
    contentArea: contentAreaRef.current?.scrollTop || 0,
    mainContent: mainContentRef.current?.scrollTop || 0,
    window: window.scrollY || 0,
    scrollingElement: document.scrollingElement?.scrollTop || 0,
    documentElement: document.documentElement.scrollTop || 0,
    body: document.body.scrollTop || 0,
  })

  const applyScrollSnapshot = (snapshot) => {
    const next = snapshot || {}
    const contentAreaTop = next.contentArea || 0
    const mainContentTop = next.mainContent || 0
    const windowTop = next.window || next.scrollingElement || next.documentElement || next.body || 0

    if (contentAreaRef.current) contentAreaRef.current.scrollTop = contentAreaTop
    if (mainContentRef.current) mainContentRef.current.scrollTop = mainContentTop
    if (document.scrollingElement) document.scrollingElement.scrollTop = windowTop
    document.documentElement.scrollTop = windowTop
    document.body.scrollTop = windowTop
    window.scrollTo(0, windowTop)
  }

  const saveScrollPosition = (key = activeTab) => {
    scrollPositionsRef.current[key] = getScrollSnapshot()
  }

  useLayoutEffect(() => {
    const nextSnapshot = scrollPositionsRef.current[activeTab] || {
      contentArea: 0,
      mainContent: 0,
      window: 0,
      scrollingElement: 0,
      documentElement: 0,
      body: 0,
    }

    applyScrollSnapshot(nextSnapshot)
    requestAnimationFrame(() => {
      applyScrollSnapshot(nextSnapshot)
    })
  }, [activeTab])

  useEffect(() => {
    if ((!selectedDoctor || !selectedDoctor.id) && doctors.length > 0) {
      setSelectedDoctor(doctors[0])
    }
  }, [doctors, selectedDoctor])

  useEffect(() => {
    if (!selectedDoctor?.id) return

    const reloadActiveTabData = async () => {
      if (activeTab === 'Overview') {
        await Promise.all([refreshPatients(), refreshForms(), refreshConsultations()])
        return
      }

      if (activeTab === 'Patients') {
        await refreshPatients()
      }

      if (activeTab === 'Forms') {
        await refreshForms()
      }

      if (activeTab === 'Consultations' || activeTab === 'History') {
        await refreshConsultations()
      }
    }

    reloadActiveTabData().catch(() => {})
  }, [activeTab, selectedDoctor?.id, refreshPatients, refreshForms, refreshConsultations])

  const stats = {
    patients: selectedDoctor ? getDoctorPatients(selectedDoctor.id).length : 0,
    activeResponses: selectedDoctor ? getDoctorFormResponses(selectedDoctor.id).filter(
      (r) => r.status !== 'completed'
    ).length : 0,
    upcomingConsultations: selectedDoctor ? getDoctorConsultations(selectedDoctor.id).filter(
      (c) => c.status === 'scheduled'
    ).length : 0,
  }

  return (
    <div className="doctor-hub">
      <div className="main-content" ref={mainContentRef}>
        <header
          className={`top-nav ${isRefreshing || pullDistance > 0 ? 'pull-refresh-active' : ''} pull-refresh-${pullStatus}`}
          style={{ '--pull-distance': `${Math.min(pullDistance, 72)}px` }}
        >
          <div className="nav-title">
            <img src={appLogo} alt="Precerto" className="portal-nav-logo" />
            <div>
              <h1>Doctor Dashboard</h1>
              <p>{selectedDoctor ? `${selectedDoctor.name} • ${selectedDoctor.specialty}` : 'No doctor selected'}</p>
            </div>
          </div>

          <div className="nav-actions">
            <div className="notification-bell">
              <button
                className="bell-icon"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                Alerts
                {unreadCount > 0 && <span className="badge-count">{unreadCount}</span>}
              </button>

              {showNotifications && (
                <div className="notifications-panel">
                  {userNotifications.length === 0 ? (
                    <p className="empty">No notifications</p>
                  ) : (
                    userNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`notification-item type-${notif.type} ${notif.read ? 'read' : ''}`}
                        onClick={() => markNotificationRead(notif.id)}
                      >
                        <strong>{notif.title}</strong>
                        <p>{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <select
              value={selectedDoctor?.id || ''}
              onChange={(e) => {
                const doctor = doctors.find((d) => d.id === e.target.value)
                setSelectedDoctor(doctor)
              }}
              className="doctor-selector"
              disabled={doctors.length === 0}
            >
              {doctors.length === 0 ? (
                <option value="">No doctors available</option>
              ) : (
                doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))
              )}
            </select>

            <button
              className="doctor-disconnect-btn"
              type="button"
              onClick={() => navigate('/')}
            >
              Disconnect
            </button>
          </div>
          <div
            className={`pull-refresh-indicator ${isRefreshing || pullDistance > 0 ? 'visible' : ''}`}
            aria-label={isRefreshing ? 'Refreshing' : 'Pull to refresh'}
          >
            <span className="pull-refresh-icon" aria-hidden="true" />
          </div>
        </header>

        <div className="tab-navigation">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              onClick={() => {
                saveScrollPosition()
                setActiveTab(tab)
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div key={activeTab} className="content-area" ref={contentAreaRef} {...pullHandlers}>
          {activeTab === 'Overview' && (
            <div className="overview-grid">
              <div className="stat-card">
                <h3>Total Patients</h3>
                <p className="stat-value">{stats.patients}</p>
              </div>
              <div className="stat-card">
                <h3>Pending Forms</h3>
                <p className="stat-value">{stats.activeResponses}</p>
              </div>
              <div className="stat-card">
                <h3>Upcoming</h3>
                <p className="stat-value">{stats.upcomingConsultations}</p>
              </div>
            </div>
          )}

          {activeTab === 'Patients' && (
            selectedDoctor && <PatientListView selectedDoctor={selectedDoctor} />
          )}

          {activeTab === 'Forms' && (
            selectedDoctor && <DoctorFormManagement selectedDoctor={selectedDoctor} />
          )}

          {activeTab === 'Consultations' && (
            selectedDoctor && <DoctorConsultations selectedDoctor={selectedDoctor} />
          )}

          {activeTab === 'History' && (
            <ConsultationHistory />
          )}
        </div>
      </div>
    </div>
  )
}

export default DoctorHub
