# DDSS Backend

FastAPI backend for the Integrated Diagnostic Decision Support System (DDSS).

## Features

- **Real-Time Audio Ingestion (TR-01)**: Continuous capture and transcription using whisper.cpp
- **Stateful Context Memory (TR-02)**: Rolling context window to track active subjects
- **Deterministic Graph Reasoning (TR-03)**: SNOMED CT-based reasoning with Neo4j
- **Explainable AI (SR-02)**: Display reasoning paths for clinician validation
- **EHR Interoperability**: SMART on FHIR support (CR-01)
- **Multi-tenant SaaS**: Secure data isolation per clinic (CR-03)

## Setup

1. Install dependencies using `uv`:
   ```bash
   cd ..
   uv sync
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Run development server:
   ```bash
   uv run python backend/main.py
   ```

The API will be available at `http://localhost:8000`

## API Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Architecture

```
app/
├── api/           # API routes
├── core/          # Configuration and core utilities
├── models/        # Pydantic schemas
├── services/      # Business logic
│   ├── audio_service.py      # Audio transcription
│   ├── context_service.py    # Context management
│   └── reasoning_service.py  # Graph reasoning
```
