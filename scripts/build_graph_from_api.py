import requests
import pandas as pd
import time

# 1. Our Curated DDSS Logic (The Expanded Obesity Network)
CLINICAL_RULES = [
    # Risk Factors -> Obesity
    ("160603009", "414916001", "PREDISPOSES_TO"),
    ("228384000", "414916001", "PREDISPOSES_TO"),
    ("160352001", "414916001", "PREDISPOSES_TO"),
    ("183953006", "414916001", "PREDISPOSES_TO"),
    # Causes -> Obesity
    ("40930008", "414916001", "CAUSES"),
    # Symptoms -> Causes
    (
        "100360090",
        "40930008",
        "HAS_MANIFESTATION",
    ),  # Cold intolerance -> Hypothyroidism
    ("110343009", "40930008", "HAS_MANIFESTATION"),  # Dry skin -> Hypothyroidism
    # Symptoms -> Obesity
    ("248311001", "414916001", "HAS_MANIFESTATION"),
    ("418556008", "414916001", "HAS_MANIFESTATION"),
    ("8943002", "414916001", "HAS_MANIFESTATION"),
    ("271807003", "414916001", "HAS_MANIFESTATION"),
    ("415693006", "414916001", "HAS_MANIFESTATION"),
    # Symptoms -> Sleep Apnea
    ("28218007", "78275009", "HAS_MANIFESTATION"),
    ("248234008", "78275009", "HAS_MANIFESTATION"),
    ("84229001", "78275009", "HAS_MANIFESTATION"),
    ("25064002", "78275009", "HAS_MANIFESTATION"),
    ("271823003", "78275009", "HAS_MANIFESTATION"),
    ("386661006", "78275009", "HAS_MANIFESTATION"),
    # Symptoms -> Osteoarthritis
    ("57676002", "396275006", "HAS_MANIFESTATION"),
    ("30989003", "396275006", "HAS_MANIFESTATION"),
    ("31996006", "396275006", "HAS_MANIFESTATION"),
    # Symptoms -> Hypertension
    ("162059005", "38341003", "HAS_MANIFESTATION"),
    ("404640003", "38341003", "HAS_MANIFESTATION"),
    # Symptoms -> Type 2 Diabetes
    ("13104003", "44054006", "HAS_MANIFESTATION"),
    ("17173007", "44054006", "HAS_MANIFESTATION"),
    ("56888005", "44054006", "HAS_MANIFESTATION"),
    ("248253005", "44054006", "HAS_MANIFESTATION"),
    ("402220005", "44054006", "HAS_MANIFESTATION"),
    # Symptoms -> PCOS
    ("698247007", "237055002", "HAS_MANIFESTATION"),
    ("13132007", "237055002", "HAS_MANIFESTATION"),
    ("271143002", "237055002", "HAS_MANIFESTATION"),
    (
        "402220005",
        "237055002",
        "HAS_MANIFESTATION",
    ),  # Acanthosis nigricans links to both Diabetes & PCOS
    # Symptoms -> GERD
    ("16331000", "235595009", "HAS_MANIFESTATION"),
    ("60256002", "235595009", "HAS_MANIFESTATION"),
    # Symptoms -> Coronary Artery Disease
    ("29857009", "53741008", "HAS_MANIFESTATION"),
    ("195204004", "53741008", "HAS_MANIFESTATION"),
    ("267036007", "53741008", "HAS_MANIFESTATION"),
    # Symptoms -> NAFLD
    ("267045009", "235856003", "HAS_MANIFESTATION"),
    # Symptoms -> Gout
    ("52624009", "90560007", "HAS_MANIFESTATION"),
    ("271772005", "90560007", "HAS_MANIFESTATION"),
    # Symptoms -> Depression
    ("13791008", "35489007", "HAS_MANIFESTATION"),
    ("20088000", "35489007", "HAS_MANIFESTATION"),
    ("268686001", "35489007", "HAS_MANIFESTATION"),
    # Symptoms -> Asthma
    ("267036007", "195967001", "HAS_MANIFESTATION"),
    ("271681002", "195967001", "HAS_MANIFESTATION"),
    # Symptoms -> Cholelithiasis
    ("267045009", "11563006", "HAS_MANIFESTATION"),
    # Symptoms -> Chronic Venous Insufficiency
    ("65124004", "111438007", "HAS_MANIFESTATION"),
    ("129030006", "111438007", "HAS_MANIFESTATION"),
    # Diseases -> Associated with Obesity
    ("38341003", "414916001", "ASSOCIATED_WITH"),
    ("78275009", "414916001", "ASSOCIATED_WITH"),
    ("44054006", "414916001", "ASSOCIATED_WITH"),
    ("396275006", "414916001", "ASSOCIATED_WITH"),
    ("235856003", "414916001", "ASSOCIATED_WITH"),
    ("237055002", "414916001", "ASSOCIATED_WITH"),
    ("53741008", "414916001", "ASSOCIATED_WITH"),
    ("370992007", "414916001", "ASSOCIATED_WITH"),
    ("235595009", "414916001", "ASSOCIATED_WITH"),
    ("372344003", "414916001", "ASSOCIATED_WITH"),
    ("90560007", "414916001", "ASSOCIATED_WITH"),
    ("35489007", "414916001", "ASSOCIATED_WITH"),
    ("195967001", "414916001", "ASSOCIATED_WITH"),
    ("11563006", "414916001", "ASSOCIATED_WITH"),
    ("111438007", "414916001", "ASSOCIATED_WITH"),
]


def fetch_snomed_concept(sctid: str):
    """Hits the Public Snowstorm API to get the official concept data."""
    url = f"https://snowstorm.snomedtools.org/snowstorm/snomed-ct/browser/MAIN/concepts/{sctid}"
    headers = {"Accept-Language": "en"}

    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()

            # Extract preferred term
            name = data.get("pt", {}).get("term", "Unknown").lower()

            # Extract semantic tag (e.g., "(disorder)" -> Disease, "(finding)" -> Symptom)
            fsn = data.get("fsn", {}).get("term", "").lower()
            node_type = "Concept"
            if "(finding)" in fsn:
                node_type = "Symptom"
            elif "(disorder)" in fsn:
                node_type = "Disease"
            elif "(situation)" in fsn or "(observable entity)" in fsn:
                node_type = "Risk Factor"

            return {"sctid": sctid, "name": name, "type": node_type}
        else:
            print(f"⚠️ API Error for {sctid}: {response.status_code}")
    except Exception as e:
        print(f"🌐 Network Error for {sctid}: {e}")
    return None


print("🌐 Booting up Snowstorm API Crawler...")

# 2. Extract all unique SCTIDs from our rules
unique_sctids = set()
for src, dst, _ in CLINICAL_RULES:
    unique_sctids.add(src)
    unique_sctids.add(dst)

# 3. Fetch official node data from the API
nodes_data = []
print(f"📦 Total unique nodes to fetch: {len(unique_sctids)}")
for i, sctid in enumerate(unique_sctids):
    print(f"[{i + 1}/{len(unique_sctids)}] Fetching metadata for SCTID {sctid}...")
    concept = fetch_snomed_concept(sctid)
    if concept:
        nodes_data.append(concept)
    time.sleep(0.5)  # Be polite to the public server

# 4. Save Nodes to CSV
pd.DataFrame(nodes_data).to_csv("obesity_nodes.csv", index=False)
print(f"✅ Generated obesity_nodes.csv ({len(nodes_data)} nodes)")

# 5. Save Edges to CSV
edges_data = [
    {"src": src, "dst": dst, "type": edge_type}
    for src, dst, edge_type in CLINICAL_RULES
]
pd.DataFrame(edges_data).to_csv("obesity_edges.csv", index=False)
print(f"✅ Generated obesity_edges.csv ({len(edges_data)} edges)")

