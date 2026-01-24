from typing import Dict, List

from app.rag.bm25 import index as BM25
from app.rag.config import MAX_CONTEXT_CHARS
from app.security.rbac import enforce_rbac
from app.rag.vectorstore import query_vector


def _normalize_max(values: List[float]) -> List[float]:
    if not values:
        return []
    max_value = max(values)
    if max_value == 0:
        return values
    return [value / max_value for value in values]


def retrieve(question: str, user_role: str) -> List[Dict]:
    BM25.load()
    bm25_results = enforce_rbac(BM25.query(question), user_role)
    vector_results = enforce_rbac(query_vector(question), user_role)

    aggregated: Dict[str, Dict] = {}

    bm25_scores = [item["bm25_score"] for item in bm25_results]
    bm25_norm = _normalize_max(bm25_scores)
    for norm_score, row in zip(bm25_norm, bm25_results):
        chunk_id = row["metadata"].get("chunk_id") or row["chunk_id"]
        aggregated.setdefault(chunk_id, {"text": row["text"], "metadata": row["metadata"], "bm25_score": 0.0, "vector_score": 0.0})
        aggregated[chunk_id]["bm25_score"] = norm_score

    vector_scores = [item["vector_score"] for item in vector_results]
    vector_norm = _normalize_max(vector_scores)
    for norm_score, row in zip(vector_norm, vector_results):
        chunk_id = row["metadata"].get("chunk_id") or row["chunk_id"]
        aggregated.setdefault(chunk_id, {"text": row["text"], "metadata": row["metadata"], "bm25_score": 0.0, "vector_score": 0.0})
        aggregated[chunk_id]["vector_score"] = norm_score

    merged = []
    for chunk_id, payload in aggregated.items():
        score = 0.55 * payload["vector_score"] + 0.45 * payload["bm25_score"]
        merged.append(
            {
                "chunk_id": chunk_id,
                "text": payload["text"],
                "metadata": payload["metadata"],
                "score": score,
            }
        )

    filtered = enforce_rbac(merged, user_role)
    sorted_chunks = sorted(filtered, key=lambda item: item["score"], reverse=True)

    contexts = []
    total_chars = 0
    for candidate in sorted_chunks:
        length = len(candidate["text"])
        if total_chars + length > MAX_CONTEXT_CHARS and contexts:
            break
        contexts.append(candidate)
        total_chars += length

    return contexts
