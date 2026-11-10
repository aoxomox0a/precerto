# Quick Reference - Healthcare App File Guide

## 📍 Where to Find Things

### Component Files
```
src/healthcare/
├── HealthcareRoleSelector.jsx      ← START HERE: Landing page
├── PatientDashboard.jsx            ← Patient main view
├── PatientFormFiller.jsx           ← Form submission interface
├── DoctorDashboard.jsx             ← Doctor navigation hub
├── DoctorPatientList.jsx           ← Doctor's patient browser
└── DoctorPatientProfile.jsx        ← Individual patient management
```

### Data & State
```
src/
├── context/HealthcareContext.jsx   ← All state functions
├── utils/healthcareMockData.js     ← Demo data (edit here!)
└── App.jsx                         ← Routes setup (healthcare added)
```

### Configuration
```
|- package.json                      ← Dependencies
|- vite.config.js                   ← Vite config
|- tailwind.config.js               ← Tailwind CSS setup
|- postcss.config.js                ← PostCSS config
└─ index.html                       ← Entry point
```

### Documentation
```
|- HEALTHCARE_README.md             ← Main documentation
|- HEALTHCARE_IMPLEMENTATION_GUIDE.md  ← Detailed guide
|- HEALTHCARE_COMPLETION_REPORT.md  ← What was built
└─ HEALTHCARE_QUICK_REFERENCE.md   ← This file!
```

---

## 🎯 Common Tasks

### Add a New Patient
**File**: `src/utils/healthcareMockData.js`
```javascript
// Find mockPatients array, add:
{
  id: 'pat4',
  name: 'New Patient Name',
  age: 45,
  weight: 90,
  height: 175,
  bmi: 29,
  bmiCategory: 'Overweight',
  currentGoal: 'Lose 10kg',
  medicalHistory: 'Type 2 diabetes',
  doctors: ['doc1', 'doc2'],
  joinDate: '2024-03-15'
}
```

### Add a New Doctor
**File**: `src/utils/healthcareMockData.js`
```javascript
// Find mockDoctors array, add:
{
  id: 'doc4',
  name: 'Dr. New Name',
  specialty: 'Endocrinology',
  email: 'doctor@clinic.com',
  patients: ['pat1', 'pat3']
}
```

### Add a New Form Type
**File**: `src/utils/healthcareMockData.js`
```javascript
// Find mockFormTemplates array, add:
{
  id: 'form4',
  title: 'New Form Title',
  description: 'Form description',
  categories: [
    {
      id: 'cat1',
      name: 'Section Name',
      fields: [
        { id: 'field1', type: 'text', label: 'Field Label' },
        { id: 'field2', type: 'number', label: 'Number Field', min: 0, max: 100 }
      ]
    }
  ]
}
```

### Assign Forms to Patient
**File**: `src/utils/healthcareMockData.js`
```javascript
// Find mockFormAssignments array, add:
{
  id: 'assign6',
  patientId: 'pat1',
  doctorId: 'doc2',
  formId: 'form2',
  assignedDate: '2024-03-10',
  dueDate: '2024-03-17',
  completed: false,
  responses: null
}
```

### Change Styles
**Files**: `src/healthcare/*.css`
- Each component has its own CSS file
- Add custom animations, colors, spacing
- All Tailwind utilities available in JSX

### Modify Patient Form Fields
**File**: `src/healthcare/PatientFormFiller.jsx`
- Currently supports: text, number, textarea, slider, checkbox
- To add new type: Add case in field rendering logic
- Check lines ~50-120 for field type implementations

### Add New Context Function
**File**: `src/context/HealthcareContext.jsx`
```javascript
// Add new function before value object:
const myNewFunction = useCallback((param) => {
  // Implementation
}, [dependencies])

// Add to value export:
const value = {
  // ... existing fields
  myNewFunction  // Add here
}
```

---

## 🔧 Configuration Files

### tailwind.config.js
Controls:
- Color palette
- Font sizes
- Spacing
- Content paths

### vite.config.js
Controls:
- Build options
- Dev server port
- Plugins

### postcss.config.js
Controls:
- Tailwind CSS processing
- Autoprefixer
- CSS plugins

---

## 🎨 Styling Reference

### Common Tailwind Classes Used
```css
/* Colors */
bg-blue-600, bg-purple-600, bg-green-600
text-gray-800, text-white
border-blue-600, border-gray-300

/* Spacing */
p-4, p-6, p-8 (padding)
m-4, my-6 (margin)
gap-4, gap-6 (grid/flex gap)

/* Layout */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
flex flex-col md:flex-row
w-full md:w-1/2

/* Effects */
shadow-lg, shadow-xl
rounded-lg
border-l-4
hover:shadow-xl
transition transform hover:scale-105

/* Text */
font-bold, font-semibold
text-lg, text-2xl, text-4xl
text-center
```

### Component Color Scheme
```
Patient Cards:      Blue (#2563eb)
Doctor Cards:       Purple (#7c3aed)
Success States:     Green (#16a34a)
Warning States:     Orange (#ea580c)
Error States:       Red (#dc2626)
Neutral:            Gray (#1f2937)
```

---

## 📊 Context API Reference

### Available Functions

```javascript
// Patient Functions
submitForm(assignmentId, responses)
getPatientData(patientId)

// Doctor Functions
getDoctorData(doctorId)
getDoctorPatientAssignments(doctorId, patientId)
createFormAssignment(patientId, doctorId, formId, dueDate)

// Data Stores
doctors[]
patients[]
formTemplates[]
formAssignments[]
```

### Usage Example
```javascript
import { useHealthcare } from '../context/HealthcareContext'

function MyComponent() {
  const { getPatientData, submitForm } = useHealthcare()
  
  const { patient, forms } = getPatientData('pat1')
  
  // Use patient and forms...
}
```

---

## 🚀 Important Files to Know

### Entry Point
**HealthcareRoleSelector.jsx** (Line 1)
- Where users start
- Role selection logic
- User selection UI

### Main Patient View
**PatientDashboard.jsx**
- Shows patient's dashboard
- Displays health metrics
- Lists all forms
- Jump point to form filler

### Form Handler
**PatientFormFiller.jsx**
- Renders dynamic forms
- Handles field inputs
- Manages form submission
- Shows success screen

### Doctor Hub
**DoctorDashboard.jsx**
- Container for doctor views
- Switches between patient list and profile
- Navigation management

### Patient Browser
**DoctorPatientList.jsx**
- Displays all doctor's patients
- Search & sorting
- Patient card display
- Navigation to profile

### Patient Management
**DoctorPatientProfile.jsx**
- Shows individual patient details
- Form history timeline
- Assignment modal
- Statistics display

### State Management
**HealthcareContext.jsx** (80+ lines)
- All state variables
- All functions
- Provider setup
- Hook for components

### Demo Data
**healthcareMockData.js** (50+ lines)
- mock doctors
- mock patients
- mock form templates
- mock assignments
- Helper functions

---

## 🔍 Debugging Tips

### Check Patient's Forms
```javascript
// In browser console:
const context = useHealthcare()
const patientData = context.getPatientData('pat1')
console.log(patientData.forms)
```

### Check Doctor's Patients
```javascript
const doctorData = context.getDoctorData('doc1')
console.log(doctorData.patients)
```

### View Form Assignments
```javascript
const assignments = context.getDoctorPatientAssignments('doc1', 'pat1')
console.log(assignments)
```

### Check All State
Open React DevTools → Components → HealthcareProvider

---

## 📈 File Dependencies

```
App.jsx
  ↓
  └─→ HealthcareRoleSelector.jsx
        ├─ DoctorDashboard.jsx
        │  ├─ DoctorPatientList.jsx
        │  └─ DoctorPatientProfile.jsx
        │
        └─ PatientDashboard.jsx
           └─ PatientFormFiller.jsx

All components depend on:
  ✓ HealthcareContext.jsx
  ✓ healthcareMockData.js
```

---

## 💡 Pro Tips

1. **Dark Mode**: Add in tailwind.config.js:
   ```javascript
   darkMode: 'class'
   ```

2. **Add Form Field Type**: Copy existing type in PatientFormFiller.jsx and modify

3. **Change Colors**: Edit `mockDoctors` objects to use different specialties

4. **Performance**: Use `memo()` for form field components if needed

5. **Testing**: Use mock data as-is, it's realistic and comprehensive

---

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Styles not appearing | Check tailwind.config.js content paths |
| Form not submitting | Verify all fields have values, check console |
| Can't find patient | Ensure patient ID in doctors.patients array |
| Build fails | Run `npm install`, check Node version |
| Dev server won't start | Check port 3000/3001 not in use |

---

## 📚 File Stats

| File | Lines | Type |
|------|-------|------|
| HealthcareRoleSelector.jsx | 227 | Component |
| PatientDashboard.jsx | 200 | Component |
| PatientFormFiller.jsx | 178 | Component |
| DoctorPatientProfile.jsx | 246 | Component |
| DoctorPatientList.jsx | 142 | Component |
| HealthcareContext.jsx | 180 | Context |
| healthcareMockData.js | 62 | Data |
| **Total** | **~1,100** | **Code** |

---

## ✅ Validation Checklist

Before deploying:
```
☐ All components render without errors
☐ Patient can fill and submit forms
☐ Doctor can view patients and assign forms
☐ Form data persists in state
☐ Navigation works between views
☐ Responsive design looks good
☐ No console errors
☐ Build completes successfully
```

---

**Quick Start Command**: 
```bash
npm run dev
# Navigate to: http://localhost:3001/healthcare/
```

**Happy coding!** 🚀
