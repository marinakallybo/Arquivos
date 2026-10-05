/* =====================================================================
   CINELISTA — POO + CRUD + filtros + tema + localStorage
   Mesmo padrão dos outros projetos: Repositório (dados) -> render -> eventos
   ===================================================================== */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const GENEROS = ["Ação", "Drama", "Comédia", "Ficção", "Animação"];

/* ---------- CLASSE Filme: atributos privados + setters que validam ---------- */
class Filme {
  #id; #titulo; #genero; #ano; #duracao; #nota; #assistido;

  constructor({ id, titulo, genero, ano, duracao, nota, assistido = false }) {
    this.#id = id;
    this.titulo = titulo; this.genero = genero; this.ano = ano; this.duracao = duracao; this.nota = nota;
    this.#assistido = Boolean(assistido);
  }
  get id() { return this.#id; }
  get titulo() { return this.#titulo; }
  set titulo(v) {
    if (!v || !String(v).trim()) throw new Error("O título é obrigatório.");
    this.#titulo = String(v).trim();
  }
  get genero() { return this.#genero; }
  set genero(v) {
    if (!GENEROS.includes(v)) throw new Error("Gênero inválido.");
    this.#genero = v;
  }
  get ano() { return this.#ano; }
  set ano(v) {
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1900 || n > 2100) throw new Error("Ano deve ser um número entre 1900 e 2100.");
    this.#ano = n;
  }
  get duracao() { return this.#duracao; }
  set duracao(v) {
    const n = Number(v);
    if (!Number.isInteger(n) || n <= 0) throw new Error("A duração deve ser um número inteiro de minutos.");
    this.#duracao = n;
  }
  get nota() { return this.#nota; }
  set nota(v) {
    const n = Number(String(v).replace(",", "."));
    if (String(v).trim() === "" || isNaN(n) || n < 0 || n > 10) throw new Error("A nota deve estar entre 0 e 10.");
    this.#nota = Math.round(n * 10) / 10;
  }
  get assistido() { return this.#assistido; }
  alternarAssistido() { this.#assistido = !this.#assistido; }   // método de comportamento

  // Imagem derivada do id (sem precisar guardar URL)
  get imagem() { return `https://picsum.photos/seed/filme${this.#id}/400/600`; }

  toJSON() {
    return { id: this.#id, titulo: this.#titulo, genero: this.#genero, ano: this.#ano, duracao: this.#duracao, nota: this.#nota, assistido: this.#assistido };
  }
}

/* ---------- CLASSE Catalogo: o CRUD + localStorage ---------- */
class Catalogo {
  #filmes = [];

  constructor() {
    try { this.#filmes = (JSON.parse(localStorage.getItem("filmes")) || []).map((f) => new Filme(f)); }
    catch { this.#filmes = []; }
    if (!this.#filmes.length && !localStorage.getItem("filmes")) {   // primeira vez: dados de exemplo
      [
        ["Eclipse Vermelho", "Ficção", 2024, 128, 8.4], ["A Última Estação", "Drama", 2022, 110, 7.9],
        ["Risada de Verão", "Comédia", 2023, 96, 7.1], ["Velocidade Total", "Ação", 2025, 121, 6.8],
        ["Mundo de Papel", "Animação", 2021, 88, 8.8], ["Sombras do Norte", "Drama", 2020, 134, 8.1],
        ["Operação Relâmpago", "Ação", 2019, 105, 6.5], ["Estrelas ao Fundo", "Ficção", 2026, 142, 9.0],
      ].forEach(([titulo, genero, ano, duracao, nota]) => this.criar({ titulo, genero, ano, duracao, nota }));
    }
  }
  #salvar() { localStorage.setItem("filmes", JSON.stringify(this.#filmes)); }

  criar(d) {                                  // CREATE
    const f = new Filme({ ...d, id: Date.now() + Math.floor(Math.random() * 1000) });
    this.#filmes.push(f); this.#salvar(); return f;
  }
  listar() { return [...this.#filmes]; }      // READ
  buscar(id) { return this.#filmes.find((f) => f.id === id); }
  atualizar(id, d) {                          // UPDATE
    const f = this.buscar(id);
    f.titulo = d.titulo; f.genero = d.genero; f.ano = d.ano; f.duracao = d.duracao; f.nota = d.nota;
    this.#salvar(); return f;
  }
  alternarAssistido(id) { this.buscar(id).alternarAssistido(); this.#salvar(); }   // UPDATE parcial
  remover(id) { this.#filmes = this.#filmes.filter((f) => f.id !== id); this.#salvar(); }   // DELETE
}

/* ---------- CLASSE ListaDesejos: agrupa filmes e calcula o total ---------- */
class ListaDesejos {
  #filmes = [];
  get filmes() { return [...this.#filmes]; }
  get totalMinutos() { return this.#filmes.reduce((s, f) => s + f.duracao, 0); }
  adicionar(f) {
    if (this.#filmes.some((x) => x.id === f.id)) return false;   // sem duplicados
    this.#filmes.push(f); return true;
  }
  remover(id) { this.#filmes = this.#filmes.filter((f) => f.id !== id); }
  limpar() { this.#filmes = []; }
}

/* =====================================================================
   INTERFACE
   ===================================================================== */
const catalogo = new Catalogo();
const lista = new ListaDesejos();
const estado = { genero: "Todos", busca: "", ordem: "titulo" };   // estado dos filtros

let timerToast;
function aviso(msg, erro = false) {
  const t = $("#toast");
  t.textContent = msg; t.className = "mostrar " + (erro ? "erro" : "");
  clearTimeout(timerToast); timerToast = setTimeout(() => (t.className = ""), 2800);
}
const formatarTempo = (min) => (min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}min` : `${min} min`);

// Aplica filtro de gênero + busca + ordenação (sempre sobre uma cópia)
function filmesVisiveis() {
  const termo = estado.busca.trim().toLowerCase();
  return catalogo.listar()
    .filter((f) => (estado.genero === "Todos" || f.genero === estado.genero) && f.titulo.toLowerCase().includes(termo))
    .sort((a, b) => {
      if (estado.ordem === "titulo") return a.titulo.localeCompare(b.titulo, "pt-BR");
      if (estado.ordem === "ano") return b.ano - a.ano;
      return b.nota - a.nota;
    });
}

function renderGrade() {
  const fs = filmesVisiveis();
  $("#contagem").textContent = `(${fs.length})`;
  $("#grade").innerHTML = fs.length ? fs.map((f) => `
    <article class="filme">
      <img src="${f.imagem}" alt="Pôster ilustrativo de ${esc(f.titulo)}" loading="lazy">
      <div class="filme__corpo">
        <h3>${esc(f.titulo)}</h3>
        <p class="meta">${esc(f.genero)} · ${f.ano} · ${formatarTempo(f.duracao)}</p>
        <p class="nota">★ ${f.nota.toFixed(1)}</p>
        ${f.assistido ? '<span class="selo">Assistido</span>' : ""}
        <div class="linha-btn">
          <button class="btn btn-pq" type="button" data-acao="lista" data-id="${f.id}">+ Lista</button>
          <button class="btn btn-pq btn-sec" type="button" data-acao="visto" data-id="${f.id}">${f.assistido ? "Desmarcar" : "Marcar visto"}</button>
          <button class="btn btn-pq btn-sec" type="button" data-acao="editar" data-id="${f.id}">Editar</button>
          <button class="btn btn-pq btn-perigo" type="button" data-acao="excluir" data-id="${f.id}">Excluir</button>
        </div>
      </div>
    </article>`).join("") : '<p class="vazio">Nenhum filme encontrado.</p>';
}

function renderLista() {
  const fs = lista.filmes;
  $("#itens").innerHTML = fs.length ? fs.map((f) => `
    <li><span>${esc(f.titulo)}<br><small>${formatarTempo(f.duracao)}</small></span>
    <button class="btn btn-pq btn-perigo" type="button" data-acao="tirar" data-id="${f.id}" aria-label="Tirar ${esc(f.titulo)} da lista">✕</button></li>`).join("")
    : '<li class="vazio">Sua lista está vazia.</li>';
  $("#tempo").textContent = formatarTempo(lista.totalMinutos);
}

function renderFiltroGeneros() {
  $("#genero").innerHTML = ["Todos", ...GENEROS].map((g) => `<option>${g}</option>`).join("");
}

/* ---------- Formulário (CREATE / UPDATE) ---------- */
const dlg = $("#dlg");
function abrirForm(f) {
  $("#form").reset(); $("#erro-form").textContent = "";
  $("#t-form").textContent = f ? "Editar filme" : "Novo filme";
  $("#f-id").value = f ? f.id : "";
  if (f) {
    $("#f-titulo").value = f.titulo; $("#f-genero").value = f.genero; $("#f-ano").value = f.ano;
    $("#f-dur").value = f.duracao; $("#f-nota").value = String(f.nota).replace(".", ",");
  }
  dlg.showModal(); $("#f-titulo").focus();
}
$("#novo").addEventListener("click", () => abrirForm(null));
$("#cancelar").addEventListener("click", () => dlg.close());
$("#form").addEventListener("submit", (e) => {
  e.preventDefault();
  const d = { titulo: $("#f-titulo").value, genero: $("#f-genero").value, ano: $("#f-ano").value, duracao: $("#f-dur").value, nota: $("#f-nota").value };
  try {
    const id = Number($("#f-id").value);
    if (id) { catalogo.atualizar(id, d); aviso("Filme atualizado!"); }
    else { catalogo.criar(d); aviso("Filme cadastrado!"); }
    dlg.close(); renderGrade(); renderLista();
  } catch (err) { $("#erro-form").textContent = err.message; }
});

/* ---------- Ações (delegação de eventos) ---------- */
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-acao]");
  if (!b) return;
  const id = Number(b.dataset.id);
  const f = catalogo.buscar(id);
  switch (b.dataset.acao) {
    case "lista": aviso(lista.adicionar(f) ? `"${f.titulo}" entrou na lista.` : "Esse filme já está na lista.", !lista.filmes.includes(f)); renderLista(); break;
    case "tirar": lista.remover(id); renderLista(); aviso("Filme removido da lista."); break;
    case "visto": catalogo.alternarAssistido(id); renderGrade(); aviso(f.assistido ? "Marcado como assistido." : "Marcação removida."); break;
    case "editar": abrirForm(f); break;
    case "excluir":
      if (confirm(`Excluir "${f.titulo}" do catálogo?`)) { catalogo.remover(id); lista.remover(id); renderGrade(); renderLista(); aviso("Filme excluído."); }
      break;
  }
});
$("#limpar").addEventListener("click", () => {
  if (!lista.filmes.length) return aviso("A lista já está vazia.", true);
  if (confirm("Limpar toda a lista?")) { lista.limpar(); renderLista(); aviso("Lista limpa."); }
});

/* ---------- Filtros ---------- */
$("#genero").addEventListener("change", (e) => { estado.genero = e.target.value; renderGrade(); });
$("#ordem").addEventListener("change", (e) => { estado.ordem = e.target.value; renderGrade(); });
$("#busca").addEventListener("input", (e) => { estado.busca = e.target.value; renderGrade(); });

/* ---------- Tema claro/escuro (+ localStorage) ---------- */
function aplicarTema(t) {
  document.documentElement.setAttribute("data-theme", t);
  $("#btn-tema").textContent = t === "dark" ? "Claro" : "Escuro";
}
aplicarTema(localStorage.getItem("tema") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
$("#btn-tema").addEventListener("click", () => {
  const novo = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  aplicarTema(novo); localStorage.setItem("tema", novo);
});

/* ---------- Início ---------- */
renderFiltroGeneros(); renderGrade(); renderLista();
