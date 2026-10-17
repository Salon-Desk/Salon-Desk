"""Backward-compatible entrypoint; prefer ``python -m scripts.seed`` from backend/."""

from scripts.seed import main

if __name__ == "__main__":
    main()
