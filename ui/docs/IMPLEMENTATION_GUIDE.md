# Precerto Clinical Management System - React UI

A comprehensive medical decision-support application with **Patient Portal** and **Doctor Dashboard**.

## 🏗️ Architecture Overview

### Project Structure
```
src/
├── pages/                    # Page components
│   ├── patient/             # Patient portal pages
│   │   ├── PatientHub.jsx      # Main patient interface
│   │   └── PatientDashboard.jsx # Form management
│   └── doctor/              # Doctor dashboard pages
│       ├── DoctorHub.jsx       # Main doctor interface
│       ├── PatientManagement.jsx # Add/remove patients
│       ├── FormManagement.jsx   # Create/assign forms
│       └── Consultations.jsx    # Schedule consultations
├── components/
│   ├── shared/              # Reusable components
│   │   ├── Buttons.jsx         # Button component
│   │   ├── Sidebar.jsx         # Navigation sidebar
│   │   ├── FormStepper.jsx     # Step-by-step form UI
│   │   └── *.css               # Component styles
│   ├── patient/             # Patient-specific components
│   ├── doctor/              # Doctor-specific components
│   └── AudioRecorder.jsx    # WebSocket-enabled audio capture
├── store/
│   └── AppProvider.jsx      # Global state management via Context API
├── services/
│   └── mockData.js          # Mock data (doctors, patients, forms, etc.)
├── styles/
│   ├── global.css           # Global styles
│   ├── shared.css           # Shared component styles
│   └── (component-specific .css files)
├── utils/                   # Utility functions
└── main.jsx                 # Entry point
```

## 🎯 Key Features

### Patient Portal (`/patient`)
- **Dashboard**: View assigned forms and track completion progress
- **Form System**: Step-by-step form completion with categories
  - Symptoms
  - Lifestyle
  - Medical History
  - Medications
  - Allergies
- **Progress Tracking**: Visual completion percentages and status badges
- **Notifications**: Real-time alerts for new forms and reminders
- **Doctor Connection**: View assigned healthcare providers

### Doctor Dashboard (`/doctor`)
- **Patient Management**
  - Add new patients
  - Manage patient records
  - View patient medical history
- **Form Management**
  - Create custom forms
  - Assign forms to patients
  - Track form completion status
- **Consultation Scheduling**
  - Schedule consultations
  - View patient appointment history
- **Real-Time Updates**
  - Notifications when patients submit forms
  - Dashboard updates when forms are completed
- **Overview Statistics**
  - Total patients
  - Pending form responses
  - Upcoming consultations

## 🔄 State Management

### Context API (`AppProvider.jsx`)
Global state is managed via React Context with the following capabilities:
- Patient CRUD operations
- Doctor information management
- Form creation and assignment
- Form response tracking
- Consultation scheduling
- Notification management

### Mock Data Structure
```javascript
// doctors, patients, forms, formResponses, consultations, notifications
```

## 📋 Data Models

### Patient
```javascript
{
  id: string,
  name: string,
  age: number,
  email: string,
  medicalHistory: string[],
  assignedDoctorIds: string[],
  avatar: string
}
```

### Doctor
```javascript
{
  id: string,
  name: string,
  specialty: string,
  email: string,
  contact: string,
  status: string,
  image: string
}
```

### Form
```javascript
{
  id: string,
  title: string,
  description: string,
  category: string,
  createdBy: string (doctorId),
  createdAt: string,
  isCustom: boolean,
  questions: FormQuestion[]
}
```

### FormResponse
```javascript
{
  id: string,
  formId: string,
  patientId: string,
  doctorId: string,
  status: 'pending' | 'in_progress' | 'completed',
  progress: number (0-100),
  responses: Record<string, any>
}
```

### Notification
```javascript
{
  id: string,
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'warning' | 'error' | 'success',
  read: boolean
}
```

## 🎨 UI Component Library

### Reusable Components (in `components/shared/`)

#### Button
```jsx
<Button variant="primary" size="md" onClick={handler} disabled={false} fullWidth>
  Click me
</Button>
```
**Variants**: `primary`, `secondary`, `success`, `danger`, `outline`  
**Sizes**: `sm`, `md`, `lg`

#### FormStepper
```jsx
<FormStepper
  form={formData}
  initialResponses={existingResponses}
  onComplete={(responses) => console.log(responses)}
/>
```
Provides step-by-step form completion with progress tracking.

#### Sidebar
```jsx
<Sidebar role="patient|doctor" />
```
Navigation sidebar with role-based menu items.

## 🔌 Integration Points

### WebSocket Audio Streaming
The `AudioRecorder` component includes WebSocket integration:
```javascript
// Connection to ws://localhost:8000/ws/audio
const int16Buffer = convertFloat32ToInt16(audioData)
websocket.send(int16Buffer)
```

### Backend API Integration
Ready for REST API integration:
```javascript
// FormResponses submitted to backend
// Consultations persisted to database
// Patient/Doctor data synced with server
```

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Opens at `http://localhost:3000`

### Build for Production
```bash
npm run build
```

## 📊 User Flows

### Patient Form Completion Flow
1. Patient logs in via role selector
2. Navigates to `/patient`
3. Views assigned forms from doctors
4. Clicks "Start" on a form
5. Completes form step-by-step
6. Submits responses
7. Doctor receives notification

### Doctor Form Assignment Flow
1. Doctor logs in via role selector
2. Navigates to `/doctor`
3. Creates a new form or selects existing
4. Selects a patient
5. Assigns form
6. Patient receives notification
7. Form appears in patient dashboard

## 🎯 Real-Time Features

### Form Response Updates
- When a patient updates a form response, the doctor is notified
- Dashboard statistics update automatically

### Notifications
- New form assignments notify patients
- Form submissions notify doctors
- All notifications persist in notification panel

### Consultation Scheduling
- Doctors schedule consultations with patients
- Patients see upcoming appointments (in future enhancement)

## 🔐 Security Considerations

### To implement in production:
1. **Authentication**: Add user login and JWT tokens
2. **Authorization**: Implement role-based access control
3. **Data Encryption**: Secure patient health information
4. **HIPAA Compliance**: Ensure medical data protection
5. **Audit Logging**: Track all user actions

## 📱 Responsive Design

- **Desktop-first** approach
- Mobile-optimized sidebar collapses
- Tablet-friendly layouts
- Touch-friendly form inputs

## 🔄 Real-Time Simulation

The app simulates real-time updates using React Context. In production, this should be replaced with:
- WebSocket for real-time notifications
- Server-Sent Events (SSE) for streaming updates
- Polling with optimistic UI updates

## 🛠️ Technology Stack

- **React 18**: UI library
- **React Router 7**: Client-side routing
- **React Context API**: State management
- **Vite**: Build tool and dev server
- **CSS3**: Styling with custom properties
- **JavaScript ES6+**: Modern syntax

## 📝 Notes

- Mock data resets on page refresh
- Notifications persist during session
- Form responses auto-save via context
- Audio recording requires microphone permission

## 🤝 Contributing

When adding new features:
1. Create reusable components in `components/shared/`
2. Export from appropriate index files
3. Add corresponding CSS modules
4. Update AppProvider if state is needed
5. Document new props and usage

## 📚 References

- React Documentation: https://react.dev
- React Router: https://reactrouter.com
- Form Design Patterns: UX best practices for medical forms
- HIPAA Compliance: Security requirements for healthcare apps
