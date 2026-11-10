# ADR 003: Graph Traversal for Diagnostic Explainability

**Status:** Pending
**Date:** 2026-04-02

## 1. Context
Once clinical entities are extracted, the system must provide diagnostic support to the clinician. Providing a raw percentage likelihood (e.g., "90% chance of Diabetes") introduces severe "Black Box" regulatory risks and degrades clinical trust.

## 2. Decision
We will utilize a `Neo4j` Knowledge Graph populated with a SNOMED subset (possibly additional KGs) as the sole reasoning engine. The diagnostic output returned to the Clinician Dashboard (Step 9 & 10) will not be a generated statement, but the **explicit graph traversal path** (e.g., showing how the pre-consultation 'Fatigue' node and live 'Thirst' node intersect at 'Type 2 Diabetes').

## 3. Consequences
* **Positive (Regulatory & Trust):** Provides a verifiable "Glass Box" explanation. Clinicians can visually inspect the exact evidence that triggered the alert.
* **Positive (Safety):** The system cannot mathematically hallucinate a disease that does not exist in the curated SNOMED ontology.
* **Negative (Brittleness):** The system's intelligence is strictly limited to the edges manually defined or imported into the Neo4j subset. If an edge is missing, the diagnostic intersection will fail silently, providing no output rather than a "best guess."
