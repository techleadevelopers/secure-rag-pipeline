const form = document.getElementById("agent-form");
const questionInput = document.getElementById("question");
const userRoleInput = document.getElementById("user-role");
const statusMessage = document.getElementById("status-message");
const resultArea = document.getElementById("result-area");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  askAgent();
});

setInitialState();

async function askAgent() {
  const question = questionInput.value.trim();
  if (!question) {
    statusMessage.textContent = "Escreva uma pergunta antes de enviar.";
    return;
  }

  const payload = {
    question,
    user_role: userRoleInput.value,
    conversation_id: generateConversationId(),
  };

  setLoadingState();

  try {
    const response = await fetch("/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Não foi possível consultar o agente.");
    }

    const data = await response.json();
    renderResponse(data);
    statusMessage.classList.remove("error");
    statusMessage.textContent = "Resposta recebida.";
  } catch (error) {
    renderError(error.message);
  } finally {
    form.querySelector("button").disabled = false;
  }
}

function renderResponse(data) {
  const { answer, confidence, citations, metrics, notes } = data || {};
  clearResults();
  resultArea.appendChild(renderAnswer(answer, confidence, notes));
  resultArea.appendChild(renderCitations(citations));
  resultArea.appendChild(renderMetrics(metrics));
  resultArea.appendChild(renderNotes(notes));
}

function renderAnswer(answer, confidence, notes = []) {
  const card = createCard("Resposta");
  const paragraph = document.createElement("p");
  paragraph.textContent = answer || "O agente não retornou uma resposta.";
  card.appendChild(paragraph);

  const badgeList = document.createElement("div");
  badgeList.className = "badge-list";

  if (typeof confidence === "number" && confidence < 0.4) {
    badgeList.appendChild(createBadge("Resposta com baixa confiança"));
  }

  if (
    Array.isArray(notes) &&
    notes.some((note) =>
      note.toLowerCase().includes("prompt injection")
    )
  ) {
    badgeList.appendChild(
      createBadge("⚠ Segurança", "warning")
    );
  }

  if (badgeList.childElementCount > 0) {
    card.appendChild(badgeList);
  }

  return card;
}

function renderCitations(citations = []) {
  const card = createCard("Citações");

  if (!citations.length) {
    const text = document.createElement("p");
    text.textContent = "Sem citações geradas para esta resposta.";
    card.appendChild(text);
    return card;
  }

  citations.forEach((item) => {
    const container = document.createElement("div");
    container.className = "citation";
    container.innerHTML = `
      <p><strong>Fonte:</strong> ${item.source || "não informado"}</p>
      <p><strong>Doc ID:</strong> ${item.doc_id || "—"}</p>
      <p><strong>Local:</strong> ${item.loc || "—"}</p>
      <p class="quote">“${item.quote || "sem trecho disponibilizado" }”</p>
    `;
    card.appendChild(container);
  });

  return card;
}

function renderMetrics(metrics = {}) {
  const card = createCard("Métricas de execução");
  const grid = document.createElement("div");
  grid.className = "metrics-grid";

  const metricPairs = [
    ["Latência", `${metrics.latency_ms ?? "—"} ms`],
    ["Tokens estimados", metrics.tokens_est ?? "—"],
    ["Custo estimado", metrics.cost_est ?? "—"],
    ["Top K", metrics.topk ?? "—"],
    ["Documentos usados", metrics.docs_used ?? "—"],
  ];

  metricPairs.forEach(([label, value]) => {
    const metric = document.createElement("div");
    metric.className = "metric";
    metric.innerHTML = `<strong>${label}:</strong><br />${value}`;
    grid.appendChild(metric);
  });

  card.appendChild(grid);
  return card;
}

function renderNotes(notes = []) {
  const card = createCard("Notas de segurança e auditoria");

  if (!notes.length) {
    const text = document.createElement("p");
    text.textContent = "Nenhuma nota registrada.";
    card.appendChild(text);
    return card;
  }

  const list = document.createElement("ul");
  notes.forEach((note) => {
    const item = document.createElement("li");
    item.textContent = note;
    list.appendChild(item);
  });

  card.appendChild(list);
  return card;
}

function renderError(message = "Erro ao executar a operação") {
  clearResults();
  statusMessage.textContent = message;
  statusMessage.classList.add("error");
}

function createCard(title) {
  const card = document.createElement("article");
  card.className = "card";
  const heading = document.createElement("h2");
  heading.textContent = title;
  card.appendChild(heading);
  return card;
}

function createBadge(label, variant = "") {
  const badge = document.createElement("span");
  badge.className = `badge ${variant}`.trim();
  badge.textContent = label;
  return badge;
}

function clearResults() {
  resultArea.innerHTML = "";
}

function setLoadingState() {
  statusMessage.classList.remove("error");
  statusMessage.textContent = "Consultando agente...";
  form.querySelector("button").disabled = true;
}

function setInitialState() {
  statusMessage.textContent = "Pronto para perguntas.";
  clearResults();
  const placeholder = document.createElement("p");
  placeholder.className = "muted";
  placeholder.textContent =
    "Use o formulário acima para enviar uma pergunta e abrir o log de resposta.";
  resultArea.appendChild(placeholder);
}

function generateConversationId() {
  return `${uuidv4()}-${Math.floor(Math.random() * 1e6)}`;
}

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }
  );
}
