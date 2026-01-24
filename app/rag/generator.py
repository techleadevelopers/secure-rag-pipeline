from typing import List, Tuple

from app.rag.schemas import Citation


def _sentence_from_text(text: str) -> str:
    if not text:
        return ""
    segments = [segment.strip() for segment in text.split(".") if segment.strip()]
    return segments[0] if segments else text.strip()


def build_answer(question: str, contexts: List[dict]) -> Tuple[str, List[Citation], float]:
    if not contexts:
        return (
            "Não encontrei base suficiente nos documentos fornecidos. "
            "Verifique Matriz de Riscos e Playbook de Implantação.",
            [],
            0.18,
        )

    paragraphs = []
    citations: List[Citation] = []
    max_score = max(context["score"] for context in contexts)
    unique_docs = {context["metadata"].get("doc_id") for context in contexts}

    for context in contexts:
        quote = _sentence_from_text(context["text"])
        meta = context["metadata"]
        citation = Citation(
            doc_id=meta.get("doc_id", "desconhecido"),
            source=meta.get("title") or meta.get("source", "não informado"),
            loc=meta.get("loc", "—"),
            quote=quote[:500],
        )
        citations.append(citation)
        paragraphs.append(f"{quote} ({citation.doc_id} – {citation.loc})")

    body = "\n".join(paragraphs)
    confidence = min(
        1.0,
        max(0.25, max_score * 0.7 + len(unique_docs) * 0.05),
    )

    answer = (
        "Baseado nos documentos oficiais, segue o resumo:\n" f"{body}"
    )
    return answer, citations, confidence
