Taking the diagnosis with the "most connections" is a good starting point, but in clinical medicine, it can lead to a trap called the **"Generality Bias."** A common condition like "Common Cold" has thousands of connections in a knowledge graph, whereas a rare but specific condition might only have five. If you only count connections, the system will over-diagnose common illnesses and miss specific ones.

To build a robust Diagnostic Decision Support System (DDSS), you should use a **Weighted Scoring** approach.

---

### 1. The Scoring Formula
Instead of just counting links, you should calculate a **Clinical Relevance Score ($S$)** for each candidate diagnosis. A simplified version of the logic used in systems like *Isabel* or *DXplain* is:

$$S = \sum_{i=1}^{n} (w_i \cdot c_i)$$

Where:
* $w_i$: The **Weight** of the symptom (How rare/specific is it?).
* $c_i$: The **Confidence** of the NLP extraction (How sure was BERT?).
* $n$: The number of patient symptoms that "hit" this diagnosis.

---

### 2. Three Ways to Differentiate

#### A. Symptom Specificity (Inverse Frequency)
Not all symptoms are created equal. 
* **Low Weight:** "Fatigue" is connected to 500+ diseases. It provides very little "information gain."
* **High Weight:** "Acanthosis Nigricans" (darkened skin patches) is connected to only a few.
**Strategy:** Give higher points to matches on "rare" symptoms. This prevents "Fatigue" from accidentally triggering every disease in your graph.

#### B. The "Intersection" Rule (Coverage)
A diagnosis that explains **4 out of 4** of a patient’s symptoms is much more likely than one that explains **4 out of 20**.
* **Diagnosis A:** Explains "Fatigue" and "Thirst" (2/2 symptoms).
* **Diagnosis B:** Explains "Fatigue," "Thirst," "Back Pain," and "Vision Loss" (but the patient only has the first two).
**Strategy:** Prioritize the "Best Fit" (the one with the highest percentage of explained symptoms).

#### C. Spreading Activation (The "Voting" System)
Think of each symptom as a power source. When "Fatigue" and "Thirst" are activated, they "send electricity" down their edges to all connected diseases. 
* Diseases that receive "electricity" from **multiple** symptoms light up the brightest.
* In Neo4j, you can run this using the **PageRank** or **Betweenness Centrality** algorithms on a subgraph of the patient's symptoms.

---

### 3. Neo4j Cypher Example: Weighted Scoring
This query finds potential diagnoses and ranks them by how many of the patient's symptoms they "solve," weighted by the clinical importance of the relationship.

```cypher
// 1. Start with the symptoms identified in the JSON/BERT step
WITH ['Fatigue', 'Increased Thirst', 'Frequent Urination'] AS patient_symptoms

// 2. Find diagnoses that connect to these symptoms
MATCH (s:Symptom)-[r:INDICATES]->(d:Diagnosis)
WHERE s.name IN patient_symptoms

// 3. Calculate a score based on relationship weight and coverage
RETURN d.name AS Diagnosis,
       count(s) AS SymptomsExplained,
       sum(r.probability_weight) AS TotalWeight,
       collect(s.name) AS EvidenceChain
ORDER BY SymptomsExplained DESC, TotalWeight DESC
LIMIT 5
```

---

### 4. Handling the "Explainability" (The Glass Box)
When you present this to the doctor, don't just show the winner. Show the **Differential Diagnosis**.



* **Primary Suggestion:** Type 2 Diabetes (Match: 3/3 symptoms, High Specificity).
* **Alternative:** Anemia (Match: 1/3 symptoms, Low Specificity).
* **Why?** Show the "Missing" symptoms: *"The system considered Anemia due to Fatigue, but the absence of 'Paleness' and 'Shortness of breath' makes it less likely."*

### Recommendation for your ADR
Add a section to **ADR-04: Graph** or a new **ADR-06: Inference Logic** regarding **Parsimony (Occam’s Razor)**. You want the system to find the *minimum* number of diagnoses that explain the *maximum* number of symptoms.

**Do you have "Probability Weights" (e.g., "70% of people with X have symptom Y") available in your SNOMED subset, or are you working with "Flat" relationships for now?**
