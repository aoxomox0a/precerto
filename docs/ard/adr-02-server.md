# ADR 002: FastAPI

**Status:** Pending
**Date:** 2026-04-02

## 1. Context
The architecture must fuse two different data models: Asynchronous Batch data (Pre-consultation JSON) and Synchronous Stream data (Live audio chunks). The inference tools (Whisper, LLM, SciSpacy) are inherently stateless; they do not remember previous interactions.

## 2. Decision
We will use `FastAPI` not just as a routing middleman, but as the **Stateful Orchestrator** of the service.
When FastAPI receives a transcribed chunk (Step 4), it will actively query the `Document Store` (Step 5) to fetch the session context *before* passing data to the Inference Layer. FastAPI will manage the "Rolling Context" required by the LLM filter.

## 3. Consequences
* **Positive:** Separates concerns. The Inference Layer tools remain isolated micro-functions that only process the exact payloads they are handed, simplifying testing.
* **Positive:** Allows FastAPI to cache the patient's pre-consultation history in memory during the active session, preventing redundant database reads.
* **Negative:** FastAPI becomes a single point of failure and a heavy processing nexus. If the FastAPI server crashes during a consultation, the rolling context state may be lost if not committed to the database frequently enough.
