import kuzu
import shutil
import os
import csv
import sys
from pathlib import Path

# --- Path Configurations ---
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent if SCRIPT_DIR.name == "scripts" else SCRIPT_DIR
ROOT_DIR = BACKEND_DIR.parent if BACKEND_DIR.name == "backend" else BACKEND_DIR

DB_PATH = str(BACKEND_DIR / "precerto_graph_db")
NODES_CSV = str(ROOT_DIR / "data" / "obesity_nodes.csv")
EDGES_CSV = str(ROOT_DIR / "data" / "obesity_edges.csv")

# Temporary cleaned files for KuzuDB to safely ingest
CLEANED_NODES = str(ROOT_DIR / "data" / "obesity_nodes_cleaned.csv")
CLEANED_EDGES = str(ROOT_DIR / "data" / "obesity_edges_cleaned.csv")


def sanitize_clinical_data():
    """Strips duplicate nodes and orphan edges to prevent KuzuDB crashes."""
    print("🧼 Sanitizing raw CSV data...")
    valid_sctids = set()
    node_dupes = 0
    orphan_edges = 0

    # 1. Clean Nodes (Remove Duplicates)
    with (
        open(NODES_CSV, "r", encoding="utf-8") as f_in,
        open(CLEANED_NODES, "w", encoding="utf-8", newline="") as f_out,
    ):
        reader = csv.DictReader(f_in)
        writer = csv.DictWriter(f_out, fieldnames=reader.fieldnames)
        writer.writeheader()

        for row in reader:
            # Check for 'sctid' or fallback to the first column if named differently
            sctid = row.get("sctid") or list(row.values())[0]
            if sctid not in valid_sctids:
                valid_sctids.add(sctid)
                writer.writerow(row)
            else:
                node_dupes += 1

    # 2. Clean Edges (Remove edges pointing to non-existent nodes)
    with (
        open(EDGES_CSV, "r", encoding="utf-8") as f_in,
        open(CLEANED_EDGES, "w", encoding="utf-8", newline="") as f_out,
    ):
        reader = csv.DictReader(f_in)
        writer = csv.DictWriter(f_out, fieldnames=reader.fieldnames)
        writer.writeheader()

        for row in reader:
            # Support both 'src/dst' and 'FROM/TO' column headers
            src = row.get("src") or row.get("FROM")
            dst = row.get("dst") or row.get("TO")

            if src in valid_sctids and dst in valid_sctids:
                writer.writerow(row)
            else:
                orphan_edges += 1

    print(
        f"✨ Data Sanitized! Removed {node_dupes} duplicate nodes and {orphan_edges} orphan edges."
    )


def seed_graph():
    # 1. Sanitize the data first
    try:
        sanitize_clinical_data()
    except Exception as e:
        print(f"❌ Failed to sanitize data. Are the paths correct?\nError: {e}")
        sys.exit(1)

    # 2. Clean the old database
    print("🧹 Cleaning old graph database...")
    if os.path.exists(DB_PATH):
        if os.path.isdir(DB_PATH):
            shutil.rmtree(DB_PATH)
        else:
            os.remove(DB_PATH)

    # 3. Build Schema
    print("🏗️ Initializing KuzuDB...")
    db = kuzu.Database(DB_PATH)
    conn = kuzu.Connection(db)

    print("📝 Creating Schema...")
    conn.execute(
        "CREATE NODE TABLE Concept(sctid INT64, name STRING, type STRING, PRIMARY KEY (sctid))"
    )
    conn.execute(
        "CREATE REL TABLE SNOMED_REL(FROM Concept TO Concept, type STRING, weight DOUBLE)"
    )

    # 4. Ingest Cleaned Data
    try:
        print("🧬 Ingesting Medical Entities from CSV...")
        conn.execute(f'COPY Concept FROM "{CLEANED_NODES}" (HEADER=True)')

        print("🕸️ Ingesting Clinical Relationships from CSV...")
        conn.execute(f'COPY SNOMED_REL FROM "{CLEANED_EDGES}" (HEADER=True)')
    except Exception as e:
        print(f"\n❌ FATAL ERROR LOADING GRAPH DATA:\n{e}")
        # FAIL LOUDLY: This tells the Makefile to stop execution
        sys.exit(1)
    finally:
        # Cleanup temporary files
        if os.path.exists(CLEANED_NODES):
            os.remove(CLEANED_NODES)
        if os.path.exists(CLEANED_EDGES):
            os.remove(CLEANED_EDGES)

    # 5. Verify and Report
    results = conn.execute("MATCH (c:Concept) RETURN COUNT(c)")
    node_count = results.get_next()[0]

    results = conn.execute("MATCH ()-[r:SNOMED_REL]->() RETURN COUNT(r)")
    edge_count = results.get_next()[0]

    print(f"🚀 Obesity Knowledge Graph Successfully Indexed!")
    print(f"📊 Final Graph Size: {node_count} concepts, {edge_count} relationships.")


if __name__ == "__main__":
    seed_graph()
