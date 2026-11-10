import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useAppContext } from '../../../src/store/AppProvider'
import { PatientDashboard } from './PatientDashboard'
import appLogo from '../../../src/assets/app-logo.png'
import './patient-pages.css'

const ENABLE_SCROLL_DEBUG = true

const navItems = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'consultations', label: 'Consultations', icon: 'consultations' },
  { id: 'profile', label: 'Profile', icon: 'profile' },
]

const TabIcon = ({ name }) => {
  if (name === 'profile') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="patient-nav-icon">
        <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
      </svg>
    )
  }

  if (name === 'consultations') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="patient-nav-icon">
        <path d="M7 4h10a2 2 0 0 1 2 2v10l-4-3H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm1 4h8v2H8Zm0 4h5v2H8Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="patient-nav-icon">
      <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" />
    </svg>
  )
}

export const PatientHub = () => {
  const {
    patients,
    selectedPatientId,
    setSelectedPatientId,
    getNotificationsForUser,
    markNotificationRead,
    refreshPatientForms,
    refreshConsultations,
    refreshPatients,
  } = useAppContext()
  const [showNotifications, setShowNotifications] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [selectedConsultation, setSelectedConsultation] = useState(null)
  const [isFormFlowActive, setIsFormFlowActive] = useState(false)
  const [consultationWeatherRevision, setConsultationWeatherRevision] = useState(0)
  const notificationsRef = useRef(null)
  const mainContentRef = useRef(null)
  const contentAreaRef = useRef(null)
  const tabViewportRef = useRef(null)
  const scrollPositionsRef = useRef({})
  const visitedViewsRef = useRef(new Set())
  const selectedPatient =
    patients.find((patient) => patient.id === selectedPatientId) || patients[0]

  const refreshTabData = useCallback(
    async (tabId) => {
      if (tabId === 'consultations') {
        if (!selectedPatientId) return
        try {
          await refreshConsultations({ patientId: selectedPatientId })
        } finally {
          setConsultationWeatherRevision((previous) => previous + 1)
        }
        return
      }

      if (tabId === 'profile') {
        if (!selectedPatientId) return
        await refreshPatients({ patientId: selectedPatientId })
        return
      }

      if (!selectedPatientId) return
      await refreshPatientForms({ patientId: selectedPatientId })
    },
    [refreshConsultations, refreshPatientForms, refreshPatients, selectedPatientId]
  )

  useEffect(() => {
    if (patients.length > 0 && (!selectedPatientId || !patients.some((patient) => patient.id === selectedPatientId))) {
      setSelectedPatientId(patients[0].id)
    }
  }, [patients, selectedPatientId, setSelectedPatientId])

  const userNotifications = selectedPatient ? getNotificationsForUser(selectedPatient.id) : []
  const viewKey = `${activeTab}${selectedConsultation ? `:${selectedConsultation.id}` : ''}`

  const getScrollMetrics = () => ({
    windowY: window.scrollY || 0,
    scrollingElementTop: document.scrollingElement?.scrollTop || 0,
    bodyTop: document.body?.scrollTop || 0,
    mainContentTop: mainContentRef.current?.scrollTop || 0,
    contentAreaTop: contentAreaRef.current?.scrollTop || 0,
    tabViewportTop: tabViewportRef.current?.scrollTop || 0,
  })

  const inferActiveScroller = (metrics) => {
    const candidates = [
      ['tabViewport', metrics.tabViewportTop],
      ['contentArea', metrics.contentAreaTop],
      ['mainContent', metrics.mainContentTop],
      ['scrollingElement', metrics.scrollingElementTop],
      ['window', metrics.windowY],
      ['body', metrics.bodyTop],
    ]

    candidates.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    return candidates[0][0]
  }

  const logScrollMetrics = (label) => {
    if (!ENABLE_SCROLL_DEBUG) return

    const metrics = getScrollMetrics()
    console.debug(`[PatientScroll] ${label}`, {
      ...metrics,
      inferredScroller: inferActiveScroller(metrics),
      activeTab,
      selectedConsultationId: selectedConsultation?.id || null,
      viewKey,
    })
  }

  const resetGlobalScroll = () => {
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0
    if (document.documentElement) document.documentElement.scrollTop = 0
    if (document.body) document.body.scrollTop = 0
    if (mainContentRef.current) mainContentRef.current.scrollTop = 0
    if (contentAreaRef.current) contentAreaRef.current.scrollTop = 0
    window.scrollTo(0, 0)
  }

  const saveCurrentViewScroll = (key = viewKey) => {
    scrollPositionsRef.current[key] = tabViewportRef.current?.scrollTop || 0
  }

  useLayoutEffect(() => {
    const hasVisitedView = visitedViewsRef.current.has(viewKey)
    const savedTop = scrollPositionsRef.current[viewKey] || 0
    const nextTop = hasVisitedView ? savedTop : 0

    logScrollMetrics(`before switch apply (${viewKey})`)
    resetGlobalScroll()
    if (tabViewportRef.current) tabViewportRef.current.scrollTop = nextTop

    requestAnimationFrame(() => {
      resetGlobalScroll()
      if (tabViewportRef.current) tabViewportRef.current.scrollTop = nextTop
      visitedViewsRef.current.add(viewKey)
      logScrollMetrics(`after switch apply (${viewKey})`)
    })
  }, [viewKey])

  useEffect(() => {
    if (!showNotifications) return undefined

    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  const scrollToTop = () => {
    const scrollOptions = { top: 0, left: 0, behavior: 'smooth' }

    tabViewportRef.current?.scrollTo(scrollOptions)
  }

  return (
    <div className={`patient-hub ${isFormFlowActive ? 'form-flow-active' : ''}`}>
      <aside className="patient-navigation" aria-label="Patient navigation">
        <div className="patient-navigation-brand">
          <div className="brand-mark">
            <img src={appLogo} alt="Precerto" className="portal-nav-logo" />
          </div>
          <div>
            <p className="brand-label">Precerto</p>
            <small>Patient Portal</small>
          </div>
        </div>

        <nav className="patient-navigation-list">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`patient-navigation-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                logScrollMetrics(`before tab switch (${activeTab} -> ${item.id})`)
                saveCurrentViewScroll()
                setActiveTab(item.id)
                if (item.id !== 'consultations') setSelectedConsultation(null)
                refreshTabData(item.id).catch(() => {})
              }}
            >
              <TabIcon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="main-content" ref={mainContentRef}>
        <header
          className="top-nav"
        >
          <div className="nav-title">
            <button
              className="top-nav-logo"
              type="button"
              aria-label="Scroll to top"
              onClick={scrollToTop}
            >
              <img src={appLogo} alt="Precerto" className="portal-nav-logo" />
            </button>
            <h1>Precerto</h1>
          </div>
          <div className="nav-actions">
            <div className="notification-bell" ref={notificationsRef}>
              <button
                className="bell-icon"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                🔔
                {userNotifications.filter((n) => !n.read).length > 0 && (
                  <span className="badge-count">
                    {userNotifications.filter((n) => !n.read).length}
                  </span>
                )}
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
          </div>
        </header>

        <div className="content-area" ref={contentAreaRef}>
          <div
            key={viewKey}
            className="tab-scroll-viewport"
            ref={tabViewportRef}
            onScroll={() => {
              saveCurrentViewScroll(viewKey)
            }}
          >
            {selectedPatient && (
              <PatientDashboard
                selectedPatient={selectedPatient}
                activeTab={activeTab}
                selectedConsultation={selectedConsultation}
                  consultationWeatherRevision={consultationWeatherRevision}
                setSelectedConsultation={(consultation) => {
                  saveCurrentViewScroll()
                  setSelectedConsultation(consultation)
                }}
                onFormFlowChange={(isInFormFlow) => {
                  setIsFormFlowActive(Boolean(isInFormFlow))
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientHub
