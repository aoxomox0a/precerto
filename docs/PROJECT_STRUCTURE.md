# Project Structure

This document describes the overall structure of the Integrated Diagnostic Decision Support System (DDSS) project.

## Directory Layout

```
scm-smmatt_od/
├── backend/                    # FastAPI Python backend
│   ├── main.py                # Application entry point
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Environment variables template
│   └── app/
│       ├── api/               # API routes
│       ├── core/              # Configuration and core utilities
│       ├── models/            # Pydantic schemas
│       └── services/          # Business logic
│           ├── audio_service.py       # Real-time audio ingestion (TR-01)
│           ├── context_service.py    # Stateful context memory (TR-02)
│           └── reasoning_service.py  # Graph reasoning (TR-03)
│
├── web/                       # Next.js clinician dashboard
│   ├── README.md
│   ├── .env.example
│   └── pages/
│       ├── dashboard.tsx
│       ├── consultation/
│       └── patient-history/
│
├── mobile/                    # Mobile-adapted patient portal (Next.js)
│   ├── README.md
│   ├── .env.example
│   └── pages/
│       ├── index.tsx
│       ├── consultation-history.tsx
│       └── health-summary.tsx
│
├── docs/                      # Project documentation
│   ├── requirements.md        # Detailed system requirements
│   └── bmc.md                 # Business Model Canvas
│
├── ard/                       # Architecture Decision Records
│   ├── adr-01-pipeline.md
│   ├── adr-02-server.md
│   └── ...
│
└── README.md                  # Project overview
```

## Key Components

### Backend (Python/FastAPI)

**Technical Requirements:**
- TR-01: Real-time audio ingestion with whisper.cpp for zero-latency transcription
- TR-02: Stateful context memory to prevent conversational drift
- TR-03: Deterministic graph reasoning using Neo4j and SNOMED CT

**Key Services:**
- `AudioService`: Handles audio transcription
- `ContextService`: Manages consultation context
- `ReasoningService`: Implements diagnostic reasoning

### Web (React/Next.js - Clinician)

**Audience:** Doctors and medical professionals

**Key Features:**
- SR-01: Zero-friction workflow (no manual data entry during live consultation)
- SR-02: Explainable AI with visible reasoning paths
- SR-03: Active clinician confirmation to mitigate automation bias

**UI Components:**
- Consultation dashboard
- Patient history viewer
- Diagnostic suggestion display with reasoning

### Mobile (React/Next.js - Patient)

**Audience:** Patients

**Key Features:**
- Mobile-first responsive design
- Access consultation history
- View health information
- Educational content

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Backend | Python/FastAPI | Real-time API, WebSocket support |
| Web Frontend | React/Next.js 14+ | Clinician dashboard |
| Mobile Frontend | React/Next.js 14+ | Patient portal (mobile-adapted) |
| Database | Neo4j | Graph reasoning with SNOMED CT |
| Audio Processing | whisper.cpp | Local, zero-latency transcription |
| NLP | SciSpacy | Entity extraction and linking |
| EHR | SMART on FHIR | Hospital integration |

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Neo4j 5+

### Setup

1. **Backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   python main.py
   ```

2. **Web:**
   ```bash
   cd web
   npm install
   cp .env.example .env.local
   npm run dev
   ```

3. **Mobile:**
   ```bash
   cd mobile
   npm install
   cp .env.example .env.local
   npm run dev
   ```

## Development

### Environment Variables

Each component has an `.env.example` file. Copy to `.env` (backend) or `.env.local` (frontend) and update values.

### Documentation

- System Requirements: [docs/requirements.md](docs/requirements.md)
- Architecture Decisions: [ard/](ard/)
- Business Model: [docs/bmc.md](docs/bmc.md)

## API Endpoints

- Health Check: `GET /health`
- WebSocket Audio: `WS /ws/audio`
- Start Consultation: `POST /api/consultation/start`
- Get Diagnosis: `POST /api/reasoning/diagnose`
- End Consultation: `POST /api/consultation/end`

See `backend/app/api/routes.py` for full API documentation.
