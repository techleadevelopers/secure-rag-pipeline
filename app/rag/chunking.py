import hashlib
from dataclasses import dataclass
from typing import List, Iterable

from app.rag.config import CHUNK_OVERLAP, CHUNK_SIZE
from app.rag.loaders import LoadedDocument, Section


RESTRICTED_DOCS = {
    "PDF2_Matriz_Riscos_Controles_IA",
}


@dataclass
class Chunk:
    id: str
    text: str
    metadata: dict


def _chunk_text(text: str) -> Iterable[str]:
    cleaned = " ".join(text.split())
    start = 0
    length = CHUNK_SIZE
    while start < len(cleaned):
        end = min(len(cleaned), start + length)
        yield cleaned[start:end], start, end
        start += length - CHUNK_OVERLAP


def _compute_chunk_id(doc_id: str, loc: str, idx: int) -> str:
    digest = hashlib.sha1(f"{doc_id}-{loc}-{idx}".encode("utf-8")).hexdigest()
    return digest


def chunk_document(document: LoadedDocument) -> List[Chunk]:
    chunks: List[Chunk] = []
    doc_tags = ["publico"]
    classification = "internal"
    if document.doc_id in RESTRICTED_DOCS:
        doc_tags = ["restrito"]
        classification = "restricted"

    for section in document.sections:
        text_fragments = list(_chunk_text(section.text))
        for idx, (chunk_text, start, end) in enumerate(text_fragments):
            chunk_id = _compute_chunk_id(document.doc_id, section.loc, idx)
            metadata = {
                "doc_id": document.doc_id,
                "source": document.source_path,
                "title": document.title,
                "section_heading": section.heading,
                "loc": section.loc,
                "chunk_span": [start, end],
                "version": document.version,
                "classification": classification,
                "rbac_tags": doc_tags,
                "chunk_id": chunk_id,
            }
            chunks.append(Chunk(id=chunk_id, text=chunk_text, metadata=metadata))
    return chunks
