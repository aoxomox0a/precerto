# 🚀 Quick Start Guide - Precerto UI

## Installation & Running

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:3000`

---

## 🎯 How to Test the Application

### 1. **Patient Portal Test** (`/patient`)

**Path**: Click "I'm a Patient" on home page → `/patient`

**What you can do**:
- ✅ View welcome message with patient name
- ✅ See 3 sample forms assigned to you
- ✅ Click **"Start"** on "Cardiac Risk Screening" form
- ✅ Go through form step-by-step
- ✅ See progress bar update as you answer questions
- ✅ Submit form and see completion
- ✅ Check notification bell for form updates

**Test Data**:
- Default patient: John Smith
- Forms: Initial Assessment, Cardiac Screening, Follow-up
- Expected statuses: Pending, In Progress, Completed

---

### 2. **Doctor Dashboard Test** (`/doctor`)

**Path**: Click "I'm a Doctor" on home page → `/doctor`

**Overview Tab**:
- ✅ See statistics: Total patients, pending forms, upcoming consultations

**Patients Tab**:
- ✅ View list of assigned patients (John Smith, Alice Brown, Robert Wilson)
- ✅ Click **"+ Add Patient"** button
- ✅ Fill patient form with: name, age, email, medical history
- ✅ Patient appears in list immediately
- ✅ Click **"Remove"** to delete patient

**Forms Tab**:
- ✅ View created forms
- ✅ Click **"+ Create Form"** button
- ✅ Fill form title and description
- ✅ Form created with default questions
- ✅ Click **"→ Assign Form"** to assign to patient
- ✅ Select form and patient, click assign
- ✅ Patient receives notification

**Consultations Tab**:
- ✅ View scheduled consultations
- ✅ Click **"+ Schedule Consultation"** button
- ✅ Fill title, select patient, set datetime
- ✅ Consultation is added to list

---

## 📱 Key Features to Test

### Real-Time Notifications
1. Doctor assigns form to patient
2. Check patient notifications (bell icon)
3. New notification appears automatically
4. Click to mark as read

### Form Progress Tracking
1. Start a form as patient
2. See progress bar fill up
3. Click "Next" to go through steps
4. Progress updates in real-time
5. See completion percentage

### Auto-Generated Data
1. Try switching between patients in dropdown
2. Each patient has their own forms and notifications
3. Try switching between doctors in dropdown
4. Each doctor has their own patients and forms

---

## 🔍 Testing Checklist

### Patient Interface
- [ ] Load patient portal
- [ ] View all assigned doctors
- [ ] See all forms (pending, in progress, completed)
- [ ] Click form to start
- [ ] See form step-by-step UI
- [ ] Complete form and submit
- [ ] See progress update to 100%
- [ ] Check notifications
- [ ] See new form notification

### Doctor Interface
- [ ] Load doctor dashboard
- [ ] See overview statistics
- [ ] Switch to Patients tab
- [ ] Add new patient
- [ ] See patient in list
- [ ] Switch to Forms tab
- [ ] Create new form
- [ ] Assign form to patient
- [ ] Switch to Consultations tab
- [ ] Schedule consultation
- [ ] Check notifications

---

## 🎨 UI Elements to Verify

### Color Scheme
- Primary: Blue (#667eea)
- Success: Green (#48bb78)
- Warning: Orange (#ed8936)
- Danger: Red (#f56565)

### Components
- ✅ Cards with hover effects
- ✅ Buttons with different variants
- ✅ Progress bars
- ✅ Badge status indicators
- ✅ Form inputs and selects
- ✅ Notification panels
- ✅ Tab navigation
- ✅ Sidebar navigation

---

## 💡 Example Workflows

### Workflow 1: Patient Completes Form
1. Go to `/patient`
2. Click "Start" on "Cardiac Risk Screening"
3. Answer each question (radio, textarea, number)
4. Click "Next" to proceed
5. Click "Submit" on last question
6. Form status changes to "Completed"
7. Progress shows 100%

### Workflow 2: Doctor Assigns Form
1. Go to `/doctor`
2. Click "Forms" tab
3. Click "→ Assign Form"
4. Select form: "Initial Health Assessment"
5. Select patient: "Alice Brown"
6. Click "Assign"
7. Go to `/patient` (Alice Brown)
8. See new form appears in list
9. Check notifications for new form alert

### Workflow 3: Doctor Adds Patient
1. Go to `/doctor`
2. Click "Patients" tab
3. Click "+ Add Patient"
4. Enter:
   - Name: "Jane Doe"
   - Age: "35"
   - Email: "jane@email.com"
   - History: "Diabetes, Hypertension"
5. Click "Add Patient"
6. Jane Doe appears in patient list

---

## 🐛 Troubleshooting

### Forms not showing?
- Check if patient is selected in dropdown
- Verify in mock data that patient has assigned doctors
- Check browser console for errors

### Notifications not appearing?
- Click notification bell icon
- Check if notifications have been marked as read
- Try adding new patient to trigger notification

### Styles look broken?
- Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)
- Restart development server (`npm run dev`)
- Check if CSS files are in `/src/components/shared/`

---

## 📊 Mock Data IDs

### Doctors
- `doc-001`: Dr. Sarah Johnson (Cardiology)
- `doc-002`: Dr. Michael Chen (Pulmonology)
- `doc-003`: Dr. Emily Rodriguez (Gastroenterology)

### Patients
- `pat-001`: John Smith, age 45
- `pat-002`: Alice Brown, age 38
- `pat-003`: Robert Wilson, age 62

### Forms
- `form-001`: Initial Health Assessment
- `form-002`: Cardiac Risk Screening
- `form-003`: Post-Consultation Follow-up

---

## 🔗 URLs to Test

```
/                          → Role selector
/patient                   → Patient portal
/doctor                    → Doctor dashboard
/doctor-legacy             → Original doctor dashboard
/patient-legacy            → Original patient form
/submissions               → Original submissions tracker
/healthcare/*              → Healthcare app (separate system)
```

---

## 📝 Notes

- Mock data resets when you refresh the page
- Notifications persist during your session
- Form responses auto-save in React Context
- No backend calls (all in-memory state)
- Audio recording feature requires microphone permission

---

## 🎓 Learning Resources

- How state management works: Check `AppProvider.jsx`
- How forms are structured: Check `mockData.js`
- Component composition: Check `PatientHub.jsx` and `DoctorHub.jsx`
- Styling approach: Check `*.css` files in `components/shared/`

---

**Ready to test? Start with `npm run dev` and explore! 🚀**
