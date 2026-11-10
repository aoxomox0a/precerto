# 🚀 Quick Start Guide - Precerto UI

## Installation & Running

### Step 1: Install Dependencies
```bash
cd "Precerto UI react"
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

The app will open automatically at `http://localhost:3000`

---

## 📋 User Workflow

### Phase 1: Audio Recording 🎤
1. Click **"🎤 Start Recording"**
2. Speak the clinical dialogue naturally
3. Click **"⏹️ Stop Recording"** when done
4. Wait for audio processing (~1-2 seconds)

**Example dialogue:**
> "Patient reports fever of 38.5 degrees for 3 days. Also complains of persistent dry cough and mild shortness of breath. Started with headache and sore throat. Fatigue is getting worse."

---

### Phase 2: Symptom Extraction 📋
1. **Review** the transcription (automatically generated)
2. **Edit** if needed for accuracy
3. **Verify** extracted symptoms are correct
4. **Add** any additional symptoms:
   - Enter symptom name
   - Select severity (Low/Moderate/High)
   - Click "+ Add"
5. Click **"Next: Diagnostic Reasoning →"**

**Extracted symptoms include:**
- Fever, Cough, Headache, Fatigue, Sore Throat, Shortness of Breath, etc.

---

### Phase 3: Diagnostic Reasoning 🔍
1. **Review** all differential diagnoses
2. **Click "▶ Show Details"** to expand each diagnosis and see:
   - Clinical features matching
   - Supportive findings
   - AI reasoning explanation
   - Recommended next steps
3. **Select** the most appropriate diagnosis
4. Click **"Select & Continue"**

**Example diagnoses generated:**
- Upper Respiratory Infection (85% confidence)
- Viral Pneumonia (72% confidence)
- Influenza (68% confidence)
- COVID-19 (65% confidence)

---

### Phase 4: Clinician Confirmation ✓
1. **Review** the primary diagnosis
2. **Assess** your confidence level:
   - Low / Moderate / High / Very High
3. **Specify Treatment Plan:**
   - Medications & dosages
   - Duration of treatment
   - Follow-up schedule
4. **Add Recommended Tests:**
   - CBC, Chest X-ray, PCR, etc.
   - Click "+ Add" for each test
5. **Add Clinical Notes** (optional)
6. Click **"✓ Confirm & Save"**

---

## 🎯 Complete 4-Stage Workflow

```
┌─────────────────┐
│  Audio Record   │  Speak clinical encounter
│  🎤 Recording   │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Symptom Extract │  Review & edit symptoms
│  📋 Symptoms    │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Diagnostic      │  View AI suggestions
│  🔍 Reasoning   │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Clinician       │  Confirm & document
│  ✓ Confirm      │
└─────────────────┘
```

---

## 💡 Key Features

### 🎤 Audio Recording
- Real-time waveform visualization
- Timer display
- Automatic transcription simulation
- Microphone access permission request

### 📋 Smart Symptom Extraction
- AI-powered keyword detection
- Severity levels (Low/Moderate/High)
- Confidence scoring
- Customizable onset and duration

### 🔍 Differential Diagnoses
- Multiple diagnoses ranked by confidence
- ICD-10 coding
- Clinical feature matching
- Evidence-based explanations
- Risk priority assessment

### ✓ Clinical Documentation
- Structured treatment planning
- Test ordering interface
- Clinical notes documentation
- Confidence level recording
- Audit trail ready

---

## 📊 UI Components Overview

| Component | Purpose |
|-----------|---------|
| **Header** | App branding & navigation header |
| **AudioRecorder** | Microphone input & sound visualization |
| **SymptomExtraction** | Symptom review & manual editing |
| **DiagnosticReasoning** | Diagnosis selection interface |
| **ClinicianConfirmation** | Final decision & documentation |

---

## 🎨 Color Meanings

| Color | Meaning |
|-------|---------|
| 🟣 Purple/Blue | Primary actions, links |
| 🟢 Green | Success, positive actions, confirmed |
| 🟠 Orange | Warning, moderate priority |
| 🔴 Red | Danger, high priority, critical |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Submit form / Add item |
| `Tab` | Navigate between fields |
| `Esc` | Cancel input |

---

## 🐛 Troubleshooting

### Microphone Not Working?
1. Check browser permissions
2. Allow microphone access when prompted
3. Check system microphone settings
4. Try refreshing the page

### Audio Not Recording?
- Ensure microphone is not muted
- Check system volume levels
- Try a different microphone
- Clear browser cache

### Symptoms Not Extracting?
- Verify transcription text contains symptom keywords
- Add symptoms manually if auto-detection fails
- Check for typos in symptom names

### Slow Response?
- This is normal for demo (simulated delays)
- In production, connect to real APIs
- Check internet connection

---

## 📱 Responsive Design

Works on:
- ✅ Desktop (1200px+)
- ✅ Tablet (768px - 1200px)
- ✅ Mobile (< 768px)

---

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# View production build
npm run preview
```

---

## 📚 Project Files

**Key Files:**
- `src/App.jsx` - Main app logic & state management
- `src/components/` - All React components
- `src/utils/diagnosticLogic.js` - AI & algorithm functions
- `src/styles/global.css` - Design system & utilities
- `index.html` - Entry point
- `package.json` - Dependencies & scripts

---

## 🚀 Next Steps

### For Development:
1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Modify components in `src/components/`
4. Changes auto-reload in browser

### For Deployment:
1. Build: `npm run build`
2. Deploy `dist/` folder to web server
3. Configure environment variables
4. Set up backend API endpoints

### For Production:
1. Connect real speech-to-text API
2. Implement NLP symptom extraction
3. Integrate ML diagnosis model
4. Set up database & authentication
5. Ensure HIPAA/clinical compliance

---

## 💬 Example Test Scenarios

### Test 1: URI (Upper Respiratory Infection)
**Speak:** "Patient has sore throat, fever of 38 degrees, persistent dry cough, and headache. Started 3 days ago. Also reports fatigue."
**Expected:** URI should be top diagnosis

### Test 2: Pneumonia  
**Speak:** "High fever 39 degrees, severe cough, shortness of breath, fatigue. Chest pain when breathing. Duration 1 week."
**Expected:** Pneumonia should be high priority

### Test 3: Generic Symptoms
**Speak:** "General malaise and fatigue for several days."
**Expected:** Multiple diagnoses, manually add specific symptoms

---

## ✨ Tips for Best Results

1. **Speak clearly** - Proper articulation improves transcription
2. **Be specific** - Include temperature readings, onset times
3. **Describe context** - Recent travel, sick contacts, medical history
4. **Use clinical terms** - "dyspnea" vs "trouble breathing"
5. **Include timeline** - When symptoms started and how they progressed
6. **Note severity** - Specify if symptoms are worsening or stable

---

## 🔗 Output Structure

Each diagnosis includes:
```json
{
  "id": "unique-id",
  "name": "Disease Name",
  "code": "ICD-10-CODE",
  "confidence": 0.85,
  "likelihood": 78,
  "priority": "moderate|high|critical",
  "clinicalFeatures": [...],
  "supportiveFindings": [...],
  "nextSteps": [...]
}
```

---

## 📖 Clinical Summary

After confirmation, the system generates a comprehensive clinical report with:
- Patient transcript
- Extracted symptoms (with severity)  
- Primary diagnosis (with ICD-10 code)
- AI confidence score
- Clinician notes
- Treatment plan
- Recommended tests
- Date/time stamp

---

For more details, see [README.md](./README.md)
