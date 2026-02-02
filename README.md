# Agente RAG Corporativo

Painel e backend para demonstração de IA governada em grandes empresas. O foco está em observabilidade, controle de acesso, defesa contra prompt injection e transparência das fontes (citando documentos oficiais).

## Arquitetura

- **Ingestão** (app/rag/ingest): carrega `pdf`, `docx` e `html`, normaliza seções, cria chunks com metadados e envia para Chroma + BM25 local.
- **Retrieval híbrido** (app/rag/retriever): RBAC filter → BM25 + embeddings → merge ponderado → contexto limitado.
- **Guardrails** (app/rag/guardrails + app/security/rbac): detecta prompt injection/exfiltration e aplica políticas.
- **Generator** (app/rag/generator): constrói resposta grounded extrativa com citações obrigatórias e calcula confiança.
- **API FastAPI** (app/api.py): expõe `/ask`, `/ingest`, `/health` com logs JSON estruturados (logs/app.jsonl) incluindo métricas de latência/custo.
- **Dashboard demo** (app/ui): interface standalone consumindo `/ask`.

> **Modo offline**: quando `chromadb` não está disponível (ex.: ambiente Python 3.7), o vector store usa um fallback em memória com embeddings determinísticos e os mesmos metadados. Basta rodar `make ingest` antes de perguntar e a solução continua fornecendo respostas fundamentadas com citeções.

## Como rodar

1. Crie um ambiente Python 3.11, ative e execute `make install`.
2. Coloque os documentos oficiais (PDFs, DOCX e HTML listados no kit) dentro de `data/sources/`.
3. Execute `make ingest` para indexar todos os chunks no BM25 e no store escolhido.
4. Rode `make serve` e acesse `http://localhost:8000/ui` para usar o painel técnico.
5. Execute `make eval` para avaliar as 10 perguntas; o script gera `eval/results.jsonl` e `eval/report.md`.

## Segurança

- **RBAC/ABAC**: cada chunk traz `rbac_tags` (público/interno/restrito) e apenas roles autorizadas recebem contextos sensíveis.
- **Guardrails**: injecções e pedidos de dados sensíveis são detectados por padrões (ignore previous, system prompt, developer message etc.) e a resposta é reduzida a uma nota segura de auditoria.
- **Logs estruturados**: `logs/app.jsonl` mantém eventos com `correlation_id`, `latency_ms`, `tokens_est`, `cost_est`, `topk`, `docs_used`. Retenção padrão é 30 dias com exceção de 90 dias para auditors em backlog.
- **Modo DEBUG**: para diagnóstico, defina `DEBUG_LOG_CONTENT=true` (uma flag declarada em `app/rag/config.py`) e os logs incorporam payloads e respostas completas com aviso claro.

## Tradeoffs

- **Embeddings offline**: o pipeline usa embeddings determinísticos hash-based (384 dimensões) por padrão, garantindo reprodução total sem downloads; instale `sentence-transformers==2.2.2` via `pip install sentence-transformers` caso queira embeddings neurais.
- **Busca híbrida**: BM25 garante cobrir termos-chave e vetores filtram similaridades semânticas. O merge ponderado mantém latência baixa e é compatível com RBAC.
- **Citações obrigatórias**: cada resposta inclui citações com `doc_id`, `source` e `loc`; se não houver contexto suficiente, o agente indica os arquivos relevantes.

## Próximos passos

1. Integrar reranker supervisionado e cache de respostas autorizadas.
2. Adicionar SSO corporativo e trilhas de auditoria no UI (logs + eventos).
3. Expandir guardrails com análise semântica de dados sensíveis e DLP.

## Estrutura de pastas

- `app/rag/`: pipeline RAG completo.
- `app/security/`: regras RBAC/ABAC reutilizáveis.
- `eval/`: script de avaliação com metrics/report.
- `logs/`: gravações JSONL.
- `tests/`: testes unitários críticos.

## Documentos obrigatórios

Copie os seis arquivos do kit (`PDF1_...`, `PDF2_...`, `Doc1_...`, `Doc2_...`, `HTML1_...`, `HTML2_...`) para `data/sources/`. O ingest normaliza PDF/DOCX/HTML com metadados completos (ver `app/rag/loaders.py`). Sem esses documentos, não haverá base para as respostas.

Se desejar executar o modo opcional com o vector store persistente, instale os extras `pip install chromadb==0.3.22[duckdb]` e a dependência neural `sentence-transformers==2.2.2`; caso contrário, o fallback em memória continua operacional.
