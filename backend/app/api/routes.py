# app/api/routes.py
import asyncio
import json
import uuid
import numpy as np
import httpx
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from functools import lru_cache

from sqlalchemy import func

from fastapi import (
    APIRouter,
    WebSocket,
    HTTPException,
    Depends,
    WebSocketDisconnect,
    Query,
    UploadFile,
    File,
    Form as FastAPIForm,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.services.audio_service import AudioService
from app.services.context_service import ContextService
from app.services.nlp_service import NLPService
from app.services.reasoning import ReasoningService
from app.services.weather_service import WeatherService

from app.db.database import get_db
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
from app.db.schemas import (
    ConsultationCreate,
    ConsultationResultsResponse,
    ConsultationResultsSaveRequest,
    ConsultationResponse,
    ConsultationSessionResponse,
    ConsultationUpdate,
    FormCreate,
    FormResponse,
    PatientCreate,
    PatientFormCreate,
    PatientFormResponse,
    PatientFormSubmit,
    PatientResponse,
    PatientUpdate,
    WeatherForecastResponse,
)

router = APIRouter()

BACKEND_DIR = Path(__file__).resolve().parents[2]
CONSULTATION_RECORDINGS_DIR = BACKEND_DIR / "storage" / "consultation_recordings"
CONSULTATION_RECORDINGS_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------
# DEPENDENCY INJECTION (Lazy Loading via lru_cache)
# ---------------------------------------------------------


@lru_cache()
def get_audio_service() -> AudioService:
    return AudioService()


@lru_cache()
def get_context_service() -> ContextService:
    return ContextService()


@lru_cache()
def get_nlp_service() -> NLPService:
    return NLPService()


@lru_cache()
def get_reasoning_service(
    nlp_service: NLPService = Depends(get_nlp_service),
) -> ReasoningService:
    # We pass the loaded NLP model from nlp_service directly into reasoning_service!
    return ReasoningService(nlp_model=nlp_service.nlp)


@lru_cache()
def get_weather_service() -> WeatherService:
    return WeatherService()


# ---------------------------------------------------------


class ConsultRequest(BaseModel):
    consultation_id: str
    transcribed_text: str


# --- WORKER 1: THE TRANSCRIPTION WORKER (The Voice Box) ---
async def transcription_worker(
    audio_queue: asyncio.Queue,
    text_queue: asyncio.Queue,
    websocket: WebSocket,
    audio_service: AudioService,
    send_lock: asyncio.Lock,
):
    """Watches the audio queue, processes text via Whisper, and sends text to the UI immediately."""
    while True:
        audio_data = await audio_queue.get()
        try:
            transcript_chunk = await audio_service.transcribe_audio(audio_data)
            clean_text = transcript_chunk.strip()

            # Filter common Whisper hallucinations on silence
            clean_test = "".join(
                c for c in clean_text.lower() if c.isalnum() or c.isspace()
            ).strip()
            hallucinations = [
                "thank you",
                "the following is a medical consultation",
            ]

            if clean_text and clean_test not in hallucinations:
                print(f"\n[Whisper] Transcribed: {clean_text}")

                # STREAM TRANSCRIPT TO FRONTEND IMMEDIATELY
                # fastapi websocket not thread-safe for concurrent writes
                async with send_lock:
                    await websocket.send_json(
                        {
                            "type": "LIVE_UPDATE",
                            "transcript_chunk": clean_text,
                            "extracted_entities": [],
                            "reasoning": {"suggestions": [], "reasoning_path": []},
                        }
                    )

                # Pass the text to Worker 2 for graph analysis
                await text_queue.put(clean_text)

        except Exception as e:
            print(f"Transcription Worker Error: {e}")
        finally:
            audio_queue.task_done()


# --- DATABASE SERIALIZATION HELPERS ---
def serialize_patient(patient: Patient) -> dict:
    return {
        "id": patient.id,
        "name": patient.name,
        "email": patient.email,
        "age": patient.age,
        "gender": patient.gender,
        "medical_history": patient.medical_history,
        "city": patient.city,
        "latitude": patient.latitude,
        "longitude": patient.longitude,
        "location_source": patient.location_source,
        "created_at": patient.created_at,
    }


def serialize_form(form: Form) -> dict:
    questions = []
    if form.questions_json:
        try:
            parsed_questions = json.loads(form.questions_json)
            questions = parsed_questions if isinstance(parsed_questions, list) else []
        except json.JSONDecodeError:
            questions = []

    return {
        "id": form.id,
        "title": form.title,
        "description": form.description,
        "category": form.category,
        "created_by": form.created_by,
        "questions_json": form.questions_json,
        "questions": questions,
        "created_at": form.created_at,
    }


def serialize_patient_form(patient_form: PatientForm) -> dict:
    responses = {}
    if patient_form.responses_json:
        try:
            parsed_responses = json.loads(patient_form.responses_json)
            responses = parsed_responses if isinstance(parsed_responses, dict) else {}
        except json.JSONDecodeError:
            responses = {}

    return {
        "id": patient_form.id,
        "patient_id": patient_form.patient_id,
        "form_id": patient_form.form_id,
        "doctor_id": patient_form.doctor_id,
        "patient_name": patient_form.patient_name,
        "raw_subjective_text": patient_form.raw_subjective_text,
        "extracted_symptoms_json": patient_form.extracted_symptoms_json,
        "responses_json": patient_form.responses_json,
        "responses": responses,
        "status": patient_form.status,
        "progress": patient_form.progress,
        "created_at": patient_form.created_at,
        "completed_at": patient_form.completed_at,
    }


def apply_patient_form_submission(
    patient_form: PatientForm, submission: PatientFormSubmit
) -> PatientForm:
    if submission.patient_name is not None:
        patient_form.patient_name = submission.patient_name
    if submission.doctor_id is not None:
        patient_form.doctor_id = submission.doctor_id
    if submission.subjective_text is not None:
        patient_form.raw_subjective_text = submission.subjective_text
    if submission.extracted_symptoms_json is not None:
        patient_form.extracted_symptoms_json = submission.extracted_symptoms_json
    if submission.responses_json is not None:
        patient_form.responses_json = submission.responses_json
    if submission.status is not None:
        patient_form.status = submission.status
    if submission.progress is not None:
        patient_form.progress = submission.progress
    if patient_form.status == "completed" and patient_form.completed_at is None:
        patient_form.completed_at = datetime.utcnow()
    elif patient_form.status != "completed" and submission.status is not None:
        patient_form.completed_at = None
    return patient_form


def serialize_consultation(consultation: Consultation) -> dict:
    return {
        "id": consultation.id,
        "patient_id": consultation.patient_id,
        "doctor_id": consultation.doctor_id,
        "title": consultation.title,
        "status": consultation.status,
        "scheduled_for": consultation.scheduled_for,
        "started_at": consultation.started_at,
        "ended_at": consultation.ended_at,
        "notes": consultation.notes,
        "results_json": consultation.results_json,
        "recording_file_path": consultation.recording_file_path,
        "recording_url": f"/api/consultations/{consultation.id}/recording" if consultation.recording_file_path else None,
        "recording_original_name": consultation.recording_original_name,
        "recording_mime_type": consultation.recording_mime_type,
        "recording_size_bytes": consultation.recording_size_bytes,
        "recording_duration_seconds": consultation.recording_duration_seconds,
        "recording_sample_rate": consultation.recording_sample_rate,
        "recording_channels": consultation.recording_channels,
        "created_at": consultation.created_at,
        "updated_at": consultation.updated_at,
    }


def serialize_consultation_result(result: ConsultationResult) -> dict:
    return {
        "id": result.id,
        "consultation_id": result.consultation_id,
        "patient_id": result.patient_id,
        "doctor_id": result.doctor_id,
        "patient_name": result.patient_name,
        "doctor_name": result.doctor_name,
        "consultation_status": result.consultation_status,
        "transcript_text": result.transcript_text,
        "transcript_summary": result.transcript_summary,
        "recording_file_path": result.recording_file_path,
        "recording_original_name": result.recording_original_name,
        "recording_mime_type": result.recording_mime_type,
        "recording_duration_seconds": result.recording_duration_seconds,
        "recording_sample_rate": result.recording_sample_rate,
        "recording_channels": result.recording_channels,
        "analysis_json": result.analysis_json,
        "created_at": result.created_at,
        "updated_at": result.updated_at,
    }


def serialize_transcript_segment(segment: ConsultationTranscriptSegment) -> dict:
    return {
        "id": segment.id,
        "result_id": segment.result_id,
        "segment_index": segment.segment_index,
        "speaker": segment.speaker,
        "timestamp_label": segment.timestamp_label,
        "text": segment.text,
        "is_tagged": bool(segment.is_tagged),
        "created_at": segment.created_at,
    }


def serialize_entity(entity: ConsultationEntityExtraction) -> dict:
    return {
        "id": entity.id,
        "result_id": entity.result_id,
        "entity_index": entity.entity_index,
        "entity_text": entity.entity_text,
        "entity_type": entity.entity_type,
        "source_segment_index": entity.source_segment_index,
        "created_at": entity.created_at,
    }


def serialize_reasoning_path(path: ConsultationReasoningPath) -> dict:
    return {
        "id": path.id,
        "result_id": path.result_id,
        "path_index": path.path_index,
        "path_text": path.path_text,
        "suggestion_condition": path.suggestion_condition,
        "confidence": path.confidence,
        "urgency": path.urgency,
        "matched_symptoms_json": path.matched_symptoms_json,
        "created_at": path.created_at,
    }


def build_consultation_results_bundle(db: Session, consultation: Consultation) -> Optional[dict]:
    result = (
        db.query(ConsultationResult)
        .filter(ConsultationResult.consultation_id == consultation.id)
        .first()
    )
    if not result:
        return None

    transcript_segments = (
        db.query(ConsultationTranscriptSegment)
        .filter(ConsultationTranscriptSegment.result_id == result.id)
        .order_by(ConsultationTranscriptSegment.segment_index.asc(), ConsultationTranscriptSegment.id.asc())
        .all()
    )
    entities = (
        db.query(ConsultationEntityExtraction)
        .filter(ConsultationEntityExtraction.result_id == result.id)
        .order_by(ConsultationEntityExtraction.entity_index.asc(), ConsultationEntityExtraction.id.asc())
        .all()
    )
    reasoning_paths = (
        db.query(ConsultationReasoningPath)
        .filter(ConsultationReasoningPath.result_id == result.id)
        .order_by(ConsultationReasoningPath.path_index.asc(), ConsultationReasoningPath.id.asc())
        .all()
    )

    analysis_json = None
    if result.analysis_json:
        try:
            analysis_json = json.loads(result.analysis_json)
        except Exception:
            analysis_json = None

    if isinstance(analysis_json, dict):
        reasoning_json = analysis_json.get("reasoning") if isinstance(analysis_json.get("reasoning"), dict) else {}
        if not analysis_json.get("synthesized_drivers") and reasoning_json.get("synthesized_drivers"):
            analysis_json["synthesized_drivers"] = reasoning_json.get("synthesized_drivers")

    return {
        "consultation": serialize_consultation(consultation),
        "result": {
            **serialize_consultation_result(result),
            "analysis": analysis_json,
        },
        "transcript_segments": [serialize_transcript_segment(segment) for segment in transcript_segments],
        "entities": [serialize_entity(entity) for entity in entities],
        "reasoning_paths": [serialize_reasoning_path(path) for path in reasoning_paths],
    }


def persist_consultation_results(
    db: Session,
    consultation: Consultation,
    results_payload: dict,
) -> ConsultationResult:
    existing_result = (
        db.query(ConsultationResult)
        .filter(ConsultationResult.consultation_id == consultation.id)
        .first()
    )
    if existing_result:
        db.query(ConsultationTranscriptSegment).filter(
            ConsultationTranscriptSegment.result_id == existing_result.id
        ).delete(synchronize_session=False)
        db.query(ConsultationEntityExtraction).filter(
            ConsultationEntityExtraction.result_id == existing_result.id
        ).delete(synchronize_session=False)
        db.query(ConsultationReasoningPath).filter(
            ConsultationReasoningPath.result_id == existing_result.id
        ).delete(synchronize_session=False)
        result_record = existing_result
    else:
        result_record = ConsultationResult(
            consultation_id=consultation.id,
            patient_id=consultation.patient_id,
            doctor_id=consultation.doctor_id,
            patient_name="",
            consultation_status="completed",
        )
        db.add(result_record)

    patient_payload = results_payload.get("patient") or {}
    doctor_payload = results_payload.get("doctor") or {}
    recording_payload = results_payload.get("recording") or {}
    transcript_payload = results_payload.get("transcript") or {}
    analysis_payload = results_payload.get("analysis") or {}
    reasoning_payload = analysis_payload.get("reasoning") or {}

    result_record.patient_id = str(patient_payload.get("id") or consultation.patient_id)
    result_record.doctor_id = str(doctor_payload.get("id") or consultation.doctor_id)
    result_record.patient_name = patient_payload.get("name") or result_record.patient_name or "Unknown patient"
    result_record.doctor_name = doctor_payload.get("name")
    result_record.consultation_status = results_payload.get("status") or consultation.status or "completed"
    result_record.transcript_text = transcript_payload.get("text") or ""
    transcript_summary = analysis_payload.get("summary")
    result_record.transcript_summary = json.dumps(transcript_summary) if transcript_summary is not None else None
    result_record.recording_file_path = recording_payload.get("filePath") or consultation.recording_file_path
    result_record.recording_original_name = recording_payload.get("originalName") or consultation.recording_original_name
    result_record.recording_mime_type = recording_payload.get("mimeType") or consultation.recording_mime_type
    result_record.recording_duration_seconds = recording_payload.get("durationSeconds") or consultation.recording_duration_seconds
    result_record.recording_sample_rate = recording_payload.get("sampleRate") or consultation.recording_sample_rate
    result_record.recording_channels = recording_payload.get("channels") or consultation.recording_channels
    if reasoning_payload.get("synthesized_drivers") and not analysis_payload.get("synthesized_drivers"):
        analysis_payload["synthesized_drivers"] = reasoning_payload.get("synthesized_drivers")
    result_record.analysis_json = json.dumps(analysis_payload, default=str)

    db.flush()
    transcript_chunks = transcript_payload.get("chunks") or []
    for index, chunk in enumerate(transcript_chunks):
        if not isinstance(chunk, dict):
            continue
        db.add(
            ConsultationTranscriptSegment(
                result_id=result_record.id,
                segment_index=index,
                speaker=chunk.get("speaker"),
                timestamp_label=chunk.get("ts"),
                text=chunk.get("text") or "",
                is_tagged=1 if chunk.get("is_tagged") else 0,
            )
        )

    entities = analysis_payload.get("entities") or []
    for index, entity in enumerate(entities):
        if isinstance(entity, dict):
            entity_text = entity.get("name") or entity.get("entity_text") or ""
            entity_type = entity.get("type") or entity.get("entity_type")
            source_segment_index = entity.get("source_segment_index")
        else:
            entity_text = str(entity)
            entity_type = None
            source_segment_index = None

        if not entity_text:
            continue

        db.add(
            ConsultationEntityExtraction(
                result_id=result_record.id,
                entity_index=index,
                entity_text=entity_text,
                entity_type=entity_type,
                source_segment_index=source_segment_index,
            )
        )

    reasoning_paths = reasoning_payload.get("reasoning_path") or []
    suggestions = reasoning_payload.get("suggestions") or []
    max_rows = max(len(reasoning_paths), len(suggestions))
    for index in range(max_rows):
        path_text = reasoning_paths[index] if index < len(reasoning_paths) else None
        suggestion = suggestions[index] if index < len(suggestions) and isinstance(suggestions[index], dict) else {}
        if not path_text:
            path_text = suggestion.get("condition") or ""
        if not path_text:
            continue

        confidence = suggestion.get("confidence")
        confidence_value = int(round(confidence)) if isinstance(confidence, (int, float)) else None
        matched_symptoms = suggestion.get("matched_symptoms") or []
        db.add(
            ConsultationReasoningPath(
                result_id=result_record.id,
                path_index=index,
                path_text=path_text,
                suggestion_condition=suggestion.get("condition"),
                confidence=confidence_value,
                urgency=suggestion.get("urgency"),
                matched_symptoms_json=json.dumps(matched_symptoms) if matched_symptoms else None,
            )
        )

    consultation.status = results_payload.get("status") or consultation.status or "completed"
    consultation.ended_at = consultation.ended_at or datetime.utcnow()
    consultation.results_json = json.dumps(results_payload, default=str)

    if isinstance(transcript_summary, str) and not consultation.notes:
        consultation.notes = transcript_summary

    db.commit()
    db.refresh(result_record)
    db.refresh(consultation)
    return result_record



# --- WORKER 2: THE ANALYSIS WORKER (The Brain) ---
async def analysis_worker(
    text_queue: asyncio.Queue,
    state: dict,
    websocket: WebSocket,
    nlp_service: NLPService,
    reasoning_service: ReasoningService,
    send_lock: asyncio.Lock,
):
    """Watches the text queue, extracts medical terms, queries the graph, and updates the UI."""
    while True:
        text_chunk = await text_queue.get()
        try:
            state["full_transcript"] += " " + text_chunk

            entities = nlp_service.extract_symptoms(state["full_transcript"])

            if entities:
                reasoning_data = reasoning_service.get_diagnosis_path(entities)

                # STREAM KNOWLEDGE GRAPH DATA TO FRONTEND
                # fastapi websocket not thread-safe for concurrent writes
                async with send_lock:
                    await websocket.send_json(
                        {
                            "type": "LIVE_UPDATE",
                            "transcript_chunk": "",
                            "extracted_entities": entities,
                            "reasoning": reasoning_data,
                        }
                    )

        except Exception as e:
            print(f"Analysis Worker Error: {e}")
        finally:
            text_queue.task_done()


# --- WEBSOCKET ENDPOINT ---
@router.websocket("/ws/audio")
async def websocket_audio_endpoint(
    websocket: WebSocket,
    db: Session = Depends(get_db),
    audio_service: AudioService = Depends(get_audio_service),
    nlp_service: NLPService = Depends(get_nlp_service),
    reasoning_service: ReasoningService = Depends(get_reasoning_service),
):
    await websocket.accept()
    print("🔌 Doctor connected to live stream.")

    audio_queue = asyncio.Queue()
    text_queue = asyncio.Queue()
    state = {"full_transcript": ""}
    audio_buffer = bytearray()

    # Pass the injected services into the workers
    send_lock = asyncio.Lock()
    tx_task = asyncio.create_task(
        transcription_worker(
            audio_queue, text_queue, websocket, audio_service, send_lock
        )
    )
    ax_task = asyncio.create_task(
        analysis_worker(
            text_queue, state, websocket, nlp_service, reasoning_service, send_lock
        )
    )

    try:
        while True:
            chunk = await websocket.receive_bytes()
            audio_buffer.extend(chunk)

            # Prints a dot so you know audio is actually arriving
            print(".", end="", flush=True)

            # 160000 bytes = ~5 seconds of audio
            if len(audio_buffer) >= 160000:
                print("\n[Ingest] Chunk full, sending to Whisper...")

                # 1. Ensure even number of bytes for 16-bit integer math
                valid_length = len(audio_buffer) - (len(audio_buffer) % 2)
                data_snapshot = bytes(audio_buffer[:valid_length])

                # sliding window for context
                del audio_buffer[:-32000]

                audio_array = np.frombuffer(data_snapshot, dtype=np.int16)
                audio_float32 = audio_array.astype(np.float32) / 32768.0

                await audio_queue.put(audio_float32)

    except WebSocketDisconnect:
        print("\nDoctor disconnected.")
    except Exception as e:
        print(f"\nWebSocket Loop Error: {e}")
    finally:
        tx_task.cancel()
        ax_task.cancel()


# --- REST ENDPOINTS ---


# Processes transcribed text to extract symptoms and query the knowledge graph.
@router.post("/api/reasoning/diagnose")
async def get_diagnosis(
    request: ConsultRequest,
    nlp_service: NLPService = Depends(get_nlp_service),
    reasoning_service: ReasoningService = Depends(get_reasoning_service),
):
    """Manual trigger for diagnostic reasoning (CURL support)"""
    print(f"Processing manual request for: {request.consultation_id}")

    symptoms = nlp_service.extract_symptoms(request.transcribed_text)
    if not symptoms:
        return {
            "consultation_id": request.consultation_id,
            "suggestions": [],
            "reasoning_path": [],
            "synthesized_drivers": [],
        }

    try:
        reasoning_data = reasoning_service.get_diagnosis_path(symptoms)
        return {
            "consultation_id": request.consultation_id,
            "extracted_symptoms": symptoms,
            "suggestions": reasoning_data["suggestions"],
            "reasoning_path": reasoning_data["reasoning_path"],
            "synthesized_drivers": reasoning_data.get("synthesized_drivers", []),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reasoning failure: {str(e)}")


@router.get("/api/patients", response_model=List[PatientResponse])
def list_patients(
    patient_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Patient)
    if patient_id is not None:
        query = query.filter(Patient.id == patient_id)

    return [serialize_patient(patient) for patient in query.order_by(Patient.id).all()]


@router.post("/api/patients", response_model=PatientResponse, status_code=201)
def create_patient(patient_data: PatientCreate, db: Session = Depends(get_db)):
    patient = Patient(**patient_data.dict())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return serialize_patient(patient)


@router.put("/api/patients/{patient_id}", response_model=PatientResponse)
def update_patient(patient_id: int, patient_data: PatientUpdate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    payload = patient_data.dict(exclude_unset=True)
    for key, value in payload.items():
        setattr(patient, key, value)

    db.commit()
    db.refresh(patient)
    return serialize_patient(patient)


@router.get("/api/forms", response_model=List[FormResponse])
def list_forms(db: Session = Depends(get_db)):
    return [serialize_form(form) for form in db.query(Form).order_by(Form.id).all()]


@router.post("/api/forms", response_model=FormResponse, status_code=201)
def create_form(form_data: FormCreate, db: Session = Depends(get_db)):
    payload = form_data.dict()
    if payload.get("questions") is not None and payload.get("questions_json") is None:
        payload["questions_json"] = json.dumps(payload["questions"])

    payload.pop("questions", None)
    form = Form(**payload)
    db.add(form)
    db.commit()
    db.refresh(form)
    return serialize_form(form)


@router.put("/api/forms/{form_id}/update", response_model=FormResponse)
def update_form(form_id: int, form_data: FormCreate, db: Session = Depends(get_db)):
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    payload = form_data.dict()
    if payload.get("questions") is not None and payload.get("questions_json") is None:
        payload["questions_json"] = json.dumps(payload["questions"])

    form.title = form_data.title
    form.description = form_data.description
    form.category = form_data.category
    form.created_by = form_data.created_by
    form.questions_json = payload.get("questions_json")

    db.commit()
    db.refresh(form)
    return serialize_form(form)


@router.delete("/api/forms/{form_id}/delete", status_code=204)
def delete_form(form_id: int, db: Session = Depends(get_db)):
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    db.query(PatientForm).filter(PatientForm.form_id == form_id).delete(
        synchronize_session=False
    )
    db.delete(form)
    db.commit()
    return None


@router.get("/api/patient-forms", response_model=List[PatientFormResponse])
def list_patient_forms(
    patient_id: Optional[int] = Query(default=None),
    form_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(PatientForm)

    if patient_id is not None:
        query = query.filter(PatientForm.patient_id == patient_id)

    if form_id is not None:
        query = query.filter(PatientForm.form_id == form_id)

    return [
        serialize_patient_form(item) for item in query.order_by(PatientForm.id).all()
    ]


@router.get("/api/patient-forms/{patient_form_id}", response_model=PatientFormResponse)
def get_patient_form(patient_form_id: int, db: Session = Depends(get_db)):
    patient_form = (
        db.query(PatientForm).filter(PatientForm.id == patient_form_id).first()
    )
    if not patient_form:
        raise HTTPException(status_code=404, detail="Patient form not found")
    return serialize_patient_form(patient_form)


@router.post("/patient-forms/", response_model=PatientFormResponse, status_code=201)
@router.post("/api/patient-forms", response_model=PatientFormResponse, status_code=201)
async def create_patient_form(
    form_data: PatientFormCreate, db: Session = Depends(get_db)
):
    try:
        new_form = PatientForm(
            patient_id=form_data.patient_id,
            form_id=form_data.form_id,
            doctor_id=form_data.doctor_id,
            patient_name=form_data.patient_name,
            raw_subjective_text=form_data.subjective_text or "",
            extracted_symptoms_json=form_data.extracted_symptoms_json or "",
            responses_json=form_data.responses_json or "{}",
            status=form_data.status or "pending",
            progress=form_data.progress or 0,
        )
        db.add(new_form)
        db.commit()
        db.refresh(new_form)
        return serialize_patient_form(new_form)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put(
    "/api/patient-forms/{patient_form_id}/submit", response_model=PatientFormResponse
)
def submit_patient_form_response(
    patient_form_id: int,
    submission: PatientFormSubmit,
    db: Session = Depends(get_db),
):
    patient_form = (
        db.query(PatientForm).filter(PatientForm.id == patient_form_id).first()
    )
    if not patient_form:
        raise HTTPException(status_code=404, detail="Patient form not found")

    apply_patient_form_submission(patient_form, submission)
    db.commit()
    db.refresh(patient_form)
    return serialize_patient_form(patient_form)


@router.post("/api/patient-forms/submit", response_model=PatientFormResponse)
def upsert_patient_form_response(
    submission: PatientFormSubmit,
    db: Session = Depends(get_db),
):
    if submission.patient_id is None or submission.form_id is None:
        raise HTTPException(
            status_code=400, detail="patient_id and form_id are required"
        )

    patient_form = (
        db.query(PatientForm)
        .filter(
            PatientForm.patient_id == submission.patient_id,
            PatientForm.form_id == submission.form_id,
        )
        .first()
    )

    if patient_form is None:
        patient_form = PatientForm(
            patient_id=submission.patient_id,
            form_id=submission.form_id,
            doctor_id=submission.doctor_id,
            patient_name=submission.patient_name or "Patient",
            raw_subjective_text=submission.subjective_text or "",
            extracted_symptoms_json=submission.extracted_symptoms_json or "",
            responses_json=submission.responses_json or "{}",
            status=submission.status or "completed",
            progress=submission.progress or 100,
            completed_at=datetime.utcnow()
            if (submission.status or "completed") == "completed"
            else None,
        )
        db.add(patient_form)
    else:
        apply_patient_form_submission(patient_form, submission)

    db.commit()
    db.refresh(patient_form)
    return serialize_patient_form(patient_form)


@router.get("/api/consultations", response_model=List[ConsultationResponse])
def list_consultations(
    doctor_id: Optional[str] = Query(default=None),
    patient_id: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Consultation)

    if doctor_id:
        query = query.filter(Consultation.doctor_id == doctor_id)
    if patient_id:
        query = query.filter(Consultation.patient_id == patient_id)
    if status:
        query = query.filter(Consultation.status == status)

    consultations = query.order_by(
        func.coalesce(
            Consultation.ended_at,
            Consultation.updated_at,
            Consultation.created_at,
            Consultation.scheduled_for,
        ).desc(),
        Consultation.id.desc(),
    ).all()
    return [serialize_consultation(item) for item in consultations]


@router.get("/api/weather/forecast", response_model=WeatherForecastResponse)
def get_weather_forecast(
    city: Optional[str] = Query(default=None),
    latitude: Optional[float] = Query(default=None),
    longitude: Optional[float] = Query(default=None),
    label: Optional[str] = Query(default=None),
    target_datetime: Optional[datetime] = Query(default=None),
    weather_service: WeatherService = Depends(get_weather_service),
):
    try:
        return weather_service.get_forecast(
            city=city,
            latitude=latitude,
            longitude=longitude,
            label=label,
            target_datetime=target_datetime,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except httpx.HTTPError as error:
        raise HTTPException(status_code=502, detail=f"Weather service unavailable: {error}")


@router.get("/api/consultations/{consultation_id}", response_model=ConsultationResponse)
def get_consultation(consultation_id: int, db: Session = Depends(get_db)):
    consultation = (
        db.query(Consultation).filter(Consultation.id == consultation_id).first()
    )
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return serialize_consultation(consultation)


@router.get("/api/consultations/{consultation_id}/results", response_model=ConsultationResultsResponse)
def get_consultation_results(consultation_id: int, db: Session = Depends(get_db)):
    consultation = (
        db.query(Consultation).filter(Consultation.id == consultation_id).first()
    )
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    bundle = build_consultation_results_bundle(db, consultation)
    if bundle is None:
        raise HTTPException(status_code=404, detail="Consultation results not found")
    return bundle


@router.post("/api/consultations", response_model=ConsultationResponse, status_code=201)
def create_consultation(payload: ConsultationCreate, db: Session = Depends(get_db)):
    consultation = Consultation(
        patient_id=payload.patient_id,
        doctor_id=payload.doctor_id,
        title=payload.title,
        status=payload.status or "scheduled",
        scheduled_for=payload.scheduled_for,
        notes=payload.notes,
        results_json=payload.results_json,
    )
    db.add(consultation)
    db.commit()
    db.refresh(consultation)
    return serialize_consultation(consultation)


@router.put("/api/consultations/{consultation_id}", response_model=ConsultationResponse)
def update_consultation(
    consultation_id: int,
    payload: ConsultationUpdate,
    db: Session = Depends(get_db),
):
    consultation = (
        db.query(Consultation).filter(Consultation.id == consultation_id).first()
    )
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(consultation, field, value)

    db.commit()
    db.refresh(consultation)
    return serialize_consultation(consultation)


@router.post("/api/consultations/{consultation_id}/results", response_model=ConsultationResultsResponse)
def save_consultation_results(
    consultation_id: int,
    payload: ConsultationResultsSaveRequest,
    db: Session = Depends(get_db),
):
    consultation = (
        db.query(Consultation).filter(Consultation.id == consultation_id).first()
    )
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    persist_consultation_results(db, consultation, payload.results.dict())
    bundle = build_consultation_results_bundle(db, consultation)
    if bundle is None:
        raise HTTPException(status_code=500, detail="Unable to load saved consultation results")
    return bundle


@router.post(
    "/api/consultations/{consultation_id}/start",
    response_model=ConsultationSessionResponse,
)
def start_consultation_session(consultation_id: int, db: Session = Depends(get_db)):
    consultation = (
        db.query(Consultation).filter(Consultation.id == consultation_id).first()
    )
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    consultation.status = "in_progress"
    consultation.started_at = datetime.utcnow()
    db.commit()
    db.refresh(consultation)
    return {"consultation_id": consultation.id, "status": consultation.status}


@router.post(
    "/api/consultations/{consultation_id}/end",
    response_model=ConsultationSessionResponse,
)
def end_consultation_session(consultation_id: int, db: Session = Depends(get_db)):
    consultation = (
        db.query(Consultation).filter(Consultation.id == consultation_id).first()
    )
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    consultation.status = "completed"
    consultation.ended_at = datetime.utcnow()
    db.commit()
    db.refresh(consultation)
    return {"consultation_id": consultation.id, "status": consultation.status}


@router.post(
    "/api/consultations/{consultation_id}/recording",
    response_model=ConsultationResponse,
)
async def upload_consultation_recording(
    consultation_id: int,
    audio: UploadFile = File(...),
    duration_seconds: Optional[int] = FastAPIForm(default=None),
    sample_rate: Optional[int] = FastAPIForm(default=None),
    channels: Optional[int] = FastAPIForm(default=None),
    db: Session = Depends(get_db),
):
    consultation = (
        db.query(Consultation).filter(Consultation.id == consultation_id).first()
    )
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    file_ext = Path(audio.filename or "recording.pcm").suffix or ".pcm"
    file_name = f"consultation_{consultation_id}_{uuid.uuid4().hex}{file_ext}"
    target_path = CONSULTATION_RECORDINGS_DIR / file_name

    content = await audio.read()
    target_path.write_bytes(content)

    consultation.recording_file_path = str(target_path)
    consultation.recording_original_name = audio.filename
    consultation.recording_mime_type = audio.content_type
    consultation.recording_size_bytes = len(content)
    consultation.recording_duration_seconds = duration_seconds
    consultation.recording_sample_rate = sample_rate
    consultation.recording_channels = channels

    db.commit()
    db.refresh(consultation)
    return serialize_consultation(consultation)


@router.get("/api/consultations/{consultation_id}/recording")
def download_consultation_recording(
    consultation_id: int, db: Session = Depends(get_db)
):
    consultation = (
        db.query(Consultation).filter(Consultation.id == consultation_id).first()
    )
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    if not consultation.recording_file_path:
        raise HTTPException(status_code=404, detail="Recording not found")

    file_path = Path(consultation.recording_file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Recording file missing")

    return FileResponse(
        path=file_path,
        media_type=consultation.recording_mime_type or "application/octet-stream",
        filename=consultation.recording_original_name or file_path.name,
    )


@router.post("/api/consultation/start")
async def start_consultation(
    patient_id: str, doctor_id: Optional[str] = None, db: Session = Depends(get_db)
):
    consultation = Consultation(
        patient_id=patient_id,
        doctor_id=doctor_id or "unknown-doctor",
        title="Live Consultation",
        status="in_progress",
        started_at=datetime.utcnow(),
    )
    db.add(consultation)
    db.commit()
    db.refresh(consultation)
    return {"consultation_id": consultation.id, "status": consultation.status}


@router.post("/api/consultation/end")
async def end_consultation(consultation_id: int, db: Session = Depends(get_db)):
    consultation = (
        db.query(Consultation).filter(Consultation.id == consultation_id).first()
    )
    if consultation:
        consultation.status = "completed"
        consultation.ended_at = datetime.utcnow()
        db.commit()
        db.refresh(consultation)

    # We retrieve the context service via DI here
    context_service = get_context_service()
    context_service.clear_context(str(consultation_id))

    return {"status": "ended", "consultation_id": consultation_id}
