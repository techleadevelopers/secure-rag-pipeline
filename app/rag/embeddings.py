import hashlib
import math
from typing import Iterable, List, Optional

try:
    from sentence_transformers import SentenceTransformer
except ImportError:  # pragma: no cover
    SentenceTransformer = None  # type: ignore

_MODEL: Optional[SentenceTransformer] = None
if SentenceTransformer:
    try:
        _MODEL = SentenceTransformer("all-MiniLM-L6-v2")
    except Exception:
        _MODEL = None


class EmbeddingProvider:
    def __init__(self) -> None:
        self.model = _MODEL

    def embed_texts(self, texts: Iterable[str]) -> List[List[float]]:
        batch = list(texts)
        if self.model:
            embeddings = self.model.encode(batch, convert_to_numpy=True)
            return [list(vector) for vector in embeddings]
        return [self._hash_embedding(text) for text in batch]

    def _hash_embedding(self, text: str, dim: int = 384) -> List[float]:
        seed = int(hashlib.sha1(text.encode("utf-8")).hexdigest(), 16)
        values = []
        for idx in range(dim):
            angle = (seed + idx * 31) % (2 * math.pi)
            values.append(math.sin(angle) * 0.5 + math.cos(angle) * 0.5)
        norm = math.sqrt(sum(val * val for val in values))
        if norm <= 0:
            return values
        return [val / norm for val in values]
