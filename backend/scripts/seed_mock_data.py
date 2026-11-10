#!/usr/bin/env python3
"""
Seed mock data for core project tables.

Targets:
- patients
- forms
- patient_forms

Usage:
  python backend/scripts/seed_mock_data.py
  python backend/scripts/seed_mock_data.py --reset
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

from sqlalchemy import inspect, text

# Ensure `app` package is importable when running from repo root or backend/.
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db.database import Base, SessionLocal, engine
from app.db.models import (
    Consultation,
    ConsultationEntityExtraction,
    ConsultationReasoningPath,
    ConsultationResult,
    ConsultationTranscriptSegment,
    Form,
    Patient,
    PatientForm,
)


MOCK_PATIENTS = [
    {
        "name": "John Smith",
        "email": "john.smith@email.com",
        "age": 45,
        "gender": "male",
        "medical_history": "Hypertension; Type 2 Diabetes",
        "city": "Geneva",
        "latitude": None,
        "longitude": None,
        "location_source": "profile",
    },
    {
        "name": "Alice Brown",
        "email": "alice.brown@email.com",
        "age": 38,
        "gender": "female",
        "medical_history": "Asthma; Seasonal allergies",
        "city": "Seattle",
        "latitude": 47.6062,
        "longitude": -122.3321,
        "location_source": "profile",
    },
    {
        "name": "Robert Wilson",
        "email": "robert.wilson@email.com",
        "age": 62,
        "gender": "male",
        "medical_history": "COPD; Former smoker",
        "city": "Chicago",
        "latitude": 41.8781,
        "longitude": -87.6298,
        "location_source": "profile",
    },
]

MOCK_FORMS = [
    {
        "title": "Patient Symptom Submission Form",
        "description": "Standard symptom intake submitted by patient before doctor review.",
        "category": "Symptoms",
        "created_by": "seed-script",
    },
    {
        "title": "Initial Health Assessment",
        "description": "Baseline health intake for new patients.",
        "category": "Medical History",
        "created_by": "seed-script",
    },
]

MOCK_CONSULTATIONS = [
    {
        "patient_email": "john.smith@email.com",
        "doctor_id": "doc-001",
        "title": "Cardiology Consultation",
        "scheduled_for": "2026-06-03T10:00:00",
        "status": "scheduled",
    },
    {
        "patient_email": "alice.brown@email.com",
        "doctor_id": "doc-001",
        "title": "Review Follow-up",
        "scheduled_for": "2026-06-05T14:00:00",
        "status": "scheduled",
    },
]


def ensure_patient_form_columns() -> None:
    inspector = inspect(engine)
    form_columns = {column["name"] for column in inspector.get_columns("forms")}
    patient_form_columns = {column["name"] for column in inspector.get_columns("patient_forms")}

    if "questions_json" not in form_columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE forms ADD COLUMN questions_json TEXT"))

    add_columns = []
    if "doctor_id" not in patient_form_columns:
        add_columns.append("ALTER TABLE patient_forms ADD COLUMN doctor_id TEXT")
    if "responses_json" not in patient_form_columns:
        add_columns.append("ALTER TABLE patient_forms ADD COLUMN responses_json TEXT")
    if "status" not in patient_form_columns:
        add_columns.append("ALTER TABLE patient_forms ADD COLUMN status TEXT DEFAULT 'pending'")
    if "progress" not in patient_form_columns:
        add_columns.append("ALTER TABLE patient_forms ADD COLUMN progress INTEGER DEFAULT 0")
    if "completed_at" not in patient_form_columns:
        add_columns.append("ALTER TABLE patient_forms ADD COLUMN completed_at DATETIME")

    if not add_columns:
        return

    with engine.begin() as connection:
        for statement in add_columns:
            connection.execute(text(statement))


def ensure_patient_columns() -> None:
    inspector = inspect(engine)
    if not inspector.has_table("patients"):
        return

    patient_columns = {column["name"] for column in inspector.get_columns("patients")}
    add_columns = []
    if "city" not in patient_columns:
        add_columns.append("ALTER TABLE patients ADD COLUMN city TEXT")
    if "latitude" not in patient_columns:
        add_columns.append("ALTER TABLE patients ADD COLUMN latitude REAL")
    if "longitude" not in patient_columns:
        add_columns.append("ALTER TABLE patients ADD COLUMN longitude REAL")
    if "location_source" not in patient_columns:
        add_columns.append("ALTER TABLE patients ADD COLUMN location_source TEXT")

    if not add_columns:
        return

    with engine.begin() as connection:
        for statement in add_columns:
            connection.execute(text(statement))


def ensure_consultation_columns() -> None:
    inspector = inspect(engine)
    if not inspector.has_table("consultations"):
        return

    consultation_column_details = inspector.get_columns("consultations")
    id_column = next((column for column in consultation_column_details if column["name"] == "id"), None)
    id_type = str(id_column["type"]).upper() if id_column else ""

    if "INT" not in id_type:
        with engine.begin() as connection:
            connection.execute(text(
                """
                CREATE TABLE consultations_new (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    patient_id TEXT NOT NULL,
                    doctor_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'scheduled',
                    scheduled_for DATETIME,
                    started_at DATETIME,
                    ended_at DATETIME,
                    notes TEXT,
                    results_json TEXT,
                    recording_file_path TEXT,
                    recording_original_name TEXT,
                    recording_mime_type TEXT,
                    recording_size_bytes INTEGER,
                    recording_duration_seconds INTEGER,
                    recording_sample_rate INTEGER,
                    recording_channels INTEGER,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            ))
            connection.execute(text(
                """
                INSERT INTO consultations_new (
                    patient_id,
                    doctor_id,
                    title,
                    status,
                    scheduled_for,
                    started_at,
                    ended_at,
                    notes,
                    results_json,
                    recording_file_path,
                    recording_original_name,
                    recording_mime_type,
                    recording_size_bytes,
                    recording_duration_seconds,
                    recording_sample_rate,
                    recording_channels,
                    created_at,
                    updated_at
                )
                SELECT
                    COALESCE(patient_id, 'unknown-patient'),
                    COALESCE(doctor_id, 'unknown-doctor'),
                    COALESCE(title, 'Consultation'),
                    COALESCE(status, 'scheduled'),
                    scheduled_for,
                    started_at,
                    ended_at,
                    notes,
                    NULL,
                    recording_file_path,
                    recording_original_name,
                    recording_mime_type,
                    recording_size_bytes,
                    recording_duration_seconds,
                    recording_sample_rate,
                    recording_channels,
                    COALESCE(created_at, CURRENT_TIMESTAMP),
                    COALESCE(updated_at, CURRENT_TIMESTAMP)
                FROM consultations
                """
            ))
            connection.execute(text("DROP TABLE consultations"))
            connection.execute(text("ALTER TABLE consultations_new RENAME TO consultations"))

        inspector = inspect(engine)

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

    if not add_columns:
        return

    with engine.begin() as connection:
        for statement in add_columns:
            connection.execute(text(statement))


def seed(reset: bool = False) -> int:
    Base.metadata.create_all(bind=engine)
    ensure_patient_form_columns()
    ensure_patient_columns()
    ensure_consultation_columns()
    db = SessionLocal()

    inserted_patients = 0
    inserted_forms = 0
    inserted_submissions = 0
    inserted_consultations = 0

    try:
        if reset:
            db.query(ConsultationTranscriptSegment).delete()
            db.query(ConsultationEntityExtraction).delete()
            db.query(ConsultationReasoningPath).delete()
            db.query(ConsultationResult).delete()
            db.query(Consultation).delete()
            db.query(PatientForm).delete()
            db.query(Form).delete()
            db.query(Patient).delete()
            db.commit()

        patients_by_email = {}
        for payload in MOCK_PATIENTS:
            patient = db.query(Patient).filter(Patient.email == payload["email"]).first()
            if not patient:
                patient = Patient(**payload)
                db.add(patient)
                db.flush()
                inserted_patients += 1
            patients_by_email[payload["email"]] = patient

        forms_by_title = {}
        for payload in MOCK_FORMS:
            form = db.query(Form).filter(Form.title == payload["title"]).first()
            if not form:
                form = Form(**payload)
                db.add(form)
                db.flush()
                inserted_forms += 1
            forms_by_title[payload["title"]] = form

        symptom_form = forms_by_title["Patient Symptom Submission Form"]
        for patient in patients_by_email.values():
            already_exists = (
                db.query(PatientForm)
                .filter(
                    PatientForm.patient_id == patient.id,
                    PatientForm.form_id == symptom_form.id,
                )
                .first()
            )
            if already_exists:
                continue

            submission = PatientForm(
                patient_id=patient.id,
                form_id=symptom_form.id,
                doctor_id="doc-001",
                patient_name=patient.name,
                raw_subjective_text=(
                    "Primary symptom: fatigue\n"
                    "Duration: 1 week\n"
                    "Severity: moderate"
                ),
                extracted_symptoms_json=json.dumps(
                    {
                        "mainSymptom": "fatigue",
                        "selectedSymptoms": ["Fatigue"],
                        "duration": "1-week",
                        "severity": "moderate",
                    }
                ),
                responses_json=json.dumps(
                    {
                        "q1": "Mild chest discomfort and fatigue.",
                        "q2": "1-2 weeks",
                    }
                ),
                status="completed",
                progress=100,
            )
            db.add(submission)
            inserted_submissions += 1

        for payload in MOCK_CONSULTATIONS:
            patient = patients_by_email.get(payload["patient_email"])
            if not patient:
                continue

            existing_consultation = (
                db.query(Consultation)
                .filter(
                    Consultation.patient_id == f"pat-{patient.id}",
                    Consultation.doctor_id == payload["doctor_id"],
                    Consultation.title == payload["title"],
                )
                .first()
            )
            if existing_consultation:
                continue

            consultation = Consultation(
                patient_id=f"pat-{patient.id}",
                doctor_id=payload["doctor_id"],
                title=payload["title"],
                status=payload["status"],
                scheduled_for=datetime.fromisoformat(payload["scheduled_for"]),
            )
            db.add(consultation)
            inserted_consultations += 1

        db.commit()

        total_patients = db.query(Patient).count()
        total_forms = db.query(Form).count()
        total_submissions = db.query(PatientForm).count()
        total_consultations = db.query(Consultation).count()

        print("Mock data seeding complete.")
        print(f"Inserted patients: {inserted_patients}")
        print(f"Inserted forms: {inserted_forms}")
        print(f"Inserted patient_forms: {inserted_submissions}")
        print(f"Inserted consultations: {inserted_consultations}")
        print("Current totals:")
        print(f" - patients: {total_patients}")
        print(f" - forms: {total_forms}")
        print(f" - patient_forms: {total_submissions}")
        print(f" - consultations: {total_consultations}")
        return 0
    except Exception as exc:
        db.rollback()
        print(f"Seeding failed: {exc}")
        return 2
    finally:
        db.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed mock data into project tables")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete existing rows in target tables before seeding",
    )
    args = parser.parse_args()
    return seed(reset=args.reset)


if __name__ == "__main__":
    raise SystemExit(main())
