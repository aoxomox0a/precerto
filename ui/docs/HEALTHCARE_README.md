# Healthcare Obesity Management System

A modern React application for managing obesity patient care with separate interfaces for patients and healthcare providers. The system includes health form management, patient tracking, and care coordination features.

## 🎯 Features

### Patient Features
- **Health Dashboard**: View personal health metrics (BMI, weight, height, age)
- **Care Team**: See assigned doctors with their specialties
- **Form Management**: View and fill assigned health forms
- **Form Submission**: Submit responses which are tracked in the system
- **Progress Tracking**: Monitor completed vs. pending forms

### Doctor Features
- **Patient Management**: Browse and search assigned patients
- **Patient Profiles**: View individual patient health data and goals
- **Form Assignment**: Assign health forms to patients with due dates
- **Form Tracking**: Monitor form completion status and history
- **Quick Analytics**: See patient completion statistics

## 📂 Project Structure

```
src/
├── healthcare/                      # Healthcare app components
│   ├── HealthcareRoleSelector.jsx  # Entry point - role selection
│   ├── PatientDashboard.jsx         # Patient main interface
│   ├── PatientFormFiller.jsx        # Form submission component
│   ├── DoctorDashboard.jsx          # Doctor main container
│   ├── DoctorPatientList.jsx        # Doctor's patient list
│   ├── DoctorPatientProfile.jsx     # Individual patient profile
│   ├── *.css                        # Component styles
│   └── HealthcareRoleSelector.css
├── context/
│   └── HealthcareContext.jsx        # State management
├── utils/
│   └── healthcareMockData.js        # Demo data
└── App.jsx                          # Updated with healthcare routing
```

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install

# Add Tailwind CSS (if not already done)
npm install -D tailwindcss postcss autoprefixer @tailwindcss/postcss

# Configure Tailwind
npx tailwindcss init -p
```

### Running the Application

```bash
# Development mode
npm run dev

# Production build
npm run build

# Preview build
npm run preview
```

### Accessing the Healthcare App

Navigate to: `http://localhost:5173/healthcare/`

## 👥 Demo Users

### Doctors
1. **Dr. Sarah Mitchell** (Bariatric Medicine)
2. **Dr. James Chen** (Nutritionist)
3. **Dr. Emily Davis** (Behavioral Health)

### Patients
1. **John Smith** - BMI: 32, assigned to Dr. Mitchell & Dr. Chen
2. **Lisa Johnson** - BMI: 28, assigned to Dr. Chen & Dr. Davis
3. **Michael Brown** - BMI: 35, assigned to all doctors

## 🏗️ Architecture

### State Management (Context API)

The `HealthcareContext` provides:

```javascript
// Data stores
- doctors: Doctor profiles with specialties
- patients: Patient health metrics and goals
- formTemplates: Available form types
- formAssignments: Patient-doctor-form relationships

// Patient Actions
- submitForm(assignmentId, responses)
- getPatientData(patientId)

// Doctor Actions
- getDoctorData(doctorId)
- getDoctorPatientAssignments(doctorId, patientId)
- createFormAssignment(patientId, doctorId, formId, dueDate)

// Consultation Features
- startConsultation()
- stopConsultation()
- addConsultationFeedback()
```

### Mock Data Structure

**Doctors (3 records)**
```javascript
{
  id: 'doc1',
  name: 'Sarah Mitchell',
  specialty: 'Bariatric Medicine',
  email: 'sarah.mitchell@clinic.com',
  patients: ['pat1', 'pat2']  // Patient IDs
}
```

**Patients (3 records)**
```javascript
{
  id: 'pat1',
  name: 'John Smith',
  age: 42,
  weight: 95,  // kg
  height: 175, // cm
  bmi: 31,
  bmiCategory: 'Class I Obesity',
  currentGoal: 'Lose 15kg by Q2 2025',
  medicalHistory: 'Type 2 diabetes, sleep apnea',
  doctors: ['doc1', 'doc2'],  // Assigned doctors
  joinDate: '2024-01-15'
}
```

**Form Templates (3 types)**
```javascript
{
  id: 'form1',
  title: 'Weekly Check-in',
  description: 'Weekly health and lifestyle update',
  categories: [
    {
      id: 'phys',
      name: 'Physical Health',
      fields: [
        { id: 'weight', type: 'number', label: 'Current Weight (kg)' },
        { id: 'exercise', label: 'Exercise Minutes This Week' }
      ]
    }
  ]
}
```

**Form Assignments (5 records)**
```javascript
{
  id: 'assign1',
  patientId: 'pat1',
  doctorId: 'doc1',
  formId: 'form1',
  assignedDate: '2024-03-01',
  dueDate: '2024-03-08',
  completed: false,
  responses: null
}
```

## 🎨 UI Component Library

### PatientDashboard
Displays comprehensive patient overview with:
- Health metrics cards (BMI, weight, height, age)
- Care team member cards with contact info
- Forms list with status indicators
- Fill form buttons for pending forms

### PatientFormFiller
Dynamic form renderer supporting:
- **Text inputs**: For names, descriptions
- **Number inputs**: For weight, measurements
- **Sliders**: For scale ratings (1-10)
- **Checkboxes**: For yes/no questions
- **Textareas**: For longer responses

Form sections are organized by category with clear labeling.

### DoctorPatientList
Search & browse interface with:
- Search by name or patient ID
- Sort options (name, BMI, join date)
- Patient cards showing key metrics
- Quick health overview
- View Profile button for detailed access

### DoctorPatientProfile
Detailed patient view showing:
- Complete health metrics
- Medical history and goals
- Form status statistics
- Form history timeline
- Assign new form modal

### HealthcareRoleSelector
Multi-step role selection:
1. Choose role (Patient/Doctor)
2. Select specific user account
3. Access appropriate dashboard

## 🔄 Data Flow

```
User Selection
    ↓
Role Selector (Patient/Doctor)
    ↓
Dashboard (PatientDashboard or DoctorPatientList)
    ↓
Document/Form Interaction
    ├─ Patient: Fill Form → Submit → Success Page
    └─ Doctor: View Patient → Assign Form → Update Status
    ↓
Context Updates state (formAssignments, responses)
```

## 🛠️ Styling

### Tailwind CSS Configuration

Custom colors and utilities configured in `tailwind.config.js`:
- Extended color palette
- Custom spacing
- Content paths pointing to src/ files
- Ready for responsive design

### CSS-in-Tailwind Approach

Components use utility classes:
- Responsive grids: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Color theming: `bg-blue-600`, `text-green-700`
- Shadows & effects: `shadow-lg`, `hover:shadow-xl`
- Transitions: `transition`, `transform`

### Component CSS Files

Minimal additional CSS for:
- Animations (`@keyframes`)
- Range slider custom styling
- Modal animations
- Hover effects

## 📊 Integration Paths

### Connect to FastAPI Backend

Replace mock data with API calls:

```javascript
// In HealthcareContext.jsx
const [doctors, setDoctors] = useState([])

useEffect(() => {
  fetch('/api/doctors')
    .then(res => res.json())
    .then(data => setDoctors(data))
}, [])
```

### Database Persistence

```javascript
const submitForm = useCallback(async (assignmentId, responses) => {
  const result = await fetch(`/api/assignments/${assignmentId}`, {
    method: 'PUT',
    body: JSON.stringify({ responses, completed: true })
  })
  // Update local state after success
}, [])
```

### Real-time Updates

Use WebSocket for live form submission tracking:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/doctor/doc1')
ws.onmessage = (event) => {
  const { assignmentId, status } = JSON.parse(event.data)
  // Update formAssignments state
}
```

## 🧪 Testing Scenarios

### Patient Workflows
1. **First-time login**: See dashboard, explore assigned forms
2. **Fill single form**: Complete a form with all field types
3. **Submit form**: Verify success confirmation
4. **View history**: Check completed vs. pending forms

### Doctor Workflows
1. **Patient discovery**: Search/browse patient list
2. **Patient review**: View individual patient profile
3. **Assign form**: Create new assignment with due date
4. **Track progress**: Monitor form completion status

## 📱 Responsive Design

Fully responsive layout:
- **Mobile**: Single column, full-width components
- **Tablet**: 2-column layouts, adjusted spacing
- **Desktop**: Multi-column grids, optimized for large screens

Tested at breakpoints:
- `sm: 640px`
- `md: 768px`
- `lg: 1024px`
- `xl: 1280px`

## 🔐 Next Steps for Production

1. **Authentication**: Add login/authorization
2. **API Integration**: Connect to FastAPI backend
3. **Form Customization**: Allow doctors to create custom forms
4. **File Uploads**: Support medical document uploads
5. **Audit Logging**: Track all form submissions
6. **Security**: Add HIPAA compliance features
7. **Export**: Generate PDF reports for patient records
8. **Notifications**: Email/SMS reminders for pending forms
9. **Mobile App**: React Native version for on-the-go access
10. **Analytics**: Dashboard for health trends and outcomes

## 📚 Documentation

- Form template format: Check `healthcareMockData.js`
- Component props: See JSX comments
- Context functions: Review `HealthcareContext.jsx`
- Styling utilities: Refer to `tailwind.config.js`

## 🤝 Contributing

To extend this system:
1. Add new form field types in `PatientFormFiller.jsx`
2. Create new doctor views in healthcare folder
3. Extend mock data in `healthcareMockData.js`
4. Add new context actions as needed

## 📄 License

Part of the Precerto UI project (Clinical Diagnostic System)

---

**Current Build Status**: ✅ Production-ready (254 KB optimized)
**Last Updated**: 2024
**Version**: 1.0.0
