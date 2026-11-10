# ADR-05: NLP Extraction

## 1. Context
Raw medical questionnaire data contains unstructured, "abstract" patient language (e.g., "my thirst is unquenchable"). To enable the graph-based reasoning defined in ADR-003, these mentions must be mapped to standardized SNOMED-CT concepts. We require a method that handles medical synonyms accurately while strictly limiting outputs to the curated subset available in our Neo4j Knowledge Graph.

## 2. Decision
Giving the model the graph beforehand? By "giving" the model the graph beforehand via a Vector Index, we solve part of the brittleness. The model is physically incapable of suggesting an entity that isn't in the Neo4j graph because it is only allowed to "pick" from the list of vectors you provided.

Different approaches:

2. **SapBERT**: We could use SapBERT which was pretrained on millions of pairs of SNOMED synonyms. It learns that "Polydipsia" and "excessive thirst" should have almost identical coordinates in its internal "map." This makes your "translator" incredibly robust at mapping "abstract sentences" (e.g., "I'm drinking water constantly") to the specific SNOMED node for Polydipsia.

4. **Vector index of SNOMED set**:
    - Embed the Graph: You turn every SNOMED concept name in your Neo4j graph into a vector (a string of numbers) using your BERT model.
    - The "Live" Translation: When a patient writes, "My energy is totally zapped," BERT turns that sentence into a vector.
    - The Comparison: You perform a "Nearest Neighbor" search. You ask the database: "Which of our valid SNOMED nodes is mathematically closest to 'energy is totally zapped'?"
    - The Winner: The system returns SCTID: 84229001 (Fatigue).

## 3. Alternatives considered

1. **GEBERT**: GEBERT (Graph-Enhanced BERT) uses the actual edges of the Neo4j graph during the training process. If two concepts are connected in SNOMED (like Insulin and Diabetes), the model is forced to place their mathematical representations close together. When the BERT model encounters a confusing sentence, it uses its "memory" of the graph structure to narrow down the most likely clinical entity.
2. Clinical ModernBERT or bioMedicalBERT.


## 4. Consequences

1. **Pro**: better context awareness than keyword matching
2. **Pro**: zero hallucination
3. **Con**: if the patient describes a brand-new symptom (e.g., a new side effect of a 2026 drug) that isn't in the SNOMED subset yet, the model will try to "force" it into the closest existing category, which could lead to a misdiagnosis.
