# ARD-003: JSON NoSQL Database (Document Store)

**Status:** Pending
**Date:** 2026-04-02

## 1. Context
The patient fills out a questionnaire using partially structured responses and partially unstructured natural language. This data must be stored somewhere for future use.

## 2. Decision
A Document Store is generally considere the best fit for medical questionnaires and form-based data:
1. **Hierarchical data**: a single json document can store the patient info, the questions, metadata and the answers in one place.
2. **Development speed**: a Document Store does not require an ORM between the app and database.

## 3. Consequences
* **Positive:** doesn't require ORM 
* **Positive:** no data pre-processing needed before sending to database 
* **Negative (Performance):** Introducing an LLM step before the NER step creates a sequential processing bottleneck. The system's latency is strictly bound by the LLM's response time.
* **Mitigation:** We must use a highly optimized, small-parameter LLM (or a fast API) constrained to outputting strict JSON to keep the pipeline near real-t
