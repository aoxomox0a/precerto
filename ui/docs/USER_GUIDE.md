# Precerto UI - User Guide

## Overview
The Precerto Clinical System is a dual-interface platform that serves both doctors and patients. It provides diagnostic decision support tools for doctors and a symptom submission form for patients.

---

## Getting Started

### Starting the Application

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser** to `http://localhost:5173` (or the port shown in the terminal)

4. You'll see the **Role Selector** homepage

---

## System Architecture

### Two-User Interface System

```
┌─────────────────────────────────────────────┐
│         Precerto Clinical System             │
└─────────────────────────────────────────────┘
              │
              ├──────────────────┬──────────────────┐
              │                  │                  │
        ┌─────▼─────┐      ┌────▼────┐      ┌─────▼──────┐
        │   HOME     │      │  DOCTOR  │      │  PATIENT   │
        │(SELECTOR)  │      │DASHBOARD │      │   FORM     │
        └────┬────────┘      └─────────┘      └─────┬──────┘
             │                                       │
             └───────────────┬──────────────────────┘
                             │
                   ┌─────────▼──────────┐
                   │ SUBMISSION TRACKER │
                   └────────────────────┘
```

---

## User Roles

## 1. Doctor Interface 👨‍⚕️

### What Doctors Can Do:
- Record patient audio consultations
- Extract symptoms from conversations
- Generate diagnostic suggestions
- Confirm and save diagnoses

### Doctor Workflow:

1. **Click "I'm a Doctor"** on the home page
2. **Record Audio** - Select the AudioRecorder component
   - Click the microphone button to start recording
   - Speak naturally during patient consultation
   - Click to stop recording
3. **Symptom Extraction** - The system analyzes the audio transcript
   - Reviews extracted symptoms
   - Confirms or edits the list
4. **Diagnostic Reasoning** - View suggested diagnoses
   - See confidence scores
   - Read detailed explanations
   - Select the most appropriate diagnosis
5. **Confirmation** - Finalize the diagnosis
   - Review patient information
   - Add clinical notes
   - Save the diagnosis

### Features:
- 🎙️ Real-time audio recording
- 🔍 Automatic symptom parsing
- 📊 Evidence-based diagnostic suggestions
- ✍️ Clinical note annotation

---

## 2. Patient Interface 👤

### What Patients Can Do:
- Submit medical symptom information
- Provide detailed health history
- Track submission status
- Access previous submissions

### Patient Workflow:

1. **Click "I'm a Patient"** on the home page
2. **Fill Personal Information**
   - First and last name
   - Email address
   - Age and gender
3. **Enter Symptom Details**
   - Primary symptom
   - Additional symptoms (checkbox list)
   - Duration of symptoms
   - Severity level (Mild/Moderate/Severe)
4. **Provide Medical History** (optional)
   - Previous conditions
   - Current medications
   - Additional notes
5. **Submit the Form**
   - You'll receive a **Submission ID**
   - **Save this ID** to track your evaluation

### Important: Saving Your Submission ID

When you submit a form, you'll receive a unique **Submission ID** like:
```
PAT-1234567890
```

**This ID is essential** for accessing your submitted information later. Write it down or save it somewhere safe.

---

## Accessing Completed Submissions

### For Patients: How to View Your Submissions

#### Method 1: Direct Search
1. Click **"View My Submissions"** on the home page
2. Enter your **Submission ID** in the search box
3. Click **"Search"**
4. Your complete medical form details will appear

#### Method 2: Browse All Submissions
1. Click **"View My Submissions"** on the home page
2. All your submitted forms will be listed chronologically
3. Click any submission to view full details

### What You Can Do With Your Submission:
- 📖 **View** - See all your submitted information
- 💾 **Export** - Download as JSON file
- 🖨️ **Print** - Print or save as PDF
- 🔍 **Search** - Find specific submissions by ID

---

## Submission ID Format

```
PAT-<timestamp>
Example: PAT-1713881234567
```

**Breaking it down:**
- `PAT-` = Patient submission prefix
- `<timestamp>` = Unix timestamp of submission

---

## Data Storage

### Local Storage (Demo Mode)
In this demo version:
- ✅ Patient forms are stored in **browser's localStorage**
- ✅ Data persists across browser sessions
- ✅ Each browser stores its own data separately

### Important Notes:
⚠️ **Data is stored locally** - Never share your browser if you want privacy
⚠️ **Clearing browser data** will delete submissions
⚠️ **Different browsers** have separate storage

### Production Deployment
When deployed to production, data will be:
- Stored in a secure backend database
- Encrypted for privacy compliance
- Accessible across devices with authentication

---

## Complete Feature Comparison

| Feature | Doctor | Patient |
|---------|--------|---------|
| Audio Recording | ✅ | ❌ |
| Diagnostic Tools | ✅ | ❌ |
| Symptom Submission | ❌ | ✅ |
| Medical History | ❌ | ✅ |
| View Submissions | ❌ | ✅ |
| Export Data | ❌ | ✅ |
| Print Reports | ❌ | ✅ |

---

## Example Workflow

### Complete Patient Journey:

1. **Patient visits** `http://localhost:5173`
2. **Clicks** "I'm a Patient"
3. **Fills form:**
   - Name: John Smith
   - Email: john@email.com
   - Primary symptom: Headache
   - Duration: 3 days
   - Severity: Moderate
4. **Receives:** `PAT-1713881234567`
5. **Later, patient returns** home
6. **Clicks** "View My Submissions"
7. **Enters ID:** `PAT-1713881234567`
8. **Views** complete medical record
9. **Exports** as JSON or prints

### Complete Doctor Journey:

1. **Doctor visits** `http://localhost:5173`
2. **Clicks** "I'm a Doctor"
3. **Starts consultation:**
   - Records patient conversation
   - System extracts symptoms automatically
   - Generates diagnostic suggestions
   - Doctor confirms diagnosis
4. **Session ends** - ready for next patient

---

## Troubleshooting

### "Submission not found" error
- ✅ Double-check your Submission ID
- ✅ Make sure you're using the correct browser (data is stored locally)
- ✅ Clear browser cache isn't enabled

### Audio recording not working
- ✅ Check browser microphone permissions
- ✅ Ensure you're using a modern browser (Chrome, Firefox, Edge, Safari)
- ✅ Try refreshing the page

### Data not persisting
- ✅ Browser's localStorage might be disabled
- ✅ Try a different browser
- ✅ Check if you're in private/incognito mode

---

## Technology Stack

- **Frontend Framework:** React 18
- **Routing:** React Router v6
- **Build Tool:** Vite
- **Storage:** Browser localStorage (demo) / Backend DB (production)
- **Styling:** CSS3 with modern features

---

## Available Routes

| Route | Purpose |
|-------|---------|
| `/` | Home page with role selector |
| `/doctor` | Doctor diagnostic interface |
| `/patient` | Patient symptom submission form |
| `/submissions` | Patient submission tracker & viewer |

---

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

---

## Privacy & Compliance

This system handles sensitive medical data. Important considerations:

- 🔒 **Local Storage**: Demo uses browser storage (clear before production)
- 🔐 **HIPAA Compliance**: Implement proper encryption in production
- 👤 **Patient Privacy**: Never share browser sessions
- ✅ **Data Retention**: Follow local regulations for medical record retention

See [COMPLIANCE.md](./COMPLIANCE.md) for full compliance details.

---

## API Integration (When Backend Ready)

The system is designed to integrate with a backend API. See [API_INTEGRATION.md](./API_INTEGRATION.md) for:
- Endpoint specifications
- Authentication requirements
- Data validation rules

---

## Support & Documentation

- 📖 **README.md** - Project overview
- 📋 **COMPLIANCE.md** - Legal and compliance info
- 🔌 **API_INTEGRATION.md** - Backend integration guide
- ⚡ **QUICKSTART.md** - Quick start instructions

---

## Version Information

- **Project Version:** 1.0.0
- **React Version:** 18.2.0
- **React Router:** v6
- **Vite:** 5.0.0

---

**Last Updated:** April 23, 2026

For more information, visit the project repository or contact the development team.
