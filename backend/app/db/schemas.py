"""
Pydantic models for request/response schemas
"""

from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel


class PatientCreate(BaseModel):
    name: str
    email: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    medical_history: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_source: Optional[str] = None


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    medical_history: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_source: Optional[str] = None


class PatientResponse(PatientCreate):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


class FormCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    created_by: Optional[str] = None
    questions_json: Optional[str] = None
    questions: Optional[List[dict[str, Any]]] = None


class FormResponse(FormCreate):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


class PatientFormCreate(BaseModel):
    patient_id: Optional[int] = None
    form_id: Optional[int] = None
    doctor_id: Optional[str] = None
    patient_name: str
    subjective_text: Optional[str] = ""
    extracted_symptoms_json: Optional[str] = ""
    responses_json: Optional[str] = None
    status: Optional[str] = "pending"
    progress: Optional[int] = 0


class PatientFormSubmit(BaseModel):
    patient_id: Optional[int] = None
    form_id: Optional[int] = None
    doctor_id: Optional[str] = None
    patient_name: Optional[str] = None
    subjective_text: Optional[str] = None
    extracted_symptoms_json: Optional[str] = None
    responses_json: Optional[str] = None
    status: Optional[str] = "completed"
    progress: Optional[int] = 100


class PatientFormResponse(BaseModel):
    id: int
    patient_id: Optional[int] = None
    form_id: Optional[int] = None
    doctor_id: Optional[str] = None
    patient_name: str
    raw_subjective_text: str
    extracted_symptoms_json: Optional[str] = None
    responses_json: Optional[str] = None
    responses: Optional[dict[str, Any]] = None
    status: str
    progress: int
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class ConsultationCreate(BaseModel):
    patient_id: str
    doctor_id: str
    title: str
    scheduled_for: Optional[datetime] = None
    status: Optional[str] = "scheduled"
    notes: Optional[str] = None
    results_json: Optional[str] = None


class ConsultationUpdate(BaseModel):
    title: Optional[str] = None
    scheduled_for: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    results_json: Optional[str] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None


class ConsultationResponse(BaseModel):
    id: int
    patient_id: str
    doctor_id: str
    title: str
    status: str
    scheduled_for: Optional[datetime] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    notes: Optional[str] = None
    results_json: Optional[str] = None
    recording_file_path: Optional[str] = None
    recording_url: Optional[str] = None
    recording_original_name: Optional[str] = None
    recording_mime_type: Optional[str] = None
    recording_size_bytes: Optional[int] = None
    recording_duration_seconds: Optional[int] = None
    recording_sample_rate: Optional[int] = None
    recording_channels: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class WeatherLocationResponse(BaseModel):
    label: str
    city: Optional[str] = None
    latitude: float
    longitude: float
    source: str


class WeatherForecastResponse(BaseModel):
    location: WeatherLocationResponse
    consultation_datetime: Optional[datetime] = None
    forecast_datetime: datetime
    weather_code: Optional[int] = None
    weather_description: str
    temperature_c: Optional[float] = None
    apparent_temperature_c: Optional[float] = None
    precipitation_probability: Optional[int] = None
    wind_speed_kph: Optional[float] = None
    uv_index: Optional[float] = None
    recommendation: str
    source: str
    updated_at: datetime
    cache_ttl_seconds: int

class SymptomInput(BaseModel):
    text: str
    timestamp: datetime

class DiagnosisSuggestion(BaseModel):
    disease: str
    confidence: float
    reasoning_path: List[str]

class ConsultationSessionResponse(BaseModel):
    consultation_id: int
    status: str


class ConsultationTranscriptSegmentPayload(BaseModel):
    id: Optional[str] = None
    text: str
    ts: Optional[str] = None
    speaker: Optional[str] = None
    is_tagged: Optional[bool] = False


class ConsultationEntityPayload(BaseModel):
    name: str
    type: Optional[str] = None
    source_segment_index: Optional[int] = None


class ConsultationReasoningSuggestionPayload(BaseModel):
    condition: Optional[str] = None
    confidence: Optional[float] = None
    urgency: Optional[str] = None
    matched_symptoms: Optional[List[str]] = None


class ConsultationResultsAnalysisPayload(BaseModel):
    tags: Optional[List[dict[str, Any]]] = None
    entities: Optional[List[Any]] = None
    reasoning: Optional[dict[str, Any]] = None
    synthesized_drivers: Optional[List[dict[str, Any]]] = None
    summary: Optional[dict[str, Any]] = None


class ConsultationResultsPatientPayload(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    age: Optional[int] = None
    email: Optional[str] = None


class ConsultationResultsDoctorPayload(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    specialty: Optional[str] = None


class ConsultationResultsRecordingPayload(BaseModel):
    filePath: Optional[str] = None
    originalName: Optional[str] = None
    mimeType: Optional[str] = None
    durationSeconds: Optional[int] = None
    sampleRate: Optional[int] = None
    channels: Optional[int] = None


class ConsultationResultsTranscriptPayload(BaseModel):
    text: Optional[str] = None
    chunks: Optional[List[ConsultationTranscriptSegmentPayload]] = None


class ConsultationResultsPayload(BaseModel):
    consultationId: Optional[str] = None
    backendId: Optional[int] = None
    status: Optional[str] = None
    savedAt: Optional[datetime] = None
    consultationMeta: Optional[dict[str, Any]] = None
    doctor: Optional[ConsultationResultsDoctorPayload] = None
    patient: Optional[ConsultationResultsPatientPayload] = None
    recording: Optional[ConsultationResultsRecordingPayload] = None
    transcript: Optional[ConsultationResultsTranscriptPayload] = None
    analysis: Optional[ConsultationResultsAnalysisPayload] = None


class ConsultationResultsSaveRequest(BaseModel):
    results: ConsultationResultsPayload


class ConsultationResultsResponse(BaseModel):
    consultation: ConsultationResponse
    result: dict[str, Any]
    transcript_segments: List[dict[str, Any]]
    entities: List[dict[str, Any]]
    reasoning_paths: List[dict[str, Any]]
