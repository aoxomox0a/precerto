# 🏗️ System Architecture & Data Flow

## Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
│                    (Vite Dev Server)                        │
└─────────────────────────────────────────────────────────────┘
         │
         ├─► App.jsx (Router Configuration)
         │
         └─► AppProvider (Global State Context)
             │
             ├─► mockData.js (Mock Database)
             │   ├── doctors[]
             │   ├── patients[]
             │   ├── forms[]
             │   ├── formResponses[]
             │   ├── consultations[]
             │   └── notifications[]
             │
             └─► Pages/Components
                 ├── /patient (PatientHub)
                 │   ├── PatientDashboard
                 │   └── FormStepper
                 └── /doctor (DoctorHub)
                     ├── PatientManagement
                     ├── FormManagement
                     └── Consultations
```

## Component Hierarchy

```
App.jsx
├── Router
│   ├── RoleSelector (/)
│   ├── PatientHub (/patient)
│   │   ├── Sidebar
│   │   ├── Header (TopNav)
│   │   │   ├── Notifications Panel
│   │   │   └── Patient Selector
│   │   └── Content
│   │       └── PatientDashboard
│   │           ├── FormCards
│   │           │   └── Button (Start/Continue)
│   │           └── FormStepper
│   │               ├── Question Display
│   │               ├── Input Fields
│   │               └── Navigation (Back/Next)
│   │
│   └── DoctorHub (/doctor)
│       ├── Sidebar
│       ├── Header (TopNav)
│       ├── Tab Navigation
│       └── Content
│           ├── Overview (Stats Cards)
│           ├── PatientManagement
│           │   ├── Add Patient Form
│           │   └── Patient List Items
│           ├── FormManagement
│           │   ├── Create Form
│           │   ├── Assign Form
│           │   └── Form List Items
│           └── Consultations
│               ├── Schedule Form
│               └── Consultation Cards
```

## Data Flow Diagram

### Patient Form Submission Flow

```
Patient Views Dashboard
    ↓
FormCards render from formResponses
    ↓
Patient clicks "Start"
    ↓
FormStepper loads with form questions
    ↓
Patient answers questions → responses stored in local state
    ↓
Patient clicks "Submit"
    ↓
onComplete() callback called
    ↓
updateFormResponse() called via AppProvider
    ↓
formResponses state updated
    └─→ New notification created for doctor
    └─→ Dashboard statistics update
    └─→ UI re-renders with new status
```

### Doctor Assigns Form Flow

```
Doctor navigates to Forms tab
    ↓
Clicks "→ Assign Form"
    ↓
Select form from dropdown
    ↓
Select patient from dropdown
    ↓
Click "Assign"
    ↓
assignFormToPatient() called
    ↓
New FormResponse created with:
├── formId
├── patientId
├── doctorId
└── status: 'pending'
    ↓
New Notification created for patient:
├── title: 'New form assigned'
├── message: Form title
└── read: false
    ↓
Patient's notification bell updates
    ↓
Patient sees new form in dashboard
```

### Real-Time Update Flow

```
User Action (e.g., form submission)
    ↓
State update in AppProvider Context
    ↓
Component subscribed to context re-renders
    ↓
Notification auto-generated
    ↓
Other user sees update:
├── New notification appears
├── Dashboard stats refresh
└── Lists refresh
```

## State Management Structure

```
AppProvider Context
│
├── patients: Patient[]
│   └── Actions:
│       ├── addPatient()
│       ├── deletePatient()
│       ├── getPatientById()
│       └── getPatientDoctors()
│
├── doctors: Doctor[]
│   └── Actions:
│       ├── getDoctorById()
│       ├── getDoctorPatients()
│       └── getDoctorForms()
│
├── forms: Form[]
│   └── Actions:
│       ├── createForm()
│       ├── updateForm()
│       ├── deleteForm()
│       └── getDoctorForms()
│
├── formResponses: FormResponse[]
│   └── Actions:
│       ├── updateFormResponse()
│       ├── getFormResponsesByPatient()
│       ├── getDoctorFormResponses()
│       ├── assignFormToPatient()
│
├── consultations: Consultation[]
│   └── Actions:
│       ├── createConsultation()
│       ├── updateConsultation()
│       ├── getConsultationsByDoctor()
│       └── getConsultationsByPatient()
│
└── notifications: Notification[]
    └── Actions:
        ├── getNotificationsForUser()
        └── markNotificationRead()
```

## Data Model Relationships

```
┌─────────────┐
│   Patient   │
├─────────────┤
│ id          │──┐
│ name        │  │
│ age         │  │
│ email       │  │ 1:Many
│ medHistory[]│  │
└─────────────┘  │
                 │
                 ├──────────────────┐
                 │                  │
                 ▼                  ▼
        ┌──────────────────┐   ┌────────────┐
        │ FormResponse     │   │ Consultation
        ├──────────────────┤   ├────────────┤
        │ patientId ◄──────┤   │ patientId ◄─┤
        │ doctorId  ◄────┐ │   │ doctorId  ◄─┤
        │ formId    ◄──┐ │ │   │ status     │
        │ responses │  │ │ │   │ scheduledFor
        │ status    │  │ │ │   └────────────┘
        │ progress  │  │ │ │        △
        └──────────────┘  │ │        │
                 ▲        │ │        │ 1:Many
                 │        │ │        │
        ┌────────┴────────┴─┴─┐
        │                    │
        ▼                    ▼
    ┌────────┐          ┌───────────┐
    │ Doctor │          │   Form    │
    ├────────┤          ├───────────┤
    │ id  ◄──┼──1:Many──┤ createdBy │
    │ name   │          │ questions │
    │ spec   │          │ isCustom  │
    └────────┘          └───────────┘
```

## Component Communication

```
PatientHub (Page)
    │
    ├─► useAppContext()
    │   └── Access: patients, doctors, forms, formResponses, notifications
    │
    └─► Passes to children:
        ├── PatientDashboard
        │   └── Uses: getPatientFormResponses(), getFormById(), getDoctorById()
        │       Calls: updateFormResponse()
        │
        └── FormStepper
            └── Receives: form, initialResponses, onComplete handler
                Calls: onComplete(responses)
```

## Event Flow Example: Doctor Assigns Form

```
User Interaction: Click "Assign" button
    │
    ├─► FormManagement component
    │   └─► handleAssignForm()
    │
    ├─► AppProvider.assignFormToPatient()
    │   ├─► Creates new FormResponse
    │   ├─► Creates new Subscription
    │   ├─► Updates formResponses state
    │   ├─► Generates new Notification
    │   └─► Updates notifications state
    │
    └─► All subscribed components re-render
        ├─► DoctorHub sees updated stats
        ├─► PatientHub receives notification
        ├─► PatientDashboard shows new form
        └─► Notification bell badge updates
```

## Performance Optimization Strategy

```
Context API
    ├─► useMemo() for contextValue
    │   └─► Prevents unnecessary re-renders
    │
    ├─► useCallback() for action functions
    │   └─► Stable function references
    │
    └─► Component-level memoization
        └─► Only re-render when relevant props change
```

## Future Integration Points

```
Current Architecture (Mock Data)
    │
    └─► Future Backend Integration
        │
        ├─► REST API Endpoints
        │   ├── GET /api/patients
        │   ├── POST /api/patients
        │   ├── GET /api/forms
        │   ├── POST /api/forms
        │   ├── PUT /api/forms/:id/responses
        │   ├── POST /api/consultations
        │   └── GET /api/notifications
        │
        ├─► WebSocket Connection
        │   ├── Real-time notifications
        │   ├── Audio streaming (ws://localhost:8000/ws/audio)
        │   └── Form updates
        │
        └─► Authentication
            ├── JWT tokens
            ├── User login
            └── Role-based access
```

## Build and Deployment Flow

```
Development
    ├─► npm run dev
    └─► Vite dev server on :3000
        └─► Hot module replacement

Production Build
    ├─► npm run build
    └─► Vite builds to /dist
        ├── index.html
        ├── assets/
        │   ├── main.[hash].js
        │   └── style.[hash].css
        └─► Optimized for deployment

Deployment Options
    ├─► Vercel (no config needed)
    ├─► Netlify (no config needed)
    ├─► Docker container
    ├─► AWS S3 + CloudFront
    └─► Self-hosted (Node.js server)
```

## File I/O and Separation of Concerns

```
/pages/           ← Page layouts, routing logic
/components/      ← Reusable UI components
/store/          ← State management (Context)
/services/       ← Business logic, API calls, mock data
/styles/         ← Global and component styles
/utils/          ← Utility functions
/types/          ← TypeScript types (future)
```

---

This architecture provides:
- ✅ Clear separation of concerns
- ✅ Scalable component structure
- ✅ Efficient state management
- ✅ Easy to add new features
- ✅ Ready for backend integration
- ✅ Performance optimized
