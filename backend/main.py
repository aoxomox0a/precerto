from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import routes
from app.core import config
from contextlib import asynccontextmanager
from sqlalchemy import inspect, text
from app.db.database import Base, engine
import app.db.models  # noqa: F401

# import cached dependency functions
from app.api.routes import router, get_nlp_service, get_reasoning_service

# --- The database creation and seeding logic has been migrated ---
# Use `python backend/scripts/create_schema.py` to build tables.
# Use `python backend/scripts/seed_mock_data.py` to populate them.

import warnings

warnings.filterwarnings(
    "ignore", message=".*The component 'matcher' does not have any patterns defined.*"
)


def ensure_consultation_schema() -> None:
    inspector = inspect(engine)

    if inspector.has_table("patients"):
        patient_columns = {column["name"] for column in inspector.get_columns("patients")}
        patient_add_columns = []

        if "city" not in patient_columns:
            patient_add_columns.append("ALTER TABLE patients ADD COLUMN city TEXT")
        if "latitude" not in patient_columns:
            patient_add_columns.append("ALTER TABLE patients ADD COLUMN latitude REAL")
        if "longitude" not in patient_columns:
            patient_add_columns.append("ALTER TABLE patients ADD COLUMN longitude REAL")
        if "location_source" not in patient_columns:
            patient_add_columns.append("ALTER TABLE patients ADD COLUMN location_source TEXT")

        if patient_add_columns:
            with engine.begin() as connection:
                for statement in patient_add_columns:
                    connection.execute(text(statement))

    if inspector.has_table("consultations"):
        consultation_columns = {column["name"] for column in inspector.get_columns("consultations")}
        add_columns = []

        if "notes" not in consultation_columns:
            add_columns.append("ALTER TABLE consultations ADD COLUMN notes TEXT")
        if "results_json" not in consultation_columns:
            add_columns.append("ALTER TABLE consultations ADD COLUMN results_json TEXT")
        if "recording_file_path" not in consultation_columns:
            add_columns.append("ALTER TABLE consultations ADD COLUMN recording_file_path TEXT")
        if "recording_original_name" not in consultation_columns:
            add_columns.append("ALTER TABLE consultations ADD COLUMN recording_original_name TEXT")
        if "recording_mime_type" not in consultation_columns:
            add_columns.append("ALTER TABLE consultations ADD COLUMN recording_mime_type TEXT")
        if "recording_size_bytes" not in consultation_columns:
            add_columns.append("ALTER TABLE consultations ADD COLUMN recording_size_bytes INTEGER")
        if "recording_duration_seconds" not in consultation_columns:
            add_columns.append("ALTER TABLE consultations ADD COLUMN recording_duration_seconds INTEGER")
        if "recording_sample_rate" not in consultation_columns:
            add_columns.append("ALTER TABLE consultations ADD COLUMN recording_sample_rate INTEGER")
        if "recording_channels" not in consultation_columns:
            add_columns.append("ALTER TABLE consultations ADD COLUMN recording_channels INTEGER")
        if "started_at" not in consultation_columns:
            add_columns.append("ALTER TABLE consultations ADD COLUMN started_at DATETIME")
        if "ended_at" not in consultation_columns:
            add_columns.append("ALTER TABLE consultations ADD COLUMN ended_at DATETIME")
        if "created_at" not in consultation_columns:
            add_columns.append("ALTER TABLE consultations ADD COLUMN created_at DATETIME")
        if "updated_at" not in consultation_columns:
            add_columns.append("ALTER TABLE consultations ADD COLUMN updated_at DATETIME")

        if add_columns:
            with engine.begin() as connection:
                for statement in add_columns:
                    connection.execute(text(statement))

    # Ensure result tables exist for fresh installs and upgraded databases alike.
    Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[BOOT] Pre-warming heavy ML models into RAM...")

    ensure_consultation_schema()

    # By calling these functions here, we force the @lru_cache to execute.
    # It will load SciSpacy and KuzuDB into memory right now, and cache them permanently.
    preloaded_nlp = get_nlp_service()
    get_reasoning_service(nlp_service=preloaded_nlp)

    print("[BOOT] Models locked in memory. Server ready!")

    yield  # This is where the server actually runs and handles requests

    # --- SHUTDOWN LOGIC ---
    print("[SHUTDOWN] Shutting down server...")


app = FastAPI(
    title="DDSS Backend",
    lifespan=lifespan,
    description="Integrated Diagnostic Decision Support System API",
    version="0.1.0",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(routes.router)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
