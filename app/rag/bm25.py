import os
import pickle
from pathlib import Path
from typing import Dict, List

from rank_bm25 import BM25Okapi

from app.rag.chunking import Chunk
from app.rag.config import BM25_INDEX_PATH, TOPK_BM25


class BM25Index:
    def __init__(self, path: Path = BM25_INDEX_PATH):
        self.path = path
        self._bm25: BM25Okapi | None = None
        self.documents: List[str] = []
        self.metadatas: List[Dict] = []
        self.ids: List[str] = []
        self._tokenized: List[List[str]] = []

    def build(self, chunks: List[Chunk]) -> None:
        texts = [chunk.text for chunk in chunks]
        tokenized = [text.split() for text in texts]
        if not tokenized:
            return
        self._bm25 = BM25Okapi(tokenized)
        self.documents = texts
        self.metadatas = [chunk.metadata for chunk in chunks]
        self.ids = [chunk.id for chunk in chunks]
        self._tokenized = tokenized
        self._persist()

    def _persist(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.path.open("wb") as handle:
            pickle.dump(
                {
                    "documents": self.documents,
                    "metadatas": self.metadatas,
                    "ids": self.ids,
                    "tokenized": self._tokenized,
                },
                handle,
            )

    def load(self) -> None:
        if not self.path.exists():
            return
        with self.path.open("rb") as handle:
            payload = pickle.load(handle)
        self.documents = payload.get("documents", [])
        self.metadatas = payload.get("metadatas", [])
        self.ids = payload.get("ids", [])
        self._tokenized = payload.get("tokenized", [])
        if self._tokenized:
            self._bm25 = BM25Okapi(self._tokenized)

    def query(self, query: str, topk: int = TOPK_BM25) -> List[Dict]:
        if not self._bm25:
            return []
        tokens = query.split()
        scores = self._bm25.get_scores(tokens)
        ranked = sorted(
            range(len(scores)),
            key=lambda idx: scores[idx],
            reverse=True,
        )[:topk]
        return [
            {
                "chunk_id": self.ids[idx],
                "text": self.documents[idx],
                "metadata": self.metadatas[idx],
                "bm25_score": scores[idx],
            }
            for idx in ranked
            if scores[idx] > 0
        ]


index = BM25Index()
