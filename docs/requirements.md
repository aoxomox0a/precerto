# System Requirements Specification: Integrated Ambient DDSS

**Project:** Integrated Diagnostic Decision Support System (DDSS)  
**Document Context:** Requirements derived directly from the Business Model Canvas (Concept to Market Phase).

---

## 1. Technical Requirements

- **TR-01 (Real-Time Audio Ingestion)**: The system must continuously capture and transcribe the dialogue between the doctor and patient locally to ensure patient data privacy.
- **TR-02 (Context Memory)**: The system must be able to track active subjects and prevent conversational drift (e.g., filter out symptoms belonging to a patient's relative).
- **TR-03 (Deterministic Graph Reasoning)**: The reasoning engine must be built on a curated subset of SNOMED CT within a Graph Database (Neo4j/KuzuDB) to allow for exact entity linking (SciSpacy) rather than probabilistic generation.
- **TR-04 (Manual Session Control)**: The clinician must have explicit, manual control via the frontend interface to activate, pause, and stop the real-time audio ingestion to respect patient consent and standard workflow boundaries.
- **TR-05 (Hardware Constraints)**: The system must operate efficiently on a standard clinician's laptop (typically 8 to 16 GB RAM, CPU-only) without requiring a dedicated GPU or causing system-wide throttling. All architectural choices must prioritize this hardware limitation.
- **TR-06 (Interpretability)**: The doctor must be presented with a dashboard that clearly displays both the extracted clinical entities and the deterministic reasoning path, to ensure reliability and interpretability.

- **TR-07 (Form Creation)**: The system must allow the doctor to create medical forms composed of multiple categories (e.g., physical health, sleep, mental wellness, nutrition).

- **TR-08 (Standardized Question Selection)**: The system must provide access to a predefined library of standardized, medically validated questions that the doctor can select when creating a form.

- **TR-09 (Custom Question Creation)**: The system must allow the doctor to create personalized questions and include them within a form.

- **TR-10 (Form Management)**: The system must allow the doctor to assign one or more forms to a specific patient.It must allow the doctor to modify existing forms, including updating questions, categories, or structure.

- **TR-11 (Patient Form Completion)**: The system must provide a simple and accessible user interface that allows patients to complete assigned forms easily.

- **TR-12 (Form Submission)**: The system must allow patients to submit completed forms, which are then made available to the assigned doctor.

- **TR-13 (Doctor Form Review)**: The system must allow the doctor to view submitted forms, with responses organized clearly by category and date.

- **TR-14 (Patient Profile Access)**: The system must allow the doctor to access and view individual patient profiles, including medical history and submitted forms.

- **TR-15 (Medical Team Visibility)**: The system must allow patients to view their assigned medical team (e.g., doctors, specialists).

- **TR-16 (Data Consistency)**: The system must ensure that any form creation, modification, assignment, or submission is consistently reflected across both doctor and patient interfaces.

- **TR-17 (Session Continuity)**: The system must maintain user session context to ensure continuity between interactions (e.g., ongoing form completion or consultation session).

## 2. Commercial Requirements

- **CR-01 (Hospital Integration)**: The system must easily connect to existing hospital software (like SMART on FHIR) so clinics don't have to change their workflow to adopt it.
- **CR-02 (Standard Hardware)**: Aside from a directional microphone, the software must run on normal clinical laptops or secure clouds. We cannot force hospitals to buy expensive, custom hardware.
- **CR-03 (Data Separation)**: If sold as a subscription, the architecture must keep different clinics' data strictly isolated and secure from one another.

## 3. Social & Ethical Requirements

- **SR-01 (No Manual Typing)**: The system must handle data entry automatically in the background so doctors can focus entirely on the patient.
- **SR-02 (The "Glass Box")**: The dashboard must show its homework. It needs to display exactly why a disease is suggested (e.g., Symptom A + Symptom B -> Disease) rather than just spitting out a percentage.
- **SR-03 (The Doctor is in Charge)**: The system cannot make the final call. The UI must force the clinician to actively "Accept" or "Reject" the AI's suggestions to prevent them from blindly trusting the machine.
- **SR-04 (Explicit Patient Consent)**: The system must ensure that patients provide explicit, informed consent before any audio recording or data processing begins. The interface must clearly indicate when recording is active and allow patients or clinicians to stop it at any time.
- **SR-05 (Data Privacy & Minimization)**: The system must only collect, process, and store the minimum amount of patient data necessary for its functionality. All sensitive data must be handled securely and, where possible, processed locally to reduce exposure risks.

## 4. Economic Requirements

- **ER-01 (Low Running Costs)**: We must use optimized local models or highly efficient APIs. If our AI processing costs more than what we charge clinics for the software, the business model fails.
- **ER-02 (Free Core Tools)**: The foundation of our pipeline must rely on open-source, license-free software (like scispacy and faster-whisper) to keep our operating overhead as close to zero as possible.
