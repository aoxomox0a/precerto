import kuzu
import spacy
import os
import re


class ReasoningService:
    """Service for diagnostic reasoning using KuzuDB Knowledge Graph."""

    def __init__(self, nlp_model, db_path="precerto_graph_db"):
        print("[REASONING] Connecting to Knowledge Graph...")

        # 1. Get the absolute path of the directory this python file is sitting in
        current_dir = os.path.dirname(os.path.abspath(__file__))

        # 2. Walk up to the root folder if necessary (adjust the '..' if your db is in the root)
        # Assuming reasoning.py is in /app/services/ and the db is in the root:
        root_dir = os.path.abspath(os.path.join(current_dir, "../../"))

        # 3. Lock in the absolute database path
        self.db_path = os.path.join(root_dir, db_path)

        try:
            print(f"[REASONING] Looking for DB at {self.db_path}")
            self.db = kuzu.Database(self.db_path)
            self.conn = kuzu.Connection(self.db)
            print("[REASONING] KuzuDB Connected.")

            # INJECTED MODEL: We no longer run spacy.load() here!
            self.nlp = nlp_model

            # Cache all valid graph nodes in memory on startup
            self.valid_graph_nodes = self._get_all_graph_symptoms()
            self.node_vectors = [
                self.nlp(node.lower()) for node in self.valid_graph_nodes
            ]
            print(f"[REASONING] Cached {len(self.valid_graph_nodes)} graph nodes.")
        except Exception as e:
            print(f"Failed to initialize ReasoningService: {e}")

    def _get_all_graph_symptoms(self) -> list[str]:
        if not self.conn:
            return []

        query = """
        MATCH (c:Concept)
        WHERE c.type IN ['Symptom', 'Disease', 'Risk Factor']
        RETURN c.name
        """

        try:
            results = self.conn.execute(query)
            return [results.get_next()[0] for _ in range(results.get_num_tuples())]
        except Exception as e:
            print(f"Error caching nodes: {e}")
            return []

    def _map_to_graph(self, extracted_symptoms: list[str], threshold=0.73) -> list[str]:
        """Maps messy NLP extractions to strict Graph Nodes using a Lexical-Semantic Hybrid approach."""
        mapped_symptoms = []

        for ext in extracted_symptoms:
            ext_clean = ext.lower().strip()
            matched_lexically = False

            # STEP 1: LEXICAL SUBSTRING CHECK (Prevents Vector Drift)
            for valid_node in self.valid_graph_nodes:
                valid_clean = valid_node.lower()

                exact_match = ext_clean == valid_clean
                ext_in_valid = re.search(rf"\b{re.escape(ext_clean)}\b", valid_clean)
                valid_in_ext = re.search(rf"\b{re.escape(valid_clean)}\b", ext_clean)

                if exact_match or ext_in_valid or valid_in_ext:
                    print(
                        f"LEXICAL MATCH: '{ext}' ➜ '{valid_node}' (Boundary matching)"
                    )
                    mapped_symptoms.append(valid_node)
                    matched_lexically = True
                    break

            if matched_lexically:
                continue

            # STEP 2: SEMANTIC COSINE SIMILARITY FALLBACK
            ext_doc = self.nlp(ext_clean)
            best_match = None
            best_score = 0.0

            for i, valid_doc in enumerate(self.node_vectors):
                score = ext_doc.similarity(valid_doc)
                if score > best_score:
                    best_score = score
                    best_match = self.valid_graph_nodes[i]

            if best_score >= threshold:
                print(
                    f"SEMANTIC MAPPED: '{ext}' ➜ '{best_match}' (Similarity: {best_score:.2f})"
                )
                mapped_symptoms.append(best_match)
            else:
                print(
                    f"DISCARDED OUT-OF-DOMAIN: '{ext}' (Best graph match was '{best_match}' at {best_score:.2f})"
                )

        return list(set(mapped_symptoms))

    def get_diagnosis_path(self, symptoms: list[str]) -> dict:
        if not self.conn or not symptoms:
            return {"suggestions": [], "reasoning_path": [], "synthesized_drivers": []}

        # 1. Map free-text extractions to our strict CSV properties
        strict_graph_symptoms = self._map_to_graph(symptoms)
        print(f"Final strict graph nodes executing in Cypher: {strict_graph_symptoms}")

        if not strict_graph_symptoms:
            return {"suggestions": [], "reasoning_path": [], "synthesized_drivers": []}

        query = """
        MATCH (s:Concept)-[r1:SNOMED_REL {type: 'HAS_MANIFESTATION'}]->(c:Concept)
        WHERE s.name IN $symptoms_list
        
        OPTIONAL MATCH (c)-[r2:SNOMED_REL {type: 'ASSOCIATED_WITH'}]->(o:Concept {name: 'obesity'})
        
        RETURN c.name AS condition, 
               collect(s.name) AS evidence,
               sum(r1.weight) AS total_weight,
               o.name AS root_cause
        """

        try:
            results = self.conn.execute(
                query, parameters={"symptoms_list": strict_graph_symptoms}
            )

            diagnoses = []
            reasoning_paths = []
            total_observed = len(strict_graph_symptoms)

            # Dictionary to synthesize overlapping root causes
            root_synthesis = {}

            while results.has_next():
                row = results.get_next()
                condition, evidence_list, total_weight, root_cause = (
                    row[0],
                    row[1],
                    row[2],
                    row[3],
                )

                if condition:
                    # Use the statistical weight instead of flat counting!
                    raw_confidence = (total_weight / total_observed) * 120
                    confidence = min(round(raw_confidence), 99)
                    urgency = "urgent" if confidence >= 65 else "routine"

                    diagnoses.append(
                        {
                            "condition": condition.title(),
                            "confidence": confidence,
                            "matched_symptoms": evidence_list,
                            "urgency": urgency,
                        }
                    )

                    # Synthesize overlapping root causes
                    if root_cause:
                        root_name = root_cause.title()
                        if root_name not in root_synthesis:
                            root_synthesis[root_name] = {
                                "aggregated_weight": 0.0,
                                "conditions": set(),
                                "evidence": set(),
                            }
                        # Compound the weight from every intersecting condition!
                        root_synthesis[root_name]["aggregated_weight"] += total_weight
                        root_synthesis[root_name]["conditions"].add(condition.title())
                        root_synthesis[root_name]["evidence"].update(evidence_list)

                    path = f"Observed ({', '.join(evidence_list)}) ➜ Suggests Risk Of ➜ {condition.title()}"
                    if root_cause:
                        path += f" ➜ Root Risk Vector ➜ {root_cause.title()}"
                    reasoning_paths.append(path)

            diagnoses.sort(key=lambda x: x["confidence"], reverse=True)

            # Finalize Synthesized Drivers
            synthesized_drivers = []
            for root, data in root_synthesis.items():
                agg_conf = min(
                    round((data["aggregated_weight"] / total_observed) * 120), 99
                )
                synthesized_drivers.append(
                    {
                        "primary_driver": root,
                        "confidence": agg_conf,
                        "driven_conditions": list(data["conditions"]),
                        "total_evidence": list(data["evidence"]),
                    }
                )

            synthesized_drivers.sort(key=lambda x: x["confidence"], reverse=True)

            print(f"📊 Query complete. Found {len(reasoning_paths)} paths.")

            # Print beautiful synthesized output for the demo
            if synthesized_drivers:
                print("\n🧠 SYNTHESIZED CLINICAL DIAGNOSIS 🧠")
                print("====================================")
                for driver in synthesized_drivers:
                    print(
                        f"🎯 PRIMARY DRIVER: {driver['primary_driver']} (Confidence: {driver['confidence']}%)"
                    )
                    print(
                        f"   ↳ Driving Complications: {', '.join(driver['driven_conditions'])}"
                    )
                print("====================================\n")

            return {
                "synthesized_drivers": synthesized_drivers,
                "suggestions": diagnoses,
                "reasoning_path": reasoning_paths,
            }

        except Exception as e:
            print(f"Graph Query Error: {e}")
            return {"suggestions": [], "reasoning_path": [], "synthesized_drivers": []}
