.PHONY: setup-db

setup-db:
	@echo "🚀 Building SQLite and KuzuDB databases from scratch..."
	PYTHONPATH=./backend uv run python3 backend/scripts/create_schema.py
	PYTHONPATH=./backend uv run python3 backend/scripts/seed_mock_data.py
	PYTHONPATH=./backend uv run python3 backend/scripts/seed_graph.py
	@echo "✅ All databases seeded and ready for development!"
