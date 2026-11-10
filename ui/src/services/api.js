export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    let detail = 'Request failed'
    try {
      const payload = await response.json()
      if (payload?.detail) {
        detail = typeof payload.detail === 'string'
          ? payload.detail
          : JSON.stringify(payload.detail)
      }
    } catch {
      // Keep generic detail when backend returns non-JSON body.
    }
    throw new Error(detail)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

function serializeFormPayload(formPayload = {}) {
  const { questions, createdBy, ...rest } = formPayload

  return {
    ...rest,
    created_by: createdBy !== undefined ? createdBy : rest.created_by,
    questions_json: questions ? JSON.stringify(questions) : formPayload.questions_json,
  }
}

export function listPatients(params = {}) {
  const searchParams = new URLSearchParams()
  if (params.patientId) {
    const backendPatientId = Number(String(params.patientId).replace('pat-', ''))
    if (Number.isFinite(backendPatientId) && backendPatientId > 0) {
      searchParams.set('patient_id', String(backendPatientId))
    }
  }

  const query = searchParams.toString()
  return request(`/api/patients${query ? `?${query}` : ''}`)
}

export function updatePatient(patientId, payload) {
  return request(`/api/patients/${patientId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function createPatient(patientPayload) {
  return request('/api/patients', {
    method: 'POST',
    body: JSON.stringify(patientPayload),
  })
}

export function listForms() {
  return request('/api/forms')
}

export function createForm(formPayload) {
  return request('/api/forms', {
    method: 'POST',
    body: JSON.stringify(serializeFormPayload(formPayload)),
  })
}

export function updateForm(formId, formPayload) {
  return request(`/api/forms/${formId}/update`, {
    method: 'PUT',
    body: JSON.stringify(serializeFormPayload(formPayload)),
  })
}

export function deleteForm(formId) {
  return request(`/api/forms/${formId}/delete`, {
    method: 'DELETE',
  })
}

export function createPatientForm(payload) {
  return request('/api/patient-forms', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function submitPatientFormResponse(patientFormId, payload) {
  return request(`/api/patient-forms/${patientFormId}/submit`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function upsertPatientFormResponse(payload) {
  return request('/api/patient-forms/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listPatientForms(params = {}) {
  const searchParams = new URLSearchParams()
  if (params.patientId) {
    const backendPatientId = Number(String(params.patientId).replace('pat-', ''))
    if (Number.isFinite(backendPatientId) && backendPatientId > 0) {
      searchParams.set('patient_id', String(backendPatientId))
    }
  }
  if (params.formId) searchParams.set('form_id', params.formId)
  const query = searchParams.toString()
  return request(`/api/patient-forms${query ? `?${query}` : ''}`)
}

export function listConsultations(params = {}) {
  const searchParams = new URLSearchParams()
  if (params.patientId) searchParams.set('patient_id', params.patientId)
  if (params.doctorId) searchParams.set('doctor_id', params.doctorId)
  if (params.status) searchParams.set('status', params.status)
  const query = searchParams.toString()
  return request(`/api/consultations${query ? `?${query}` : ''}`)
}
export function getConsultation(consultationId) {
  return request(`/api/consultations/${consultationId}`)
}

export function getWeatherForecast(params = {}) {
  const searchParams = new URLSearchParams()
  if (params.city) searchParams.set('city', params.city)
  if (params.latitude !== undefined && params.latitude !== null) searchParams.set('latitude', String(params.latitude))
  if (params.longitude !== undefined && params.longitude !== null) searchParams.set('longitude', String(params.longitude))
  if (params.label) searchParams.set('label', params.label)
  if (params.targetDatetime) searchParams.set('target_datetime', params.targetDatetime)
  const query = searchParams.toString()
  const url = `/api/weather/forecast${query ? `?${query}` : ''}`
  console.log('[api] getWeatherForecast', { url, params: Object.fromEntries(searchParams.entries()) })
  return request(url)
}

export function getConsultationResults(consultationId) {
  return request(`/api/consultations/${consultationId}/results`)
}

export function saveConsultationResults(consultationId, payload) {
  return request(`/api/consultations/${consultationId}/results`, {
    method: 'POST',
    body: JSON.stringify({ results: payload }),
  })
}

export function createConsultation(payload) {
  return request('/api/consultations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateConsultation(consultationId, payload) {
  return request(`/api/consultations/${consultationId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function startConsultationSession(consultationId) {
  return request(`/api/consultations/${consultationId}/start`, {
    method: 'POST',
  })
}

export function endConsultationSession(consultationId) {
  return request(`/api/consultations/${consultationId}/end`, {
    method: 'POST',
  })
}

export function diagnose(consultationId, transcribedText) {
  return request('/api/reasoning/diagnose', {
    method: 'POST',
    body: JSON.stringify({ consultation_id: consultationId, transcribed_text: transcribedText }),
  })
}

export async function uploadConsultationRecording(consultationId, payload) {
  const formData = new FormData()
  formData.append('audio', payload.blob, payload.fileName || `consultation-${consultationId}.pcm`)

  if (payload.durationSeconds !== undefined) {
    formData.append('duration_seconds', String(payload.durationSeconds))
  }
  if (payload.sampleRate !== undefined) {
    formData.append('sample_rate', String(payload.sampleRate))
  }
  if (payload.channels !== undefined) {
    formData.append('channels', String(payload.channels))
  }

  const response = await fetch(`${API_BASE_URL}/api/consultations/${consultationId}/recording`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    let detail = 'Request failed'
    try {
      const body = await response.json()
      if (body?.detail) {
        detail = typeof body.detail === 'string'
          ? body.detail
          : JSON.stringify(body.detail)
      }
    } catch {
      // Keep generic error detail for non-JSON failure payloads.
    }
    throw new Error(detail)
  }

  return response.json()
}