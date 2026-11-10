#!/usr/bin/env python3
"""
Create the project's database schema (SQLAlchemy create_all).

Usage:
  python backend/scripts/create_schema.py

This imports the project's models, runs `Base.metadata.create_all(bind=engine)`,
and prints the names of the tables present after creation.
"""

import sys
from sqlalchemy import inspect, text

from app.db.database import Base, engine

# Importing models ensures they are registered on Base.metadata
import app.db.models  # noqa: F401


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


def main() -> int:
    try:
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        ensure_patient_form_columns()
        ensure_patient_columns()
        ensure_consultation_columns()

        inspector = inspect(engine)
        tables = inspector.get_table_names()
        if tables:
            print("Tables present in database:")
            for t in tables:
                print(f" - {t}")
        else:
            print("No tables found after create_all().")

        print("Schema creation complete.")
        return 0
    except Exception as e:
        print(f"Error creating schema: {e}")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
