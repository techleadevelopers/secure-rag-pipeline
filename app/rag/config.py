import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT.parent / "data"
LOG_DIR = ROOT.parent / "logs"

CHROMA_DIR = Path(os.getenv("CHROMA_DIR", DATA_DIR / "index" / "chroma"))
BM25_INDEX_PATH = DATA_DIR / "index" / "bm25.pkl"
VECTOR_INDEX_PATH = DATA_DIR / "index" / "vector.pkl"

TOPK_VECTOR = int(os.getenv("TOPK_VECTOR", "8"))
TOPK_BM25 = int(os.getenv("TOPK_BM25", "12"))
MAX_CONTEXT_CHARS = int(os.getenv("MAX_CONTEXT_CHARS", "9000"))
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1000"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "120"))
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
DEBUG_LOG_CONTENT = os.getenv("DEBUG_LOG_CONTENT", "false").lower() in ("1", "true", "yes")

SEED = int(os.getenv("RAG_SEED", "42"))
