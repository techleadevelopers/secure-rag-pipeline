from __future__ import annotations

from typing import Dict, Iterable, List

from app.rag.chunking import Chunk
from app.rag.config import CHROMA_DIR, TOPK_VECTOR
from app.rag.embeddings import EmbeddingProvider

try:
    import chromadb
    from chromadb.config import Settings

    CHROMADB_AVAILABLE = True
except ImportError:
    chromadb = None  # type: ignore
    Settings = None  # type: ignore
    CHROMADB_AVAILABLE = False


_EMBEDDING = EmbeddingProvider()


if CHROMADB_AVAILABLE:
    def _get_collection():
        client = chromadb.PersistentClient(
            Settings(chroma_db_impl="duckdb+parquet", persist_directory=str(CHROMA_DIR))
        )
        return client.get_or_create_collection("rag_chunks")


    def store_chunks(chunks: Iterable[Chunk]) -> None:
        collection = _get_collection()
        chunk_list = list(chunks)
        collection.delete(where={})
        collection.add(
            ids=[chunk.id for chunk in chunk_list],
            documents=[chunk.text for chunk in chunk_list],
            metadatas=[chunk.metadata for chunk in chunk_list],
            embeddings=_EMBEDDING.embed_texts(chunk.text for chunk in chunk_list),
        )


    def query_vector(text: str, topk: int = TOPK_VECTOR) -> List[Dict]:
        collection = _get_collection()
        embedding = _EMBEDDING.embed_texts([text])[0]
        results = collection.query(
            query_embeddings=[embedding],
            n_results=topk,
            include=["documents", "metadatas", "distances", "ids"],
        )
        output: List[Dict] = []
        ids = results.get("ids") or []
        if ids:
            docs = results.get("documents", [[]])[0]
            dists = results.get("distances", [[]])[0]
            metas = results.get("metadatas", [[]])[0]
            for doc, meta, score in zip(docs, metas, dists):
                output.append(
                    {
                        "id": meta.get("doc_id", ""),
                        "chunk_id": meta.get("chunk_id", ""),
                        "text": doc,
                        "metadata": meta,
                        "vector_score": 1 / (1 + score),
                    }
                )
        return output


else:
    _IN_MEMORY_STORE: List[Dict] = []


    def _dot(a: List[float], b: List[float]) -> float:
        return sum(x * y for x, y in zip(a, b))


    def store_chunks(chunks: Iterable[Chunk]) -> None:
        global _IN_MEMORY_STORE
        entries = []
        for chunk in chunks:
            embedding = _EMBEDDING.embed_texts([chunk.text])[0]
            entries.append(
                {
                    "chunk_id": chunk.id,
                    "text": chunk.text,
                    "metadata": chunk.metadata,
                    "embedding": embedding,
                }
            )
        _IN_MEMORY_STORE = entries


    def query_vector(text: str, topk: int = TOPK_VECTOR) -> List[Dict]:
        if not _IN_MEMORY_STORE:
            return []
        embedding = _EMBEDDING.embed_texts([text])[0]
        scored = []
        for item in _IN_MEMORY_STORE:
            score = _dot(embedding, item["embedding"])
            scored.append({**item, "vector_score": max(0.0, score)})

        ranked = sorted(scored, key=lambda item: item["vector_score"], reverse=True)
        return ranked[:topk]
