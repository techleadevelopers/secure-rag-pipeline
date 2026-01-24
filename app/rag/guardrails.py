from typing import Iterable, List, Tuple

INJECTION_PATTERNS = [
    "ignore previous",
    "system prompt",
    "developer message",
    "reveal",
    "secret",
    "chave",
    "senha",
]

EXFIL_PATTERNS = [
    "credenciais",
    "senha",
    "apikey",
    "chave",
    "token",
    "segredo",
]


def detect_prompt_injection(question: str) -> bool:
    payload = question.lower()
    return any(pattern in payload for pattern in INJECTION_PATTERNS)


def detect_exfiltration(question: str) -> bool:
    payload = question.lower()
    return any(pattern in payload for pattern in EXFIL_PATTERNS)


def apply_guardrails(question: str, contexts: Iterable[dict]) -> Tuple[List[str], bool]:
    notes = []
    allow_context = True
    if detect_prompt_injection(question):
        notes.append("Possível prompt injection detectada.")
        allow_context = False
    if detect_exfiltration(question):
        notes.append("Solicitação de dados sensíveis bloqueada.")
        allow_context = False
    return notes, allow_context
