# scispacy
import spacy
from scispacy.abbreviation import AbbreviationDetector
from scispacy.linking import EntityLinker
from negspacy.negation import Negex
from negspacy.termsets import termset
import re


class NLPService:
    def __init__(self):
        print("Loading SciSpacy Medical Model...")
        # Load the small scientific model we just installed
        try:
            # Load the Large model for better multi-word phrase accuracy
            self.nlp = spacy.load("en_core_sci_lg")

            # Add the abbreviation detector to the pipeline
            # This handles things like 'BP' -> 'Blood Pressure'
            self.nlp.add_pipe("abbreviation_detector")

            ts = termset("en_clinical")
            ts.add_patterns(
                {
                    "termination": [
                        "reports",
                        "he has",
                        "she has",
                        "presents with",
                        "complains of",
                        "also has",
                    ]
                }
            )

            # 2. Add NegEx to the pipeline
            self.nlp.add_pipe("negex", config={"neg_termset": ts.get_patterns()})

            # Add the Entity Linker (UMLS) to help resolve synonyms
            # Note: This will download a ~500MB linker file on first run
            self.nlp.add_pipe(
                "scispacy_linker",
                config={"resolve_abbreviations": True, "linker_name": "umls"},
            )

            print("SciSpacy Large Model & Pipelines Loaded.")
        except Exception as e:
            print(f"SciSpacy Initialization Error: {e}")
            # Fallback to a blank model so the app doesn't crash,
            # though extraction will be empty until fixed.
            self.nlp = spacy.blank("en")

    def extract_symptoms(self, text: str) -> list[str]:
        if not self.nlp:
            return []

        doc = self.nlp(text.lower())
        extracted = []

        for ent in doc.ents:
            if len(ent.text) > 2:
                # 1. CONTEXT SAFETY NET (Fixed)
                # Note: We removed is_family/is_hypothetical. Negspacy strictly handles negation.
                if ent._.negex:
                    print(f"[NEGATED] Ignored: {ent.text}")
                    continue

                # 2. THE CLINICAL RULES INTERCEPTOR (For Measurements)
                ent_text = ent.text.lower()
                if "body mass index" in ent_text or "bmi" in ent_text:
                    sentence = ent.sent.text
                    match = re.search(r"\b(\d{2,3}(?:\.\d+)?)\b", sentence)

                    if match:
                        bmi_value = float(match.group(1))
                        if bmi_value >= 30.0:
                            extracted.append("obesity")
                        elif bmi_value >= 25.0:
                            extracted.append("overweight")

                    extracted.append(ent.text)
                    continue

                # 3. STANDARD EXTRACTION
                extracted.append(ent.text)

        return list(set(extracted))


# Quick test if you run this file directly
if __name__ == "__main__":
    service = NLPService()
    test_text = "The patient reports severe snoring, fatigue, and frequent urination."
    print(service.extract_symptoms(test_text))
    # Should output: ['snoring', 'fatigue', 'frequent urination']
