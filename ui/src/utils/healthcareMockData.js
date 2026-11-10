/**
 * Mock Data for Healthcare App
 * Simulates database for obesity patient management system
 */

// Mock Doctors
export const mockDoctors = [
  {
    id: 'doc-1',
    name: 'Dr. Sarah Johnson',
    specialty: 'Bariatric Medicine',
    email: 'sarah.johnson@healthcare.com',
    avatar: '👩‍⚕️',
    patients: ['pat-1', 'pat-2', 'pat-3']
  },
  {
    id: 'doc-2',
    name: 'Dr. Michael Chen',
    specialty: 'Nutritionist',
    email: 'michael.chen@healthcare.com',
    avatar: '👨‍⚕️',
    patients: ['pat-1', 'pat-2']
  },
  {
    id: 'doc-3',
    name: 'Dr. Emily Rodriguez',
    specialty: 'Behavioral Health',
    email: 'emily.rodriguez@healthcare.com',
    avatar: '👩‍⚕️',
    patients: ['pat-2', 'pat-3']
  }
];

// Mock Patients
export const mockPatients = [
  {
    id: 'pat-1',
    name: 'James Thompson',
    email: 'james.thompson@email.com',
    age: 42,
    weight: 320,
    height: 70,
    bmi: 45.9,
    joinDate: '2025-06-15',
    doctors: ['doc-1', 'doc-2'],
    profileImage: '👨',
    medicalHistory: 'Type 2 diabetes, hypertension',
    currentGoal: 'Lose 80 lbs in 12 months'
  },
  {
    id: 'pat-2',
    name: 'Maria Garcia',
    email: 'maria.garcia@email.com',
    age: 38,
    weight: 285,
    height: 65,
    bmi: 47.4,
    joinDate: '2025-07-20',
    doctors: ['doc-1', 'doc-2', 'doc-3'],
    profileImage: '👩',
    medicalHistory: 'Sleep apnea, PCOS',
    currentGoal: 'Improve fitness and energy levels'
  },
  {
    id: 'pat-3',
    name: 'Robert Kim',
    email: 'robert.kim@email.com',
    age: 55,
    weight: 310,
    height: 72,
    bmi: 42.1,
    joinDate: '2025-08-10',
    doctors: ['doc-1', 'doc-3'],
    profileImage: '👨',
    medicalHistory: 'Cardiovascular disease risk, joint pain',
    currentGoal: 'Reduce cardiovascular risk factors'
  }
];

// Form Templates
export const mockFormTemplates = [
  {
    id: 'form-1',
    title: 'Weekly Health Check-in',
    description: 'Track your weekly physical and mental health metrics',
    categories: [
      {
        id: 'cat-physical',
        name: 'Physical Health',
        fields: [
          { id: 'weight', label: 'Current Weight (lbs)', type: 'number', value: null },
          { id: 'exercise', label: 'Days Exercised This Week', type: 'number', min: 0, max: 7, value: null },
          { id: 'painLevel', label: 'Pain Level (1-10)', type: 'slider', min: 1, max: 10, value: null },
          { id: 'energy', label: 'Energy Level (1-10)', type: 'slider', min: 1, max: 10, value: null }
        ]
      },
      {
        id: 'cat-sleep',
        name: 'Sleep Quality',
        fields: [
          { id: 'sleepHours', label: 'Average Sleep Hours', type: 'number', min: 0, max: 12, value: null },
          { id: 'sleepQuality', label: 'Sleep Quality (1-10)', type: 'slider', min: 1, max: 10, value: null },
          { id: 'nightmares', label: 'Experienced nightmares', type: 'checkbox', value: false },
          { id: 'insomnia', label: 'Experienced insomnia', type: 'checkbox', value: false }
        ]
      },
      {
        id: 'cat-mental',
        name: 'Mental Wellness',
        fields: [
          { id: 'mood', label: 'Overall Mood (1-10)', type: 'slider', min: 1, max: 10, value: null },
          { id: 'stress', label: 'Stress Level (1-10)', type: 'slider', min: 1, max: 10, value: null },
          { id: 'anxious', label: 'Felt anxious this week', type: 'checkbox', value: false },
          { id: 'depressed', label: 'Felt depressed this week', type: 'checkbox', value: false },
          { id: 'mentalNotes', label: 'Additional Notes', type: 'textarea', value: '' }
        ]
      },
      {
        id: 'cat-nutrition',
        name: 'Nutrition & Diet',
        fields: [
          { id: 'mealsLogged', label: 'Days meals were logged', type: 'number', min: 0, max: 7, value: null },
          { id: 'waterIntake', label: 'Daily Water Intake (glasses)', type: 'number', value: null },
          { id: 'fastFood', label: 'Days with fast food', type: 'number', min: 0, max: 7, value: null },
          { id: 'dietFollowup', label: 'Following assigned diet plan', type: 'checkbox', value: false }
        ]
      }
    ],
    createdAt: '2025-09-01',
    dueDate: '2025-09-10',
    status: 'active'
  },
  {
    id: 'form-2',
    title: 'Monthly Progress Assessment',
    description: 'Comprehensive monthly review of health progress',
    categories: [
      {
        id: 'cat-metrics',
        name: 'Health Metrics',
        fields: [
          { id: 'weight', label: 'Current Weight (lbs)', type: 'number', value: null },
          { id: 'waist', label: 'Waist Circumference (inches)', type: 'number', value: null },
          { id: 'bloodPressure', label: 'Blood Pressure', type: 'text', placeholder: '120/80', value: null }
        ]
      },
      {
        id: 'cat-goals',
        name: 'Goal Progress',
        fields: [
          { id: 'primaryGoal', label: 'Progress on primary goal (%)', type: 'slider', min: 0, max: 100, value: null },
          { id: 'goalsComment', label: 'Comments on goal progress', type: 'textarea', value: '' }
        ]
      }
    ],
    createdAt: '2025-09-01',
    dueDate: '2025-10-01',
    status: 'active'
  },
  {
    id: 'form-3',
    title: 'Mental Health & Wellness Check',
    description: 'Assess emotional wellbeing and psychological health',
    categories: [
      {
        id: 'cat-emotional',
        name: 'Emotional Health',
        fields: [
          { id: 'depressionRisk', label: 'Depression Risk (1-10)', type: 'slider', min: 1, max: 10, value: null },
          { id: 'anxietyRisk', label: 'Anxiety Risk (1-10)', type: 'slider', min: 1, max: 10, value: null },
          { id: 'lifeQuality', label: 'Quality of Life (1-10)', type: 'slider', min: 1, max: 10, value: null }
        ]
      }
    ],
    createdAt: '2025-08-15',
    dueDate: '2025-09-15',
    status: 'active'
  }
];

// Form Assignments (links patients to forms)
export const mockFormAssignments = [
  {
    id: 'assign-1',
    patientId: 'pat-1',
    doctorId: 'doc-1',
    formId: 'form-1',
    assignedDate: '2025-09-01',
    dueDate: '2025-09-10',
    status: 'not-completed',
    responses: null
  },
  {
    id: 'assign-2',
    patientId: 'pat-1',
    doctorId: 'doc-1',
    formId: 'form-2',
    assignedDate: '2025-09-01',
    dueDate: '2025-10-01',
    status: 'not-completed',
    responses: null
  },
  {
    id: 'assign-3',
    patientId: 'pat-2',
    doctorId: 'doc-1',
    formId: 'form-1',
    assignedDate: '2025-09-05',
    dueDate: '2025-09-15',
    status: 'completed',
    responses: {
      'cat-physical': {
        weight: 282,
        exercise: 4,
        painLevel: 5,
        energy: 6
      },
      'cat-sleep': {
        sleepHours: 6.5,
        sleepQuality: 6,
        nightmares: false,
        insomnia: true
      }
    },
    completedDate: '2025-09-12'
  },
  {
    id: 'assign-4',
    patientId: 'pat-2',
    doctorId: 'doc-3',
    formId: 'form-3',
    assignedDate: '2025-08-20',
    dueDate: '2025-09-20',
    status: 'completed',
    responses: {
      'cat-emotional': {
        depressionRisk: 4,
        anxietyRisk: 5,
        lifeQuality: 6
      }
    },
    completedDate: '2025-09-18'
  },
  {
    id: 'assign-5',
    patientId: 'pat-3',
    doctorId: 'doc-1',
    formId: 'form-2',
    assignedDate: '2025-09-01',
    dueDate: '2025-10-01',
    status: 'not-completed',
    responses: null
  }
];

// Helper function to get patient's forms
export const getPatientForms = (patientId) => {
  const assignments = mockFormAssignments.filter(a => a.patientId === patientId);
  return assignments.map(assignment => {
    const form = mockFormTemplates.find(f => f.id === assignment.formId);
    const doctor = mockDoctors.find(d => d.id === assignment.doctorId);
    return {
      ...assignment,
      formTitle: form?.title,
      formDescription: form?.description,
      doctorName: doctor?.name,
      doctorSpecialty: doctor?.specialty
    };
  });
};

// Helper function to get doctor's patients
export const getDoctorPatients = (doctorId) => {
  const doctor = mockDoctors.find(d => d.id === doctorId);
  if (!doctor) return [];
  return mockPatients.filter(p => doctor.patients.includes(p.id));
};

// Helper function to get doctor's patient assignments
export const getDoctorPatientAssignments = (doctorId, patientId) => {
  return mockFormAssignments.filter(a => a.doctorId === doctorId && a.patientId === patientId);
};
