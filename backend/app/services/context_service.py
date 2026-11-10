# manage c ontext via sqlite3
import sqlite3


class ContextService:
    """Service for managing conversation context"""

    def __init__(self, db_path="session_state.db"):
        self.db_path = db_path
        with sqlite3.connect(self.db_path, timeout=10.0) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS consultation_context (
                    consultation_id TEXT,
                    subject TEXT,
                    data JSON
                )
            """)

    def add_to_context(self, consultation_id: str, subject: str, data: dict):
        # persist extracted subject context to local disk
        import json

        with sqlite3.connect(self.db_path, timeout=10.0) as conn:
            conn.execute(
                "INSERT INTO consultation_context VALUES (?, ?, ?)",
                (consultation_id, subject, json.dumps(data)),
            )

    def get_context(self, consultation_id: str):
        # get current context for a consultation from sqlite
        import json

        with sqlite3.connect(self.db_path, timeout=10.0) as conn:
            cursor = conn.execute(
                "SELECT subject, data FROM consultation_context WHERE consultation_id = ?",
                (consultation_id,),
            )
            # Rebuild the context list from the database rows
            return [
                {"subject": row[0], "data": json.loads(row[1])}
                for row in cursor.fetchall()
            ]

    def clear_context(self, consultation_id: str):
        # clear content from sqlite when consultaiton ends
        with sqlite3.connect(self.db_path, timeout=10.0) as conn:
            conn.execute(
                "DELETE FROM consultation_context WHERE consultation_id = ?",
                (consultation_id,),
            )
