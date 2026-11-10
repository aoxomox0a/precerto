# ADR-06: Inference Logic

**Status**: Pending
**Date:** 2026-04-02


## 1. Context
We want the system to find the minimum number of diagnoses that explain the maximum number of symptoms.

## 2. Decision
For each candidate diagnosis we calculate a score (combination of weight, confidence score and number of patient symptoms hitting the diagnosis)

Use a weighted scoring:
- Nodes with many connections have smaller weight
- Nodes with fewer connections have higher weight

