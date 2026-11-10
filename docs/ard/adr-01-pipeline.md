# ADR 001: Pipeline

**Status:** Pending
**Date:** 2026-04-02

## 1. Context
During the live consultation, the system receives continuous transcribed text chunks from the `whisper.cpp` engine. Live medical dialogue often contains "conversational drift," where patients discuss symptoms belonging to relatives (e.g., a sick child) rather than themselves.

We need an extraction pipeline that can accurately attribute subjects to symptoms without losing the deterministic explainability required for medical software. We considered:
* **Pure Rule-Based NLP:** Fast, but fails to handle complex pronoun coreference and subjective metaphors.
* **Pure LLM Extraction:** High risk of hallucination and loss of standardized concept mapping (SNOMED CT).

## 2. Decision
We will implement a two-stage **Hybrid NLP Pipeline** orchestrated by FastAPI:
1. **Contextual Gatekeeping (Step 6):** Pass the transcribed chunk to an LLM explicitly prompted to perform *Subject Attribution* (filtering out non-patient symptoms).
2. **Deterministic Linking (Step 7):** Pass the filtered patient symptoms to a Medical NER Pipeline (`SciSpacy`) to map the text to rigid clinical concept IDs.

## 3. Consequences
* **Positive:** Eliminates "automation bias" caused by misattributed symptoms (e.g., diagnosing the patient with the child's fever).
* **Positive:** Maintains strict adherence to medical ontologies by using SciSpacy (which was trained on medical sentences) as the final arbiter of the semantic concept.
* **Negative (Performance):** Introducing an LLM step before the NER step creates a sequential processing bottleneck. The system's latency is strictly bound by the LLM's response time.
* **Mitigation:** We must use a highly optimized, small-parameter LLM (or a fast API) constrained to outputting strict JSON to keep the pipeline near real-time.
