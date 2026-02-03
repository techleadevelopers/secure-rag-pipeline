# Agente RAG Corporativo

Painel e backend para demonstração de IA governada em grandes empresas. O foco está em observabilidade, controle de acesso, defesa contra prompt injection e transparência das fontes (citando documentos oficiais).
<img src="https://res.cloudinary.com/limpeja/image/upload/v1770092770/3d9fb421-9630-47e7-9f6b-3267ae8bc965.png" alt="LimpeJá-App Logo" width="1024">
## Arquitetura

%%{init: {
  'theme': 'dark',
  'themeVariables': {
    'primaryColor': '#005f73',
    'edgeLabelBackground':'#0a192f',
    'tertiaryColor': '#0a9396',
    'fontSize': '14px'
  }
}}%%

flowchart LR

%% Espaço reservado para LOGO
subgraph BRANDING [" "]
    Logo["🛡️ LOGO<br/>Secure RAG Pipeline"]
end
style BRANDING fill:transparent,stroke:transparent
style Logo fill:transparent,stroke:transparent,color:#94d2bd

%% Security Layer (faixa superior)
subgraph Security ["Security & Guardrails"]
    direction TB
    SG["Prompt Injection & Exfiltration<br/>(app/rag/guardrails)"]
    Auth["RBAC / ABAC<br/>(app/security)"]
end
style Security stroke-dasharray: 6 4

%% UI
subgraph UI ["UI – app/ui (Vite / React)"]
    Chat["Chat (/ask)"]
    Cits["Citations Display"]
    Conf["Trust Indicators"]
end

%% API
subgraph API ["API – FastAPI"]
    Routes["/ask | /ingest | /health"]
    Logs["JSON Logs<br/>latency • tokens • cost"]
end

%% Ingest
subgraph Ingest ["Ingestão"]
    Loaders["PDF / DOCX / HTML"]
    Norm["Normalize + Chunk<br/>(rbac_tags)"]
    Index["BM25 + Chroma<br/>(Embeddings)"]
end

%% Retrieval
subgraph Retrieval ["Retrieval Híbrido"]
    Filt["RBAC / ABAC Filter"]
    Search["BM25 + Vector Merge"]
    Context["Context Cut"]
end

%% Generation
subgraph Generation ["Generation"]
    Gen["Grounded Answer"]
    Citations["Mandatory Citations"]
    Score["Trust & Safety Notes"]
end

%% Observability
subgraph Obs ["Observability & O]()


- **Ingestão** (app/rag/ingest): carrega `pdf`, `docx` e `html`, normaliza seções, cria chunks com metadados e envia para Chroma + BM25 local.
- **Retrieval híbrido** (app/rag/retriever): RBAC filter → BM25 + embeddings → merge ponderado → contexto limitado.
- **Guardrails** (app/rag/guardrails + app/security/rbac): detecta prompt injection/exfiltration e aplica políticas.
- **Generator** (app/rag/generator): constrói resposta grounded extrativa com citações obrigatórias e calcula confiança.
- **API FastAPI** (app/api.py): expõe `/ask`, `/ingest`, `/health` com logs JSON estruturados (logs/app.jsonl) incluindo métricas de latência/custo.
- **Dashboard demo** (app/ui): interface standalone consumindo `/ask`.

> **Modo offline**: quando `chromadb` não está disponível (ex.: ambiente Python 3.7), o vector store usa um fallback em memória com embeddings determinísticos e os mesmos metadados. Basta rodar `make ingest` antes de perguntar e a solução continua fornecendo respostas fundamentadas com citeções.

## Como rodar

1. Crie um ambiente Python **3.11**, ative e execute `make install`.
2. Coloque os documentos oficiais (PDFs, DOCX e HTML listados no kit) dentro de `data/sources/`.
3. Defina a API Key obrigatória: `set API_KEY=sua-chave` (Windows) ou `export API_KEY=...`.
4. Opcional: restrinja origens com `ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000`.
5. Execute `make ingest` para indexar todos os chunks no BM25 e no store escolhido.
6. Rode `make serve` e acesse `http://localhost:8000/ui` (o front pedirá a API Key na primeira pergunta).
7. Execute `make eval` para avaliar as 10 perguntas; o script gera `eval/results.jsonl` e `eval/report.md`.

## Segurança

- **RBAC/ABAC**: cada chunk traz `rbac_tags` (público/interno/restrito) e apenas roles autorizadas recebem contextos sensíveis.
- **Guardrails**: injec??es e pedidos de dados sens?veis s?o detectados por padr?es expandidos em PT/EN e bloqueados antes do retrieval; se disparar, a resposta ? reduzida a nota segura de auditoria.
- **Logs estruturados**: `logs/app.jsonl` mantém eventos com `correlation_id`, `latency_ms`, `tokens_est`, `cost_est`, `topk`, `docs_used`. Retenção padrão é 30 dias com exceção de 90 dias para auditors em backlog.
- **Modo DEBUG**: para diagnóstico, defina `DEBUG_LOG_CONTENT=true` (uma flag declarada em `app/rag/config.py`) e os logs incorporam payloads e respostas completas com aviso claro.


## CI

- Workflow GitHub Actions (`.github/workflows/ci.yml`) roda `make test` em Python 3.11 a cada push/PR.

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
