from app.rag.chunking import chunk_document
from app.rag.loaders import LoadedDocument, Section


def _make_document():
    return LoadedDocument(
        doc_id="DOC1",
        source_path="data/sources/DOC1.docx",
        title="Doc One",
        version="1",
        sections=[
            Section(heading="Secão 1", text="A" * 500, loc="1"),
            Section(heading="Secão 2", text="B" * 500, loc="2"),
        ],
    )


def test_chunk_metadata():
    chunks = chunk_document(_make_document())
    assert all(chunk.metadata["doc_id"] == "DOC1" for chunk in chunks)
    assert all("rbac_tags" in chunk.metadata for chunk in chunks)


def test_chunk_id_stable():
    doc = _make_document()
    chunks_a = chunk_document(doc)
    chunks_b = chunk_document(doc)
    assert chunks_a[0].id == chunks_b[0].id
