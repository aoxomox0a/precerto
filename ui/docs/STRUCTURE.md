# UI Structure - One App, Clear Separation

This is a single React application with clear code separation by user role.

## 📁 Folder Organization

```
ui/
├── patient/              # Patient portal components & pages
│   ├── components/       # Patient-specific React components
│   │   ├── PatientDashboard.jsx
│   │   └── PatientFormFiller.jsx
│   └── pages/            # Patient page routes
│       └── patient/
│
├── doctor/               # Doctor dashboard components & pages
│   ├── components/       # Doctor-specific React components
│   │   ├── DoctorDashboard.jsx
│   │   ├── DoctorPatientList.jsx
│   │   └── DoctorPatientProfile.jsx
│   └── pages/            # Doctor page routes
│       └── doctor/
│
├── shared/               # Shared across both roles
│   ├── components/       # Reusable components
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   ├── FormStepper.jsx
│   │   ├── Buttons.jsx
│   │   └── ...
│   └── utils/            # Shared utilities
│
├── src/                  # Main app structure (unchanged)
│   ├── components/       # All components (original location)
│   ├── pages/            # All pages (original location)
│   ├── App.jsx           # Main router
│   ├── main.jsx          # Entry point
│   ├── context/          # HealthcareContext
│   ├── store/            # AppProvider
│   └── ...
│
└── package.json          # One app - shared dependencies

```

## 🎯 Usage

The app works exactly as before - **same logic, same styles, same routing**. The separation is purely for code organization.

### Routes
- `/patient` - Patient dashboard
- `/doctor` - Doctor dashboard
- `/healthcare/*` - Healthcare system entry

### Component Imports

**Patient Components:**
```jsx
import PatientDashboard from '../patient/components/PatientDashboard'
import PatientFormFiller from '../patient/components/PatientFormFiller'
```

**Doctor Components:**
```jsx
import DoctorDashboard from '../doctor/components/DoctorDashboard'
import DoctorPatientList from '../doctor/components/DoctorPatientList'
```

**Shared Components:**
```jsx
import { Header, Sidebar, Buttons } from '../shared/components'
```

## 📝 Key Points

✅ **One App** - Runs on a single dev server, single build
✅ **Clear Separation** - Patient and Doctor code organized separately
✅ **Easy Navigation** - Contributors know where to find role-specific code
✅ **No Logic Changes** - App behaves identically to before
✅ **Shared Resources** - Common components, context, and utilities shared between roles

## 🚀 Running the App

```bash
cd ui
npm install
npm run dev
```

App runs at `http://localhost:5173` (or configured port)
