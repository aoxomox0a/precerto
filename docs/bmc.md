# Business Model Canvas: Integrated Ambient DDSS

**Project:** Integrated Diagnostic Decision Support System (DDSS)  
**Date:** 2026-04-02  
**Focus:** Fusing ambient clinical dialogue with pre-consultation history.

---

## 1. Value Propositions *(Drives Social Requirements)*
* **Zero-Friction Workflow:** Eliminates manual data entry via local ambient audio capture, allowing doctors to focus entirely on the patient (SR-03).
* **Verifiable Explainability (The "Glass Box"):** Outputs explicit reasoning paths rather than opaque percentages, building clinical trust and meeting MedDO/MDR safety standards (SR-01).
* **Mitigated Automation Bias:** Acts as a clinical co-pilot requiring physician validation, actively preventing blind reliance on AI suggestions (SR-02).
* **Contextual Data Fusion:** Synthesizes subjective pre-consultation data with live objective dialogue, intelligently filtering out non-patient symptoms.

## 2. Customer Segments
* **Primary Care Clinics / GPs:** High-volume environments where reducing time spent typing notes is the most critical operational need.
* **Specialty Clinics (Metabolic/Endocrine):** Clinics focused on complex, multi-symptom disorders requiring deep ontological mapping.
* **Teaching Hospitals:** Environments seeking educational tools where the explicit "reasoning path" UI trains residents on diagnostic logic.

## 3. Channels *(Drives Commercial Requirements)*
* **EHR App Marketplaces:** Direct integration via the SMART on FHIR standard (CR-01) into existing platforms like Epic and Cerner.
* **Hardware-Agnostic Deployment:** Delivering the service as a secure web dashboard accessible on existing clinical workstations (CR-02).
* **Medical Tech Conferences:** Live demonstrations of the real-time "Audio-to-Graph" pipeline.

## 4. Customer Relationships
* **Clinical Trust & Co-Creation:** Partnering with physicians during the MVP phase to validate the Neo4j graph logic and UI usability.
* **High-Touch B2B Support:** Dedicated onboarding to calibrate directional microphones and ensure flawless ambient capture in specific clinic rooms.
* **Regulatory Transparency:** Maintaining open, auditable documentation of the deterministic reasoning engine.

## 5. Revenue Streams *(Drives Commercial Requirements)*
* **B2B SaaS Subscription:** Tiered monthly licensing per physician/seat, built on a multi-tenant scalable architecture (CR-03).
* **API/White-Label Licensing:** Licensing the proprietary "Contextual Gatekeeper" and "Hybrid NLP to Graph" pipeline to larger healthcare IT vendors.
* **Innovation Grants:** Securing initial non-dilutive funding (e.g., Innosuisse) to transition the academic prototype to a commercial MVP.

## 6. Key Resources *(Drives Technical Requirements)*
* **Deterministic Knowledge Graph:** The curated SNOMED CT subset (Obesity/Metabolic) running in a Neo4j database (TR-03).
* **Open-Source Core:** Highly leveraged open-source inference models (`whisper.cpp`, `scispacy`) running locally (ER-02).
* **The Engineering Pipeline:** The proprietary FastAPI orchestration engine managing the state memory (TR-02).

## 7. Key Activities *(Drives Technical & Economic Requirements)*
* **Stateful Context Orchestration:** Actively managing the active subject in the live dialogue to prevent clinical hallucinations (TR-02).
* **LLM Optimization:** Continuously tuning the rolling context window to minimize API token usage and maintain real-time processing speeds (ER-01).
* **Knowledge Engineering:** Mapping, verifying, and updating new clinical edges in the graph database.

## 8. Key Partnerships
* **SNOMED International / e-health.ch:** Providing the foundational, standardized medical ontology.
* **EHR Vendors:** To ensure seamless SMART on FHIR interoperability.
* **Hardware Vendors:** Sourcing specialized microphones required for accurate ambient capture in noisy environments.
* **LLM API Providers:** Supplying the underlying engine for the "Contextual Gatekeeper."

## 9. Cost Structure *(Drives Economic Requirements)*
* **Optimized LLM Inference:** Pay-per-token costs for the live audio stream, strictly managed by the context window efficiency (ER-01).
* **R&D & Talent:** The primary operational cost (NLP, Graph Engineering, and API Orchestration).
* **Regulatory Compliance:** Ongoing costs for audits, MDR certification processes, and data privacy (GDPR/FADP).
* **Infrastructure Hosting:** Cloud hosting for the FastAPI server and scalable Neo4j database instances.
