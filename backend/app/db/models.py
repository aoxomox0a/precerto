# structure of saved data
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    email = Column(String, nullable=True, index=True)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    medical_history = Column(Text, nullable=True)
    city = Column(String, nullable=True, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_source = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    forms = relationship("PatientForm", back_populates="patient")


class Form(Base):
    __tablename__ = "forms"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True, index=True)
    created_by = Column(String, nullable=True, index=True)
    questions_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    submissions = relationship("PatientForm", back_populates="form")


class PatientForm(Base):
    __tablename__ = "patient_forms"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=True, index=True)
    doctor_id = Column(String, nullable=True, index=True)
    patient_name = Column(String, index=True)
    raw_subjective_text = Column(Text)
    extracted_symptoms_json = Column(
        Text
    )  # Where your AI output will eventually be saved
    responses_json = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="pending")
    progress = Column(Integer, nullable=False, default=0)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    patient = relationship("Patient", back_populates="forms")
    form = relationship("Form", back_populates="submissions")


class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, nullable=False, index=True)
    doctor_id = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False, index=True)
    status = Column(String, nullable=False, default="scheduled", index=True)
    scheduled_for = Column(DateTime, nullable=True, index=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    results_json = Column(Text, nullable=True)

    recording_file_path = Column(Text, nullable=True)
    recording_original_name = Column(String, nullable=True)
    recording_mime_type = Column(String, nullable=True)
    recording_size_bytes = Column(Integer, nullable=True)
    recording_duration_seconds = Column(Integer, nullable=True)
    recording_sample_rate = Column(Integer, nullable=True)
    recording_channels = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class ConsultationResult(Base):
    __tablename__ = "consultation_results"

    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(Integer, ForeignKey("consultations.id"), nullable=False, unique=True, index=True)
    patient_id = Column(String, nullable=False, index=True)
    doctor_id = Column(String, nullable=False, index=True)
    patient_name = Column(String, nullable=False)
    doctor_name = Column(String, nullable=True)
    consultation_status = Column(String, nullable=False, default="completed", index=True)
    transcript_text = Column(Text, nullable=True)
    transcript_summary = Column(Text, nullable=True)
    recording_file_path = Column(Text, nullable=True)
    recording_original_name = Column(String, nullable=True)
    recording_mime_type = Column(String, nullable=True)
    recording_duration_seconds = Column(Integer, nullable=True)
    recording_sample_rate = Column(Integer, nullable=True)
    recording_channels = Column(Integer, nullable=True)
    analysis_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    consultation = relationship("Consultation")
    transcript_segments = relationship("ConsultationTranscriptSegment", back_populates="result", cascade="all, delete-orphan")
    entities = relationship("ConsultationEntityExtraction", back_populates="result", cascade="all, delete-orphan")
    reasoning_paths = relationship("ConsultationReasoningPath", back_populates="result", cascade="all, delete-orphan")


class ConsultationTranscriptSegment(Base):
    __tablename__ = "consultation_transcript_segments"

    id = Column(Integer, primary_key=True, index=True)
    result_id = Column(Integer, ForeignKey("consultation_results.id"), nullable=False, index=True)
    segment_index = Column(Integer, nullable=False, index=True)
    speaker = Column(String, nullable=True)
    timestamp_label = Column(String, nullable=True)
    text = Column(Text, nullable=False)
    is_tagged = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    result = relationship("ConsultationResult", back_populates="transcript_segments")


class ConsultationEntityExtraction(Base):
    __tablename__ = "consultation_entities"

    id = Column(Integer, primary_key=True, index=True)
    result_id = Column(Integer, ForeignKey("consultation_results.id"), nullable=False, index=True)
    entity_index = Column(Integer, nullable=False, index=True)
    entity_text = Column(String, nullable=False, index=True)
    entity_type = Column(String, nullable=True)
    source_segment_index = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    result = relationship("ConsultationResult", back_populates="entities")


class ConsultationReasoningPath(Base):
    __tablename__ = "consultation_reasoning_paths"

    id = Column(Integer, primary_key=True, index=True)
    result_id = Column(Integer, ForeignKey("consultation_results.id"), nullable=False, index=True)
    path_index = Column(Integer, nullable=False, index=True)
    path_text = Column(Text, nullable=False)
    suggestion_condition = Column(String, nullable=True)
    confidence = Column(Integer, nullable=True)
    urgency = Column(String, nullable=True)
    matched_symptoms_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    result = relationship("ConsultationResult", back_populates="reasoning_paths")
