from pathlib import Path
from typing import List

from app.rag.bm25 import index as BM25
from app.rag.chunking import chunk_document, Chunk
from app.rag.logging import logger
from app.rag.vectorstore import store_chunks
from app.rag.loaders import discover_documents


def run_ingest() -> None:
    root = Path("data/sources")
    if not root.exists():
        logger.log(
            "warning",
            "ingest.missing_sources",
            details={"path": str(root)},
        )
        return
    docs = list(discover_documents(root))
    all_chunks: List[Chunk] = []
    for document in docs:
        chunks = chunk_document(document)
        all_chunks.extend(chunks)
    if not all_chunks:
        logger.log("warning", "ingest.no_chunks", details={"count": 0})
        return
    store_chunks(all_chunks)
    BM25.build(all_chunks)
    logger.log(
        "info",
        "ingest.complete",
        details={"chunks": len(all_chunks), "documents": len(docs)},
    )


if __name__ == "__main__":
    run_ingest()
