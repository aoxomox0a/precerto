import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  doctors as initialDoctors,
  patients as initialPatients,
  forms as initialForms,
  formResponses as initialResponses,
  consultations as initialConsultations,
  notifications as initialNotifications,
} from '../services/mockData'
import {
  createConsultation as apiCreateConsultation,
  createForm as apiCreateForm,
  createPatientForm as apiCreatePatientForm,
  endConsultationSession as apiEndConsultationSession,
  deleteForm as apiDeleteForm,
  listConsultations,
  listForms,
  listPatients,
  listPatientForms,
  saveConsultationResults as apiSaveConsultationResults,
  startConsultationSession as apiStartConsultationSession,
  submitPatientFormResponse as apiSubmitPatientFormResponse,
  updateConsultation as apiUpdateConsultation,
  updatePatient as apiUpdatePatient,
  uploadConsultationRecording as apiUploadConsultationRecording,
  upsertPatientFormResponse as apiUpsertPatientFormResponse,
  updateForm as apiUpdateForm,
} from '../services/api'

const AppContext = createContext(null)

const loadStoredState = (key, fallback) => {
  try {
    const storedValue = window.localStorage.getItem(`precerto-${key}`)
    return storedValue ? JSON.parse(storedValue) : fallback
  } catch {
    return fallback
  }
}

const mapPatientFromApi = (patient) => ({
  id: `pat-${patient.id}`,
  name: patient.name,
  age: patient.age,
  email: patient.email,
  medicalHistory: patient.medical_history ? [patient.medical_history] : [],
  assignedDoctorIds: [],
  city: patient.city || '',
  latitude: patient.latitude ?? null,
  longitude: patient.longitude ?? null,
  locationSource: patient.location_source || null,
  backendId: patient.id,
  createdAt: patient.created_at,
})

const mapFormFromApi = (form) => ({
  id: `form-${form.id}`,
  title: form.title,
  description: form.description || '',
  category: form.category || 'General',
  createdBy: form.created_by || 'system',
  createdAt: form.created_at,
  questions: (() => {
    if (Array.isArray(form.questions)) return form.questions
    if (!form.questions_json) return []
    try {
      const parsed = JSON.parse(form.questions_json)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })(),
  backendId: form.id,
})

const mapPatientFormFromApi = (patientForm) => {
  const responses = (() => {
    if (patientForm.responses && typeof patientForm.responses === 'object') {
      return patientForm.responses
    }

    if (!patientForm.responses_json) {
      return {}
    }

    try {
      const parsed = JSON.parse(patientForm.responses_json)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  })()

  return {
    id: `resp-${patientForm.id}`,
    backendId: patientForm.id,
    formId: patientForm.form_id ? `form-${patientForm.form_id}` : null,
    patientId: patientForm.patient_id ? `pat-${patientForm.patient_id}` : null,
    doctorId: patientForm.doctor_id || null,
    patientName: patientForm.patient_name || '',
    status: patientForm.status || 'pending',
    progress: patientForm.progress ?? 0,
    responses,
    assignedAt: patientForm.created_at,
    completedAt: patientForm.completed_at,
  }
}

const mapConsultationFromApi = (consultation) => ({
  id: `cons-${consultation.id}`,
  backendId: consultation.id,
  patientId: consultation.patient_id
    ? String(consultation.patient_id).startsWith('pat-')
      ? String(consultation.patient_id)
      : `pat-${consultation.patient_id}`
    : null,
  doctorId: consultation.doctor_id,
  title: consultation.title,
  scheduledFor: consultation.scheduled_for,
  status: consultation.status || 'scheduled',
  notes: consultation.notes || '',
  resultsJson: consultation.results_json || null,
  results: (() => {
    if (!consultation.results_json) return null
    try {
      return JSON.parse(consultation.results_json)
    } catch {
      return null
    }
  })(),
  startedAt: consultation.started_at,
  endedAt: consultation.ended_at,
  recordingFilePath: consultation.recording_file_path,
  recordingUrl: consultation.recording_url || (consultation.recording_file_path ? `/api/consultations/${consultation.id}/recording` : null),
  recordingOriginalName: consultation.recording_original_name,
  recordingMimeType: consultation.recording_mime_type,
  recordingSizeBytes: consultation.recording_size_bytes,
  recordingDurationSeconds: consultation.recording_duration_seconds,
  recordingSampleRate: consultation.recording_sample_rate,
  recordingChannels: consultation.recording_channels,
  createdAt: consultation.created_at,
  updatedAt: consultation.updated_at,
})

const mapConsultationResultsBundle = (bundle) => ({
  consultation: mapConsultationFromApi(bundle.consultation),
  result: bundle.result || null,
  transcriptSegments: bundle.transcript_segments || [],
  entities: bundle.entities || [],
  reasoningPaths: bundle.reasoning_paths || [],
})

const upsertConsultationHistoryRecord = (record) => {
  try {
    const existing = JSON.parse(window.localStorage.getItem('precerto_consultation_history') || '[]')
    const next = [
      record,
      ...existing.filter((item) => String(item.consultationId) !== String(record.consultationId)),
    ]
    window.localStorage.setItem('precerto_consultation_history', JSON.stringify(next))
  } catch {
    // Ignore localStorage failures; the backend consultation record remains the source of truth.
  }
}

export const AppProvider = ({ children }) => {
  const [patients, setPatients] = useState(() => loadStoredState('patients-v2', initialPatients))
  const [selectedPatientId, setSelectedPatientId] = useState(() =>
    loadStoredState('selected-patient-id', null)
  )
  const [doctors, setDoctors] = useState(() => loadStoredState('doctors', initialDoctors))
  const [forms, setForms] = useState(() => loadStoredState('forms', initialForms))
  const [formResponses, setFormResponses] = useState(() =>
    loadStoredState('form-responses-v2', initialResponses)
  )
  const [consultations, setConsultations] = useState(() =>
    loadStoredState('consultations', initialConsultations)
  )
  const [notifications, setNotifications] = useState(() =>
    loadStoredState('notifications', initialNotifications)
  )

  const refreshPatients = useCallback(async (params = {}) => {
    const apiPatients = await listPatients(params)
    setPatients((prev) =>
      apiPatients.map((patient) => {
        const mapped = mapPatientFromApi(patient)
        const previous = prev.find(
          (item) => item.backendId === mapped.backendId || item.id === mapped.id
        )

        if (!previous) return mapped

        return {
          ...previous,
          ...mapped,
          city: mapped.city || previous.city || '',
          latitude: mapped.latitude ?? previous.latitude ?? null,
          longitude: mapped.longitude ?? previous.longitude ?? null,
          locationSource: mapped.locationSource || previous.locationSource || null,
        }
      })
    )
  }, [])

  const refreshForms = useCallback(async () => {
    const apiForms = await listForms()
    setForms(apiForms.map(mapFormFromApi))
  }, [])

  const refreshPatientForms = useCallback(async (params = {}) => {
    const apiPatientForms = await listPatientForms(params)
    setFormResponses(apiPatientForms.map(mapPatientFormFromApi))
  }, [])

  const refreshConsultations = useCallback(async (params = {}) => {
    const apiConsultations = await listConsultations(params)
    setConsultations((prev) =>
      apiConsultations.map((consultation) => {
        const mapped = mapConsultationFromApi(consultation)
        const previous = prev.find(
          (item) => item.backendId === mapped.backendId || item.id === mapped.id
        )

        if (!previous) return mapped

        const previousScheduled = previous.scheduledFor ? new Date(previous.scheduledFor) : null
        const mappedScheduled = mapped.scheduledFor ? new Date(mapped.scheduledFor) : null
        const shouldPreserveFutureSchedule =
          mapped.status === 'scheduled' &&
          previousScheduled &&
          !Number.isNaN(previousScheduled.getTime()) &&
          previousScheduled.getTime() > Date.now() &&
          (!mappedScheduled || Number.isNaN(mappedScheduled.getTime()) || mappedScheduled.getTime() < previousScheduled.getTime())

        return {
          ...previous,
          ...mapped,
          scheduledFor: shouldPreserveFutureSchedule ? previous.scheduledFor : mapped.scheduledFor || previous.scheduledFor,
        }
      })
    )
  }, [])

  const refreshCoreData = useCallback(async () => {
    await Promise.all([refreshPatients(), refreshForms(), refreshPatientForms(), refreshConsultations()])
  }, [refreshPatients, refreshForms, refreshPatientForms, refreshConsultations])

  useEffect(() => {
    refreshCoreData().catch(() => {})
  }, [])

  useEffect(() => {
    const handleStorageSync = (event) => {
      if (!event.key?.startsWith('precerto-') || !event.newValue) return

      try {
        const nextValue = JSON.parse(event.newValue)

        switch (event.key) {
          case 'precerto-patients-v2':
            setPatients(nextValue)
            break
          case 'precerto-doctors':
            setDoctors(nextValue)
            break
          case 'precerto-forms':
            setForms(nextValue)
            break
          case 'precerto-form-responses-v2':
            setFormResponses(nextValue)
            break
          case 'precerto-consultations':
            setConsultations(nextValue)
            break
          case 'precerto-notifications':
            setNotifications(nextValue)
            break
          default:
            break
        }
      } catch {
        // Ignore malformed localStorage values from manual edits.
      }
    }

    window.addEventListener('storage', handleStorageSync)
    return () => window.removeEventListener('storage', handleStorageSync)
  }, [])

  useEffect(() => {
    window.localStorage.setItem('precerto-patients-v2', JSON.stringify(patients))
  }, [patients])

  useEffect(() => {
    window.localStorage.setItem('precerto-selected-patient-id', JSON.stringify(selectedPatientId))
  }, [selectedPatientId])

  useEffect(() => {
    window.localStorage.setItem('precerto-doctors', JSON.stringify(doctors))
  }, [doctors])

  useEffect(() => {
    window.localStorage.setItem('precerto-forms', JSON.stringify(forms))
  }, [forms])

  useEffect(() => {
    window.localStorage.setItem('precerto-form-responses-v2', JSON.stringify(formResponses))
  }, [formResponses])

  useEffect(() => {
    window.localStorage.setItem('precerto-consultations', JSON.stringify(consultations))
  }, [consultations])

  useEffect(() => {
    window.localStorage.setItem('precerto-notifications', JSON.stringify(notifications))
  }, [notifications])

  const getPatientById = (id) => patients.find((patient) => patient.id === id)
  const getDoctorById = (id) => doctors.find((doctor) => doctor.id === id)
  const getFormById = (id) => forms.find((form) => form.id === id)
  const getResponseById = (id) => formResponses.find((response) => response.id === id)
  const getConsultationById = (id) => consultations.find((consultation) => consultation.id === id || consultation.backendId === id)

  const getPatientDoctors = (patientId) => {
    const patient = getPatientById(patientId)
    return patient ? doctors.filter((doctor) => patient.assignedDoctorIds.includes(doctor.id)) : []
  }

  const getDoctorPatients = (doctorId) =>
    patients.filter((patient) => {
      if (!patient) return false
      // If a patient has no assigned doctors, treat them as visible/unassigned so doctors can see and claim them
      if (!patient.assignedDoctorIds || patient.assignedDoctorIds.length === 0) return true
      return patient.assignedDoctorIds.includes(doctorId)
    })

  const getPatientFormResponses = (patientId) =>
    formResponses.filter((response) => response.patientId === patientId)

  const getDoctorFormResponses = (doctorId) =>
    formResponses.filter((response) => response.doctorId === doctorId)

  const getDoctorForms = (doctorId) => {
    return forms.filter((form) => {
      if (!form || !form.createdBy) return true
      if (form.createdBy === doctorId) return true
      if (form.createdBy === 'system') return true
      // Treat non-doctor creators (seed-script, system templates, etc.) as available to doctors
      if (!String(form.createdBy).startsWith('doc-')) return true
      return false
    })
  }

  const getDoctorConsultations = (doctorId) =>
    consultations.filter((consultation) => consultation.doctorId === doctorId)

  const getPatientConsultations = (patientId) =>
    consultations.filter((consultation) => consultation.patientId === patientId)

  const getNotificationsForUser = (userId) =>
    notifications.filter((notification) => notification.userId === userId)

  const markNotificationRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === notificationId ? { ...item, read: true } : item))
    )
  }

  const updateFormResponse = (updatedResponse) => {
    // Optimistic update: write to local state immediately so both portals
    // see the change via localStorage sync even if the backend is offline.
    setFormResponses((prev) => {
      const withoutCurrent = prev.filter((item) => {
        if (item.id === updatedResponse.id) return false
        if (updatedResponse.backendId != null && item.backendId === updatedResponse.backendId) return false
        return true
      })
      return [{ ...updatedResponse }, ...withoutCurrent]
    })

    const persistResponse = async () => {
      const backendId = updatedResponse.backendId || null
      const payload = {
        patient_id: Number(String(updatedResponse.patientId).replace('pat-', '')),
        form_id: Number(String(updatedResponse.formId).replace('form-', '')),
        doctor_id: updatedResponse.doctorId || null,
        patient_name: updatedResponse.patientName || '',
        subjective_text: updatedResponse.subjectiveText || '',
        extracted_symptoms_json: updatedResponse.extractedSymptomsJson || null,
        responses_json: JSON.stringify(updatedResponse.responses || {}),
        status: updatedResponse.status || 'completed',
        progress: updatedResponse.progress ?? 100,
      }

      try {
        const savedResponse = backendId
          ? await apiSubmitPatientFormResponse(backendId, payload)
          : await apiUpsertPatientFormResponse(payload)

        // Replace optimistic entry with server-confirmed entry (has real backendId)
        setFormResponses((prev) => {
          const mapped = mapPatientFormFromApi(savedResponse)
          const withoutCurrent = prev.filter(
            (item) => item.backendId !== mapped.backendId && item.id !== mapped.id && item.id !== updatedResponse.id
          )
          return [mapped, ...withoutCurrent]
        })
      } catch (error) {
        // Backend unavailable — optimistic local entry already saved to localStorage.
        // Doctor portal will pick it up via the storage event.
        console.warn('Backend unavailable, form response saved locally only.', error)
      }

      const existing = notifications.find(
        (note) => note.userId === updatedResponse.doctorId && note.title.includes('Patient progress')
      )
      if (!existing) {
        setNotifications((prev) => [
          {
            id: `note-${Date.now()}`,
            userId: updatedResponse.doctorId,
            title: 'Patient progress',
            message: `A patient updated their form status to ${updatedResponse.status}.`,
            type: 'success',
            read: false,
          },
          ...prev,
        ])
      }
    }

    persistResponse().catch((error) => {
      console.error('Unexpected error in persistResponse', error)
    })
  }

  const addPatient = (newPatient) => {
    setPatients((prev) => [...prev, newPatient])
  }

  const updatePatient = useCallback(async (updatedPatient) => {
    const backendId = updatedPatient.backendId || Number(String(updatedPatient.id).replace('pat-', ''))
    if (!backendId) {
      throw new Error('Missing backend patient id')
    }

    const payload = {}
    if (updatedPatient.name !== undefined) payload.name = updatedPatient.name
    if (updatedPatient.email !== undefined) payload.email = updatedPatient.email
    if (updatedPatient.age !== undefined) payload.age = updatedPatient.age
    if (updatedPatient.gender !== undefined) payload.gender = updatedPatient.gender
    if (updatedPatient.medicalHistory !== undefined) {
      payload.medical_history = Array.isArray(updatedPatient.medicalHistory)
        ? updatedPatient.medicalHistory.join('; ')
        : updatedPatient.medicalHistory
    }
    if (updatedPatient.city !== undefined) payload.city = updatedPatient.city
    if (updatedPatient.latitude !== undefined) payload.latitude = updatedPatient.latitude
    if (updatedPatient.longitude !== undefined) payload.longitude = updatedPatient.longitude
    if (updatedPatient.locationSource !== undefined) payload.location_source = updatedPatient.locationSource

    const savedPatient = await apiUpdatePatient(backendId, payload)
    const mapped = mapPatientFromApi(savedPatient)

    setPatients((prev) => prev.map((item) => (item.backendId === mapped.backendId ? mapped : item)))
    return mapped
  }, [])

  const deletePatient = (patientId) => {
    setPatients((prev) => prev.filter((patient) => patient.id !== patientId))
    setFormResponses((prev) => prev.filter((response) => response.patientId !== patientId))
  }

  const createForm = useCallback(
    async (newForm) => {
      await apiCreateForm(newForm)
      await refreshForms()
    },
    [refreshForms]
  )

  const updateForm = useCallback(
    async (updatedForm) => {
      const backendId = updatedForm.backendId || Number(String(updatedForm.id).replace('form-', ''))
      if (!backendId) {
        await apiCreateForm(updatedForm)
        await refreshForms()
        return
      }

      try {
        await apiUpdateForm(backendId, updatedForm)
      } catch (error) {
        const isMissingRemoteForm =
          error.message?.includes('Not Found') || error.message?.includes('Form not found')

        if (!isMissingRemoteForm) {
          throw error
        }

        await apiCreateForm(updatedForm)
      }

      await refreshForms()
    },
    [refreshForms]
  )

  const deleteForm = useCallback(
    async (formId) => {
      const backendId = Number(String(formId).replace('form-', ''))
      if (!backendId) {
        throw new Error('Missing backend form id')
      }

      await apiDeleteForm(backendId)
      setFormResponses((prev) => prev.filter((response) => response.formId !== formId))
      await refreshForms()
    },
    [refreshForms]
  )

  const assignFormToPatient = useCallback(async (assignment, legacyFormId, legacyDoctorId) => {
    const normalizedAssignment =
      typeof assignment === 'object'
        ? assignment
        : {
            patientId: assignment,
            formId: legacyFormId,
            doctorId: legacyDoctorId,
          }

    const { formId, patientId } = normalizedAssignment
    const form = getFormById(formId)
    const patient = getPatientById(patientId)
    const doctorId = normalizedAssignment.doctorId || form?.createdBy
    const doctor = getDoctorById(doctorId)

    if (!formId || !patientId) return

    const backendFormId = Number(String(formId).replace('form-', ''))
    const backendPatientId = Number(String(patientId).replace('pat-', ''))

    if (!backendFormId || !backendPatientId) {
      throw new Error('Missing backend ids for assignment')
    }

    // Optimistic local assignment so the form appears immediately even if offline
    const optimisticId = `resp-local-${Date.now()}`
    setFormResponses((prev) => {
      const alreadyExists = prev.some(
        (r) => r.formId === formId && r.patientId === patientId
      )
      if (alreadyExists) return prev
      return [
        {
          id: optimisticId,
          backendId: null,
          formId,
          patientId,
          doctorId: doctorId || null,
          patientName: patient?.name || 'Assigned patient',
          status: 'pending',
          progress: 0,
          responses: {},
          assignedAt: new Date().toISOString(),
          completedAt: null,
        },
        ...prev,
      ]
    })

    setNotifications((prev) => [
      {
        id: `note-${Date.now()}`,
        userId: patientId,
        title: 'New form assigned',
        message: `${doctor ? doctor.name : 'Your doctor'} assigned "${form?.title || 'a new form'}".`,
        type: 'info',
        read: false,
      },
      ...prev,
    ])

    try {
      const savedResponse = await apiCreatePatientForm({
        patient_id: backendPatientId,
        form_id: backendFormId,
        doctor_id: doctorId || null,
        patient_name: patient?.name || 'Assigned patient',
        subjective_text: '',
        extracted_symptoms_json: JSON.stringify({
          assignment: true,
          assignedBy: doctorId,
        }),
        responses_json: JSON.stringify({}),
        status: 'pending',
        progress: 0,
      })

      // Replace optimistic entry with server-confirmed entry
      const mapped = mapPatientFormFromApi(savedResponse)
      setFormResponses((prev) => {
        const withoutOptimistic = prev.filter((r) => r.id !== optimisticId)
        const alreadyHas = withoutOptimistic.some((r) => r.backendId === mapped.backendId)
        if (alreadyHas) return withoutOptimistic
        return [mapped, ...withoutOptimistic]
      })
    } catch (error) {
      // Backend unavailable — optimistic assignment already visible via localStorage.
      console.warn('Backend unavailable, form assignment saved locally only.', error)
    }
  }, [getDoctorById, getFormById, getPatientById])

  const addConsultation = useCallback(
    async (consultation) => {
      const payload = {
        patient_id: consultation.patientId,
        doctor_id: consultation.doctorId,
        title: consultation.title,
        scheduled_for: consultation.scheduledFor || null,
        status: consultation.status || 'scheduled',
        notes: consultation.notes || null,
      }

      const savedConsultation = await apiCreateConsultation(payload)
      const mapped = mapConsultationFromApi(savedConsultation)

      setConsultations((prev) => {
        const withoutDuplicate = prev.filter((item) => item.backendId !== mapped.backendId)
        return [mapped, ...withoutDuplicate]
      })

      const doctor = getDoctorById(mapped.doctorId)
      setNotifications((prev) => [
        {
          id: `note-${Date.now()}`,
          userId: mapped.patientId,
          title: 'Consultation scheduled',
          message: `${doctor ? doctor.name : 'Your doctor'} scheduled "${mapped.title}".`,
          type: 'info',
          read: false,
        },
        ...prev,
      ])

      return mapped
    },
    [getDoctorById]
  )

  const updateConsultation = useCallback(async (updatedConsultation) => {
    const backendId =
      updatedConsultation.backendId || Number(String(updatedConsultation.id).replace('cons-', ''))

    if (!backendId) {
      throw new Error('Missing backend consultation id')
    }

    const payload = {}
    if (updatedConsultation.title !== undefined) payload.title = updatedConsultation.title
    if (updatedConsultation.scheduledFor !== undefined) payload.scheduled_for = updatedConsultation.scheduledFor
    if (updatedConsultation.status !== undefined) payload.status = updatedConsultation.status
    if (updatedConsultation.notes !== undefined) payload.notes = updatedConsultation.notes
    if (updatedConsultation.resultsJson !== undefined) payload.results_json = updatedConsultation.resultsJson
    if (updatedConsultation.startedAt !== undefined) payload.started_at = updatedConsultation.startedAt
    if (updatedConsultation.endedAt !== undefined) payload.ended_at = updatedConsultation.endedAt

    const savedConsultation = await apiUpdateConsultation(backendId, payload)
    const mapped = mapConsultationFromApi(savedConsultation)

    setConsultations((prev) =>
      prev.map((item) => (item.backendId === mapped.backendId ? mapped : item))
    )

    return mapped
  }, [])

  const startConsultationSession = useCallback(async (consultation) => {
    const backendId = consultation.backendId || Number(String(consultation.id).replace('cons-', ''))
    if (!backendId) {
      throw new Error('Missing backend consultation id')
    }

    await apiStartConsultationSession(backendId)
    return updateConsultation({
      ...consultation,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      backendId,
    })
  }, [updateConsultation])

  const endConsultationSession = useCallback(async (consultation) => {
    const backendId = consultation.backendId || Number(String(consultation.id).replace('cons-', ''))
    if (!backendId) {
      throw new Error('Missing backend consultation id')
    }

    await apiEndConsultationSession(backendId)
    return updateConsultation({
      ...consultation,
      status: 'completed',
      endedAt: new Date().toISOString(),
      backendId,
    })
  }, [updateConsultation])

  const uploadConsultationAudio = useCallback(async (consultation, recordingData) => {
    const backendId = consultation.backendId || Number(String(consultation.id).replace('cons-', ''))
    if (!backendId) {
      throw new Error('Missing backend consultation id')
    }

    const savedConsultation = await apiUploadConsultationRecording(backendId, {
      blob: recordingData.blob,
      fileName: `consultation-${backendId}.pcm`,
      durationSeconds: recordingData.duration,
      sampleRate: recordingData.sampleRate,
      channels: recordingData.channels,
    })

    const mapped = mapConsultationFromApi(savedConsultation)
    setConsultations((prev) =>
      prev.map((item) => (item.backendId === mapped.backendId ? mapped : item))
    )

    return mapped
  }, [])

  const saveConsultationResults = useCallback(async (consultation, recordingData, analysisData) => {
    const backendId = consultation.backendId || Number(String(consultation.id).replace('cons-', ''))
    if (!backendId) {
      throw new Error('Missing backend consultation id')
    }

    let consultationWithRecording = consultation
    if (recordingData?.blob) {
      consultationWithRecording = await uploadConsultationAudio(consultationWithRecording, recordingData)
    }

    const patient = getPatientById(consultationWithRecording.patientId)
    const doctor = getDoctorById(consultationWithRecording.doctorId)
    const resultsPayload = {
      consultationId: consultationWithRecording.id,
      backendId: consultationWithRecording.backendId,
      status: 'completed',
      savedAt: new Date().toISOString(),
      consultationMeta: {
        title: consultationWithRecording.title,
        scheduledFor: consultationWithRecording.scheduledFor,
        startedAt: consultationWithRecording.startedAt,
        endedAt: consultationWithRecording.endedAt || new Date().toISOString(),
      },
      doctor: {
        id: consultationWithRecording.doctorId,
        name: doctor?.name || null,
        specialty: doctor?.specialty || null,
      },
      patient: {
        id: consultationWithRecording.patientId,
        name: analysisData?.patientName || patient?.name || null,
        age: patient?.age ?? null,
        email: patient?.email || null,
      },
      recording: {
        filePath: consultationWithRecording.recordingFilePath || null,
        originalName: recordingData?.fileName || consultationWithRecording.recordingOriginalName || null,
        mimeType: consultationWithRecording.recordingMimeType || 'audio/raw',
        durationSeconds: recordingData?.duration ?? consultationWithRecording.recordingDurationSeconds ?? null,
        sampleRate: recordingData?.sampleRate ?? consultationWithRecording.recordingSampleRate ?? null,
        channels: recordingData?.channels ?? consultationWithRecording.recordingChannels ?? null,
      },
      transcript: {
        text: analysisData?.transcriptText || analysisData?.liveText || '',
        chunks: analysisData?.transcriptChunks || [],
      },
      analysis: {
        tags: analysisData?.tags || [],
        entities: analysisData?.entities || [],
        reasoning: analysisData?.reasoning || { suggestions: [], reasoning_path: [] },
        summary: analysisData?.summary || null,
      },
    }

    const savedBundle = await apiSaveConsultationResults(backendId, resultsPayload)
    const mappedBundle = mapConsultationResultsBundle(savedBundle)

    setConsultations((prev) =>
      prev.map((item) => (item.backendId === mappedBundle.consultation.backendId ? mappedBundle.consultation : item))
    )

    upsertConsultationHistoryRecord({
      id: `saved-${mappedBundle.consultation.id}`,
      consultationId: mappedBundle.consultation.id,
      backendId: mappedBundle.consultation.backendId,
      patientId: mappedBundle.consultation.patientId,
      doctorId: mappedBundle.consultation.doctorId,
      patientName: mappedBundle.result?.patient?.name || patient?.name || 'Unknown Patient',
      date: mappedBundle.result?.saved_at || mappedBundle.result?.savedAt || mappedBundle.consultation.endedAt || mappedBundle.consultation.updatedAt || mappedBundle.consultation.createdAt,
      savedAt: mappedBundle.result?.saved_at || mappedBundle.result?.savedAt || null,
      duration: mappedBundle.result?.recording?.durationSeconds ?? mappedBundle.consultation.recordingDurationSeconds ?? 0,
      tags: mappedBundle.result?.analysis?.tags || [],
      summary: mappedBundle.result?.analysis?.summary || null,
      hasPersistedResults: true,
      fromBackend: true,
    })

    return mappedBundle
  }, [getDoctorById, getPatientById, uploadConsultationAudio])

  const contextValue = useMemo(
    () => ({
      patients,
      selectedPatientId,
      setSelectedPatientId,
      doctors,
      forms,
      formResponses,
      consultations,
      notifications,
      getPatientById,
      getDoctorById,
      getFormById,
      getResponseById,
      getConsultationById,
      getPatientDoctors,
      getDoctorPatients,
      getPatientFormResponses,
      getDoctorFormResponses,
      getDoctorForms,
      getDoctorConsultations,
      getPatientConsultations,
      getNotificationsForUser,
      markNotificationRead,
      updatePatient,
      updateFormResponse,
      refreshPatients,
      refreshForms,
      refreshPatientForms,
      refreshConsultations,
      refreshCoreData,
      addPatient,
      deletePatient,
      createForm,
      updateForm,
      deleteForm,
      assignFormToPatient,
      addConsultation,
      updateConsultation,
      startConsultationSession,
      endConsultationSession,
      uploadConsultationAudio,
      saveConsultationResults,
    }),
    [
      patients,
      selectedPatientId,
      doctors,
      forms,
      formResponses,
      consultations,
      notifications,
      getConsultationById,
      refreshPatients,
      refreshForms,
      refreshPatientForms,
      refreshConsultations,
      refreshCoreData,
      createForm,
      updateForm,
      deleteForm,
      assignFormToPatient,
      updateFormResponse,
      markNotificationRead,
      updatePatient,
      addConsultation,
      updateConsultation,
      startConsultationSession,
      endConsultationSession,
      uploadConsultationAudio,
      saveConsultationResults,
    ]
  )

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
}

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}
