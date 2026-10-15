"""Backward-compatible entrypoint; prefer ``python -m scripts.ingest_knowledge``."""

from scripts.ingest_knowledge import main

if __name__ == "__main__":
    main()
