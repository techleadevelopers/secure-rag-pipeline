import time
import uuid
from typing import List

import os
from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.rag.config import DEBUG_LOG_CONTENT
from app.rag.guardrails import apply_guardrails
from app.rag.generator import build_answer
from app.rag.ingest import run_ingest
from app.rag.logging import logger
from app.rag.retriever import retrieve
from app.rag.schemas import AskPayload, AskResponse, Metrics

API_KEY = os.getenv("API_KEY")
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:8000,http://127.0.0.1:8000").split(",")
    if origin.strip()
]

app = FastAPI(title="Atlantyx – Agente RAG Corporativo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/ui", StaticFiles(directory="app/ui", html=True), name="ui")


def _current_millis() -> int:
    return int(time.time() * 1000)


def _to_metrics(latency_ms: int, docs_used: int, topk: int, answer: str) -> Metrics:
    tokens_est = max(10, len(answer) // 4)
    cost_est = round(tokens_est * 0.000001, 6)
    return Metrics(
        latency_ms=latency_ms,
        tokens_est=tokens_est,
        cost_est=cost_est,
        topk=topk,
        docs_used=docs_used,
    )


def require_api_key(x_api_key: str = Header(default=None)) -> None:
    if not API_KEY:
        raise HTTPException(status_code=503, detail="API_KEY não configurada no servidor")
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="API key inválida")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "mode": "debug" if DEBUG_LOG_CONTENT else "prod"}


@app.post("/ingest", dependencies=[Depends(require_api_key)])
def ingest() -> dict:
    run_ingest()
    return {"status": "ok", "message": "ingest complete"}


@app.post("/ask", response_model=AskResponse, dependencies=[Depends(require_api_key)])
def ask(payload: AskPayload) -> AskResponse:
    correlation_id = payload.conversation_id or str(uuid.uuid4())
    start = _current_millis()

    guard_notes, allow_context = apply_guardrails(payload.question, [])
    if allow_context:
        contexts = retrieve(payload.question, payload.user_role)
        guard_notes, allow_context = apply_guardrails(payload.question, contexts)
    else:
        contexts = []

    answer, citations, confidence = build_answer(payload.question, contexts)
    topk = len(contexts)
    docs_used = len({item.doc_id for item in citations})
    latency_ms = _current_millis() - start
    metrics = _to_metrics(latency_ms, docs_used, topk, answer)

    notes = guard_notes or []

    response = AskResponse(
        answer=answer,
        citations=citations,
        confidence=round(confidence, 2),
        notes=notes,
        metrics=metrics,
    )

    details = {
        "question": payload.question if DEBUG_LOG_CONTENT else None,
        "user_role": payload.user_role,
        "latency_ms": latency_ms,
        "topk": topk,
        "docs_used": docs_used,
        "tokens_est": metrics.tokens_est,
        "cost_est": metrics.cost_est,
    }
    logger.log(
        "info",
        "ask.complete",
        correlation_id=correlation_id,
        details={k: v for k, v in details.items() if v is not None},
    )

    return response
