import csv
import json
import uuid
from pathlib import Path

from app.api import ask
from app.rag.schemas import AskPayload
from eval.scoring import load_answer_key, score_response

RESULTS_PATH = Path("eval/results.jsonl")
REPORT_PATH = Path("eval/report.md")
TEMPLATE_PATH = Path("eval/report_template.md")
QUESTIONS_PATH = Path("data/questions.csv")
ANSWER_KEY_PATH = Path("data/answer_key.json")


def run() -> None:
    key = load_answer_key(ANSWER_KEY_PATH)
    results = []
    rows = list(csv.DictReader(QUESTIONS_PATH.read_text(encoding="utf-8").splitlines()))
    for row in rows:
        question_id = int(row["id"])
        question = row["question"]
        payload = AskPayload(
            question=question,
            user_role="interno",
            conversation_id=str(uuid.uuid4()),
        )
        response = ask(payload)
        scoring = score_response(
            response.answer,
            [citation.dict() for citation in response.citations],
            key.get(question_id, {}).get("keywords", []),
        )
        result = {
            "id": question_id,
            "question": question,
            "answer": response.answer,
            "citations": [citation.dict() for citation in response.citations],
            "metrics": response.metrics.dict(),
            "notes": response.notes,
            "scoring": scoring,
        }
        results.append(result)

    RESULTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with RESULTS_PATH.open("w", encoding="utf-8") as handle:
        for item in results:
            handle.write(json.dumps(item, ensure_ascii=False) + "\n")

    generate_report(results)


def generate_report(results: list) -> None:
    table_rows = []
    fails = []
    for item in results:
        metrics = item["metrics"]
        score = item["scoring"]["score"]
        docs = item["scoring"]["doc_coverage"]
        table_rows.append(
            f"| {item['id']} | {score:.2f} | {metrics['latency_ms']} | "
            f"{metrics['tokens_est']} | {metrics['cost_est']} | {docs} |"
        )
        if score < 0.6 or not item["citations"]:
            fails.append(f"- Q{item['id']}: score {score:.2f}, citações {len(item['citations'])}")

    table = "\n".join(
        ["| Q | Score | Latency ms | Tokens | Cost | Docs citados |", "|---|---|---|---|---|---|"]
        + table_rows
    )

    actions = [
        "- Executar reingest após atualização de documentos críticos.",
        "- Rever políticas RBAC para garantir cobertura restrita.",
        "- Integrar LLM externo para melhorar fluidez sem perder citações.",
    ]

    template = TEMPLATE_PATH.read_text(encoding="utf-8")
    content = template.replace("{{table}}", table).replace(
        "{{fails}}", "\n".join(fails) if fails else "- Nenhuma falha crítica detectada."
    ).replace("{{actions}}", "\n".join(actions))

    REPORT_PATH.write_text(content, encoding="utf-8")


if __name__ == "__main__":
    run()
