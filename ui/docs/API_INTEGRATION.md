# API Integration Guide

## Overview

The Precerto UI is designed to be integrated with backend APIs for real data processing. This guide shows how to replace the mock functions with actual API calls.

## Current Architecture

```
┌──────────────────┐
│   React Frontend │
│  (This Project)  │
└────────┬─────────┘
         │
    ┌────┴─────┐
    │           │
    ▼           ▼
┌────────┐  ┌────────────┐
│ Mock   │  │ Would use  │
│Funcs   │  │ APIs here  │
└────────┘  └────────────┘
```

## Required Backend Services

### 1. Speech Recognition Service
**Endpoint:** `POST /api/v1/transcribe`

**Current Mock Function:**
```javascript
// src/utils/diagnosticLogic.js
export const processAudioDialogue = async (audioBlob) => {
  await new Promise(resolve => setTimeout(resolve, 1500))
  return "Simulated transcription..."
}
```

**Replace with Real API:**
```javascript
export const processAudioDialogue = async (audioBlob) => {
  const formData = new FormData()
  formData.append('audio', audioBlob)
  
  try {
    const response = await fetch(`${API_BASE}/transcribe`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    
    const data = await response.json()
    return data.transcription
  } catch (error) {
    console.error('Transcription failed:', error)
    throw error
  }
}
```

**Service Options:**
- Google Cloud Speech-to-Text
- AWS Transcribe Medical
- Azure Speech-to-Text
- Deepgram API
- AssemblyAI

---

### 2. Symptom Extraction Service
**Endpoint:** `POST /api/v1/extract-symptoms`

**Response Format:**
```json
{
  "symptoms": [
    {
      "name": "Fever",
      "severity": "high",
      "confidence": 0.95,
      "onset": "acute",
      "duration": "3 days"
    }
  ]
}
```

**Implementation:**
```javascript
export const extractSymptoms = async (transcription) => {
  const response = await fetch(`${API_BASE}/extract-symptoms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({ transcription })
  })
  
  if (!response.ok) throw new Error('Symptom extraction failed')
  const { symptoms } = await response.json()
  return symptoms
}
```

**NLP Technologies:**
- spaCy with biomedical models
- BioBERT for medical NER
- Clinical BERT
- GPT-4 with medical prompt
- Domain-specific transformers

---

### 3. Diagnosis Generation Service
**Endpoint:** `POST /api/v1/generate-diagnoses`

**Request:**
```json
{
  "symptoms": [
    { "name": "Fever", "severity": "high", "confidence": 0.95 },
    { "name": "Cough", "severity": "moderate", "confidence": 0.92 }
  ]
}
```

**Response:**
```json
{
  "diagnoses": [
    {
      "id": "resp-infection",
      "name": "Upper Respiratory Infection",
      "code": "J00-J06",
      "confidence": 0.85,
      "likelihood": 78,
      "priority": "moderate",
      "clinicalFeatures": [...],
      "supportiveFindings": [...],
      "nextSteps": [...]
    }
  ]
}
```

**Implementation:**
```javascript
export const generateDiagnoses = async (symptoms) => {
  const response = await fetch(`${API_BASE}/generate-diagnoses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({ symptoms })
  })
  
  if (!response.ok) throw new Error('Diagnosis generation failed')
  const { diagnoses } = await response.json()
  return diagnoses
}
```

**AI/ML Options:**
- TensorFlow.js medical models
- PyTorch with clinical data
- Random forest classifiers
- Gradient boosting (XGBoost)
- Deep learning neural networks
- Knowledge graph reasoning

---

### 4. Clinical Explanation Service
**Endpoint:** `POST /api/v1/explain-diagnosis`

**Request:**
```json
{
  "diagnosis_id": "resp-infection",
  "symptoms": [...]
}
```

**Response:**
```json
{
  "explanation": "This diagnosis is supported by the classic presentation of URI..."
}
```

**Implementation:**
```javascript
export const generateExplanations = async (diagnosis, symptoms) => {
  const response = await fetch(`${API_BASE}/explain-diagnosis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({ 
      diagnosis_id: diagnosis.id,
      symptoms 
    })
  })
  
  if (!response.ok) throw new Error('Explanation generation failed')
  const { explanation } = await response.json()
  return explanation
}
```

---

### 5. Patient Record Service
**Endpoint:** `POST /api/v1/records`

**Implementation in `App.jsx`:**
```javascript
const handleConfirmation = async (confirmedDiagnosis, clinicianNotes) => {
  try {
    const recordData = {
      transcription,
      symptoms,
      diagnosis: confirmedDiagnosis,
      clinicianNotes,
      timestamp: new Date().toISOString(),
      clinician_id: currentUser.id
    }
    
    const response = await fetch(`${API_BASE}/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(recordData)
    })
    
    if (response.ok) {
      const { record_id } = await response.json()
      console.log('Record saved:', record_id)
      setStage('completed')
    }
  } catch (error) {
    setError('Failed to save record: ' + error.message)
  }
}
```

---

## Environment Configuration

Create `.env.local` file:
```
VITE_API_BASE_URL=https://api.precerto.com/v1
VITE_AUTH_TOKEN=your-jwt-token
VITE_ENVIRONMENT=development
```

Access in code:
```javascript
const API_BASE = import.meta.env.VITE_API_BASE_URL
const authToken = import.meta.env.VITE_AUTH_TOKEN
```

---

## Error Handling

Implement robust error handling:

```javascript
const apiCall = async (endpoint, data) => {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(data),
      timeout: 30000 // 30 second timeout
    })
    
    if (response.status === 401) {
      // Token expired, re-authenticate
      await refreshAuthToken()
      return apiCall(endpoint, data) // Retry
    }
    
    if (response.status === 429) {
      // Rate limited
      throw new Error('Service temporarily unavailable. Please try again.')
    }
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'API request failed')
    }
    
    return await response.json()
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error)
    throw error
  }
}
```

---

## Authentication

Implement JWT authentication:

```javascript
// In main App component
useEffect(() => {
  const token = localStorage.getItem('auth_token')
  if (!token) {
    // Redirect to login
    window.location.href = '/login'
  }
}, [])
```

---

## Rate Limiting & Caching

```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Authorization': `Bearer ${authToken}`
  }
})

// Add response caching
const cache = new Map()

api.interceptors.request.use(config => {
  if (config.method === 'get') {
    const key = config.url
    if (cache.has(key)) {
      return Promise.resolve(cache.get(key))
    }
  }
  return config
})

api.interceptors.response.use(response => {
  if (response.config.method === 'get') {
    cache.set(response.config.url, response)
  }
  return response
})
```

---

## Data Privacy & Security

### Encryption
```javascript
// Use TLS 1.3 for all API communication
// Ensure HTTPS only
```

### Data Minimization
```javascript
// Only send necessary data
const minimizedData = {
  symptoms: symptoms.map(s => ({ name: s.name, severity: s.severity })),
  // Remove confidence scores, etc.
}
```

### HIPAA Compliance
- Implement end-to-end encryption
- No PII in logs
- Audit trail logging
- Data retention policies
- Access control lists

---

## Testing API Integration

```javascript
// Mock API for testing
const mockApi = {
  transcribe: () => Promise.resolve("Mock transcription"),
  extractSymptoms: () => Promise.resolve([]),
  generateDiagnoses: () => Promise.resolve([]),
}

// Use mock API in tests
const api = process.env.NODE_ENV === 'test' ? mockApi : realApi
```

---

## Performance Optimization

### Request Debouncing
```javascript
import { debounce } from 'lodash'

const debouncedSearch = debounce(async (query) => {
  const results = await api.search(query)
  setSearchResults(results)
}, 300)
```

### Parallel Requests
```javascript
// Fetch multiple diagnoses in parallel
const [diagnoses, explanations] = await Promise.all([
  api.generateDiagnoses(symptoms),
  api.generateExplanations(diagnosis, symptoms)
])
```

### Progressive Loading
```javascript
// Load UI immediately, fetch data in background
const [data, setData] = useState(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
  api.fetchData().then(data => {
    setData(data)
    setLoading(false)
  })
}, [])

return loading ? <LoadingUI /> : <DataUI data={data} />
```

---

## Deployment Checklist

- [ ] Replace all mock functions with API calls
- [ ] Configure environment variables
- [ ] Implement authentication
- [ ] Set up error handling
- [ ] Add request logging
- [ ] Implement rate limiting
- [ ] Set up monitoring/alerts
- [ ] Test against production API
- [ ] Load testing
- [ ] Security review
- [ ] HIPAA compliance verification
- [ ] Deploy to staging
- [ ] Final testing
- [ ] Deploy to production

---

## Support & Documentation

For API documentation, see:
- [Backend API Docs](../api/README.md)
- [Integration Examples](../examples/)
- [Troubleshooting Guide](../TROUBLESHOOTING.md)
