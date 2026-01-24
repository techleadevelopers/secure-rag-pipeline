from typing import Dict, List

from pydantic import BaseModel, Field


class AskPayload(BaseModel):
    question: str = Field(..., min_length=10)
    user_role: str
    conversation_id: str


class Citation(BaseModel):
    doc_id: str
    source: str
    loc: str
    quote: str


class Metrics(BaseModel):
    latency_ms: int
    tokens_est: int
    cost_est: float
    topk: int
    docs_used: int
    additional: Dict[str, str] = Field(default_factory=dict)


class AskResponse(BaseModel):
    answer: str
    citations: List[Citation]
    confidence: float
    notes: List[str] = []
    metrics: Metrics
