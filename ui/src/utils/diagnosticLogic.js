// Diagnostic Logic and AI-powered functions

/**
 * Process audio blob and return transcribed text
 * In a real application, this would call a speech-to-text API
 */
export const processAudioDialogue = async (audioBlob) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500))

  // Simulated transcriptions based on random selection
  const simulatedTranscriptions = [
    "Patient reports fever of 38.5 degrees Celsius for the past 3 days. Also complains of persistent dry cough and mild shortness of breath. Started with headache and sore throat. Says fatigue is getting worse. No recent travel.",
    "The patient has been experiencing chest pain for about a week, especially when breathing deeply. Associated with a dry cough. Temperature is normal. Patient reports feeling dizzy occasionally. Has been under stress at work recently.",
    "Chief complaint is severe abdominal pain in the lower right quadrant for 2 days. Patient has nausea and has vomited twice. Fever of 38.2 degrees. Also experiencing general malaise. The pain is worse with movement.",
    "Patient presents with headache that started suddenly 4 days ago. Associated with neck stiffness and moderate fever. Recent exposure to sick contacts at office. Some sensitivity to light reported.",
    "Acute onset of sore throat and fever of 38 degrees. Patient reports fatigue and poor appetite. No cough, but reports malaise. Lymph nodes appear enlarged on examination."
  ]

  const selectedTranscription = simulatedTranscriptions[
    Math.floor(Math.random() * simulatedTranscriptions.length)
  ]

  return selectedTranscription
}

/**
 * Extract symptoms from transcription text
 * This would normally use NLP or call an AI service
 */
export const extractSymptoms = async (transcription) => {
  await new Promise(resolve => setTimeout(resolve, 800))

  const symptoms = []
  const lowerText = transcription.toLowerCase()

  const symptomPatterns = {
    'fever': { severity: 'high', confidence: 0.95 },
    'cough': { severity: 'moderate', confidence: 0.92 },
    'headache': { severity: 'moderate', confidence: 0.88 },
    'fatigue': { severity: 'moderate', confidence: 0.85 },
    'sore throat': { severity: 'moderate', confidence: 0.90 },
    'shortness of breath': { severity: 'high', confidence: 0.93 },
    'nausea': { severity: 'moderate', confidence: 0.87 },
    'chest pain': { severity: 'high', confidence: 0.96 },
    'dizziness': { severity: 'moderate', confidence: 0.89 },
    'abdominal pain': { severity: 'moderate', confidence: 0.91 },
    'malaise': { severity: 'moderate', confidence: 0.84 },
    'neck stiffness': { severity: 'high', confidence: 0.88 },
  }

  for (const [symptom, properties] of Object.entries(symptomPatterns)) {
    if (lowerText.includes(symptom)) {
      symptoms.push({
        name: symptom.charAt(0).toUpperCase() + symptom.slice(1),
        ...properties
      })
    }
  }

  return symptoms
}

/**
 * Generate differential diagnoses based on symptoms
 * Uses a rule-based system or ML model
 */
export const generateDiagnoses = async (symptoms) => {
  await new Promise(resolve => setTimeout(resolve, 1200))

  const diagnosesList = [
    {
      id: 'resp-infection',
      name: 'Upper Respiratory Infection (URI)',
      code: 'J00-J06',
      description: 'Common viral infection of the nose, throat, and sinuses',
      confidence: 0.85,
      likelihood: 78,
      priority: 'moderate',
      clinicalFeatures: [
        { name: 'Sore Throat', present: true },
        { name: 'Fever', present: true },
        { name: 'Cough', present: true },
        { name: 'Headache', present: true },
      ],
      supportiveFindings: [
        'Elevated temperature (38-39°C)',
        'Throat erythema',
        'Possible lymphadenopathy',
        'Recent contact with sick persons'
      ],
      nextSteps: [
        'Supportive care with rest and hydration',
        'Over-the-counter antipyretics',
        'Monitor for complications',
        'Follow-up if symptoms persist > 10 days'
      ]
    },
    {
      id: 'viral-pneumonia',
      name: 'Viral Pneumonia',
      code: 'J12',
      description: 'Lung infection caused by viral pathogens',
      confidence: 0.72,
      likelihood: 65,
      priority: 'high',
      clinicalFeatures: [
        { name: 'Fever', present: true },
        { name: 'Cough', present: true },
        { name: 'Shortness of Breath', present: true },
        { name: 'Fatigue', present: true },
      ],
      supportiveFindings: [
        'Productive or dry cough',
        'Dyspnea on exertion',
        'Crackles on auscultation (may not be present)',
        'Infiltrates on chest imaging'
      ],
      nextSteps: [
        'Chest X-ray examination',
        'Pulse oximetry and blood oxygen monitoring',
        'Complete blood count',
        'Consider antiviral therapy if indicated'
      ]
    },
    {
      id: 'influenza',
      name: 'Influenza (Flu)',
      code: 'J09-J11',
      description: 'Acute viral respiratory infection with systemic symptoms',
      confidence: 0.68,
      likelihood: 62,
      priority: 'moderate',
      clinicalFeatures: [
        { name: 'Fever', present: true },
        { name: 'Headache', present: true },
        { name: 'Fatigue', present: true },
        { name: 'Cough', present: true },
      ],
      supportiveFindings: [
        'Acute onset of fever and systemic symptoms',
        'Prominent myalgia and fatigue',
        'Seasonal occurrence',
        'Possible rapid progression'
      ],
      nextSteps: [
        'Rapid influenza diagnostic test',
        'PCR testing for confirmation',
        'Consider antiviral therapy (oseltamivir)',
        'Supportive care and isolation'
      ]
    },
    {
      id: 'covid-19',
      name: 'COVID-19',
      code: 'U07.1',
      description: 'Acute respiratory infection caused by SARS-CoV-2',
      confidence: 0.65,
      likelihood: 58,
      priority: 'high',
      clinicalFeatures: [
        { name: 'Fever', present: true },
        { name: 'Cough', present: true },
        { name: 'Fatigue', present: true },
        { name: 'Shortness of Breath', present: false },
      ],
      supportiveFindings: [
        'Recent exposure history',
        'Variable presentation',
        'Some patients asymptomatic',
        'Testing may be falsely negative early'
      ],
      nextSteps: [
        'SARS-CoV-2 PCR test',
        'Antigen testing if PCR unavailable',
        'Isolation precautions',
        'Monitor for severe disease progression'
      ]
    }
  ]

  // Filter diagnoses based on symptom matching
  return diagnosesList.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Generate detailed clinical reasoning explanation
 */
export const generateExplanations = async (diagnosis, symptoms) => {
  await new Promise(resolve => setTimeout(resolve, 600))

  const explanationMap = {
    'resp-infection': `This diagnosis is supported by the classic triad of sore throat, fever, and cough. The patient's recent viral exposure and systemic symptoms (headache, fatigue) are consistent with viral etiology. The moderate presentation and constellation of upper respiratory symptoms make this the most likely diagnosis. The fever is typical for viral infections and usually resolves within 3-7 days with supportive care.`,

    'viral-pneumonia': `The presence of fever, productive cough, fatigue, and notably shortness of breath raises concern for lower respiratory tract involvement. The dyspnea component is critical as it suggests parenchymal inflammation. Viral pneumonia can progress rapidly and requires closer monitoring. Chest imaging is essential to confirm the diagnosis and rule out bacterial superinfection or other serious pathology.`,

    'influenza': `The acute onset with prominent constitutional symptoms (fever, headache, myalgia, fatigue) suggests influenza rather than common cold. The severity of systemic symptoms and the specific pattern of presentation are typical for seasonal influenza virus infection. Antiviral treatment is most effective if started within 48 hours of symptom onset. The rapid progression potential warrants close monitoring.`,

    'covid-19': `While COVID-19 presents with non-specific respiratory symptoms similar to other viral infections, it remains on the differential given the current epidemiological context. The fever, cough, and fatigue are consistent, though the absence of dyspnea slightly lowers the probability. Definitive diagnosis requires molecular testing. Clinical correlation with exposure history is essential.`
  }

  return explanationMap[diagnosis.id] || 'Clinical assessment and diagnostic correlation recommended.'
}

/**
 * Calculate diagnostic score based on symptom match
 */
export const calculateDiagnosticScore = (diagnosis, symptoms) => {
  let score = 0
  const symptomNames = symptoms.map(s => s.name.toLowerCase())

  for (const feature of diagnosis.clinicalFeatures || []) {
    if (symptomNames.some(s => s.includes(feature.name.toLowerCase()))) {
      score += feature.present ? 1 : 0.5
    }
  }

  return Math.min(score / (diagnosis.clinicalFeatures?.length || 1), 1)
}

/**
 * Generate patient summary report
 */
export const generatePatientReport = (transcription, symptoms, diagnosis, clinicianNotes) => {
  return {
    timestamp: new Date().toISOString(),
    transcription,
    symptoms: symptoms.map(s => ({
      name: s.name,
      severity: s.severity,
      onset: s.onset,
      duration: s.duration
    })),
    primaryDiagnosis: {
      name: diagnosis.name,
      code: diagnosis.code,
      confidence: diagnosis.confidence.toFixed(2),
      likelihood: diagnosis.likelihood
    },
    clinicianNotes,
    clinicalDecision: 'Diagnosis confirmed and documented',
    status: 'Complete'
  }
}
