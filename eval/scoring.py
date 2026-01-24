import json
from pathlib import Path
from typing import Dict, List


def load_answer_key(path: Path) -> Dict[int, Dict[str, List[str]]]:
    if not path.exists():
        return {}
    payload = json.loads(path.read_text(encoding="utf-8"))
    return {item["id"]: item for item in payload}


def compute_keyword_overlap(answer: str, keywords: List[str]) -> float:
    if not keywords:
        return 0.0
    lowered = answer.lower()
    hits = sum(1 for kw in keywords if kw.lower() in lowered)
    return hits / len(keywords)


def score_response(answer: str, citations: List[Dict], keywords: List[str]) -> Dict[str, float]:
    citations_present = 1.0 if citations else 0.0
    doc_coverage = len({item.get("doc_id") for item in citations}) if citations else 0
    overlap = compute_keyword_overlap(answer, keywords)
    score = round(0.5 * citations_present + 0.3 * overlap + 0.2 * min(doc_coverage, 3) / 3, 2)
    return {
        "score": score,
        "citations_present": citations_present,
        "doc_coverage": doc_coverage,
        "keyword_overlap": round(overlap, 2),
    }
