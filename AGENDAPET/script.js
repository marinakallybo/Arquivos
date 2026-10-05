/* =====================================================================
   PETAGENDA — POO + CRUD + DATAS
   Novidades em relação aos outros projetos:
     1) Date: juntar data+hora, comparar, formatar
     2) Conflito de horário (intervalos que se sobrepõem)
     3) Status que muda (Agendado -> Concluído / Cancelado)
   ===================================================================== */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const moeda = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pad = (n) => String(n).padStart(2, "0");

const ABRE = 8, FECHA = 18;   // horário de atendimento: 08h às 18h

/* ---------- CLASSE Servico (dados fixos do pet shop) ---------- */
class Servico {
  #id; #nome; #preco; #duracao;   // duração em minutos
  constructor(id, nome, preco, duracao) { this.#id = id; this.#nome = nome; this.#preco = preco; this.#duracao = duracao; }
  get id() { return this.#id; }
  get nome() { return this.#nome; }
  get preco() { return this.#preco; }
  get duracao() { return this.#duracao; }
}
const SERVICOS = [
  new Servico(1, "Banho", 50, 60),
  new Servico(2, "Tosa", 70, 90),
  new Servico(3, "Banho e tosa", 110, 120),
  new Servico(4, "Consulta veterinária", 120, 30),
  new Servico(5, "Vacina", 90, 20),
];
const servicoPorId = (id) => SERVICOS.find((s) => s.id === Number(id));

/* ---------- CLASSE Agendamento ---------- */
class Agendamento {
  #id; #pet; #tutor; #servico; #inicio; #status;

  constructor({ id, pet, tutor, servicoId, inicio, status = "Agendado" }) {
    this.#id = id;
    this.pet = pet; this.tutor = tutor; this.servico = servicoPorId(servicoId); this.inicio = inicio;
    this.#status = status;
  }
  get id() { return this.#id; }
  get pet() { return this.#pet; }
  set pet(v) {
    if (!v || v.trim().length < 2) throw new Error("Informe o nome do pet (mín. 2 letras).");
    this.#pet = v.trim();
  }
  get tutor() { return this.#tutor; }
  set tutor(v) {
    if (!v || v.trim().length < 2) throw new Error("Informe o nome do tutor (mín. 2 letras).");
    this.#tutor = v.trim();
  }
  get servico() { return this.#servico; }
  set servico(s) {
    if (!(s instanceof Servico)) throw new Error("Escolha um serviço.");
    this.#servico = s;
  }
  get inicio() { return this.#inicio; }
  set inicio(d) {
    const data = new Date(d);
    if (isNaN(data)) throw new Error("Informe uma data e uma hora válidas.");
    this.#inicio = data;
  }
  // Fim = início + duração do serviço (getter calculado)
  get fim() { return new Date(this.#inicio.getTime() + this.#servico.duracao * 60000); }
  get status() { return this.#status; }
  set status(s) {
    if (!["Agendado", "Concluído", "Cancelado"].includes(s)) throw new Error("Status inválido.");
    this.#status = s;
  }
  // Atrasado = ainda "Agendado", mas o horário já terminou
  get atrasado() { return this.#status === "Agendado" && this.fim < new Date(); }

  toJSON() {   // Date vira texto ISO para o localStorage
    return { id: this.#id, pet: this.#pet, tutor: this.#tutor, servicoId: this.#servico.id, inicio: this.#inicio.toISOString(), status: this.#status };
  }
}

/* ---------- CLASSE Agenda (repositório + regras de negócio) ---------- */
class Agenda {
  #itens = [];

  constructor() {
    try { this.#itens = (JSON.parse(localStorage.getItem("agenda")) || []).map((a) => new Agendamento(a)); }
    catch { this.#itens = []; }
    if (!this.#itens.length && !localStorage.getItem("agenda")) this.#exemplos();
  }
  #salvar() { localStorage.setItem("agenda", JSON.stringify(this.#itens)); }

  #exemplos() {
    const dia = (offset, h, m = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); d.setHours(h, m, 0, 0); return d; };
    [
      ["Thor", "Marina", 3, dia(0, 8)], ["Mel", "Carlos", 1, dia(1, 9)], ["Bolinha", "Ana", 4, dia(1, 10)],
      ["Luna", "Pedro", 2, dia(2, 14)], ["Rex", "Julia", 5, dia(3, 15)],
    ].forEach(([pet, tutor, servicoId, inicio]) => this.criar({ pet, tutor, servicoId, inicio }, true));
  }

  // REGRAS DE NEGÓCIO: lança Error se algo estiver errado
  #validar(inicio, servico, ignorarId, exigirFuturo) {
    if (isNaN(inicio)) throw new Error("Informe uma data e uma hora válidas.");
    if (exigirFuturo && inicio < new Date()) throw new Error("Escolha uma data e hora futuras.");
    const fim = new Date(inicio.getTime() + servico.duracao * 60000);

    // Dentro do horário de funcionamento?
    const abre = new Date(inicio); abre.setHours(ABRE, 0, 0, 0);
    const fecha = new Date(inicio); fecha.setHours(FECHA, 0, 0, 0);
    if (inicio < abre || fim > fecha) throw new Error(`Atendemos das ${ABRE}h às ${FECHA}h (o serviço precisa terminar até as ${FECHA}h).`);
    if (inicio.getDay() === 0) throw new Error("Não atendemos aos domingos.");

    // CONFLITO: dois intervalos se sobrepõem quando  inicioA < fimB  E  inicioB < fimA
    const conflito = this.#itens.find((a) =>
      a.id !== ignorarId && a.status !== "Cancelado" && inicio < a.fim && a.inicio < fim);
    if (conflito) throw new Error(`Horário ocupado: ${conflito.pet} (${conflito.inicio.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}).`);
  }

  criar(d, ignorarPassado = false) {                          // CREATE
    const servico = servicoPorId(d.servicoId);
    if (!servico) throw new Error("Escolha um serviço.");
    const inicio = new Date(d.inicio);
    this.#validar(inicio, servico, null, !ignorarPassado);
    const a = new Agendamento({ ...d, inicio, id: Date.now() + Math.floor(Math.random() * 1000) });
    this.#itens.push(a); this.#salvar(); return a;
  }
  listar() { return [...this.#itens]; }                       // READ
  buscar(id) { return this.#itens.find((a) => a.id === id); }
  atualizar(id, d) {                                          // UPDATE
    const a = this.buscar(id);
    const servico = servicoPorId(d.servicoId);
    if (!servico) throw new Error("Escolha um serviço.");
    const inicio = new Date(d.inicio);
    const mudouHorario = inicio.getTime() !== a.inicio.getTime() || servico !== a.servico;
    if (mudouHorario) this.#validar(inicio, servico, id, true);   // só revalida se mudou data/serviço
    a.pet = d.pet; a.tutor = d.tutor; a.servico = servico; a.inicio = inicio;
    this.#salvar(); return a;
  }
  mudarStatus(id, status) { this.buscar(id).status = status; this.#salvar(); }   // UPDATE parcial
  // Reabrir: o horário precisa continuar livre (ignora o próprio agendamento)
  reabrir(id) {
    const a = this.buscar(id);
    this.#validar(a.inicio, a.servico, id, false);
    a.status = "Agendado"; this.#salvar();
  }
  remover(id) { this.#itens = this.#itens.filter((a) => a.id !== id); this.#salvar(); }   // DELETE
}

/* =====================================================================
   INTERFACE
   ===================================================================== */
const agenda = new Agenda();
const filtro = { busca: "", periodo: "todos", status: "Todos" };

let timerToast;
function aviso(msg, erro = false) {
  const t = $("#toast");
  t.textContent = msg; t.className = "mostrar " + (erro ? "erro" : "");
  clearTimeout(timerToast); timerToast = setTimeout(() => (t.className = ""), 3000);
}

const mesmoDia = (a, b) => a.toDateString() === b.toDateString();
const fmtHora = (d) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const fmtDia = (d) => d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });

// Filtra (busca + período + status) e ORDENA POR DATA (Date - Date = milissegundos)
function visiveis() {
  const termo = filtro.busca.trim().toLowerCase();
  const agora = new Date();
  return agenda.listar()
    .filter((a) => (a.pet + " " + a.tutor).toLowerCase().includes(termo))
    .filter((a) => filtro.status === "Todos" || a.status === filtro.status)
    .filter((a) => filtro.periodo === "todos" || (filtro.periodo === "hoje" ? mesmoDia(a.inicio, agora) : a.inicio > agora))
    .sort((a, b) => a.inicio - b.inicio);
}

function renderResumo() {
  const todos = agenda.listar(), agora = new Date();
  const ativos = todos.filter((a) => a.status === "Agendado");
  $("#k-hoje").textContent = ativos.filter((a) => mesmoDia(a.inicio, agora)).length;
  $("#k-prox").textContent = ativos.filter((a) => a.inicio > agora).length;
  $("#k-atras").textContent = ativos.filter((a) => a.atrasado).length;
  $("#k-fat").textContent = moeda(ativos.reduce((s, a) => s + a.servico.preco, 0));
}

function renderLista() {
  const lista = visiveis();
  $("#contagem").textContent = `(${lista.length})`;
  $("#lista").innerHTML = lista.length ? lista.map((a) => {
    const classe = a.atrasado ? "atrasado" : a.status.toLowerCase().replace("í", "i");   // Concluído -> concluido
    const rotulo = a.atrasado ? "Atrasado" : a.status;
    return `
    <li class="item ${classe}">
      <div><span class="quando">${fmtDia(a.inicio)}</span><br><span class="meta">${fmtHora(a.inicio)} – ${fmtHora(a.fim)}</span></div>
      <div>
        <p class="pet">${esc(a.pet)} <span class="selo ${classe}">${rotulo}</span></p>
        <p class="meta">Tutor: ${esc(a.tutor)} · ${esc(a.servico.nome)} · ${moeda(a.servico.preco)}</p>
      </div>
      <div class="btns">
        ${a.status === "Agendado"
          ? `<button class="btn btn-pq" type="button" data-acao="concluir" data-id="${a.id}">Concluir</button>
             <button class="btn btn-pq btn-sec" type="button" data-acao="cancelar" data-id="${a.id}">Cancelar</button>`
          : `<button class="btn btn-pq btn-sec" type="button" data-acao="reabrir" data-id="${a.id}">Reabrir</button>`}
        <button class="btn btn-pq btn-sec" type="button" data-acao="editar" data-id="${a.id}">Editar</button>
        <button class="btn btn-pq btn-perigo" type="button" data-acao="excluir" data-id="${a.id}">Excluir</button>
      </div>
    </li>`;
  }).join("") : '<li class="vazio">Nenhum agendamento encontrado.</li>';
  renderResumo();
}

/* ---------- Formulário (CREATE / UPDATE) ---------- */
const dlg = $("#dlg");
$("#f-servico").innerHTML = SERVICOS.map((s) => `<option value="${s.id}">${s.nome} — ${moeda(s.preco)} (${s.duracao} min)</option>`).join("");

function abrirForm(a) {
  $("#form").reset(); $("#erro-form").textContent = "";
  $("#t-form").textContent = a ? "Editar agendamento" : "Novo agendamento";
  $("#f-id").value = a ? a.id : "";
  const hoje = new Date();
  $("#f-data").min = `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}-${pad(hoje.getDate())}`;   // bloqueia dias passados no calendário
  if (a) {
    const d = a.inicio;
    $("#f-pet").value = a.pet; $("#f-tutor").value = a.tutor; $("#f-servico").value = a.servico.id;
    $("#f-data").value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;   // input date exige yyyy-mm-dd
    $("#f-hora").value = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  dlg.showModal(); $("#f-pet").focus();
}
$("#novo").addEventListener("click", () => abrirForm(null));
$("#cancelar").addEventListener("click", () => dlg.close());

$("#form").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = $("#f-data").value, hora = $("#f-hora").value;
  if (!data || !hora) { $("#erro-form").textContent = "Informe a data e a hora."; return; }
  const d = {
    pet: $("#f-pet").value, tutor: $("#f-tutor").value, servicoId: $("#f-servico").value,
    inicio: new Date(`${data}T${hora}`),     // junta "2026-10-06" + "09:00" em um Date (horário local)
  };
  try {
    const id = Number($("#f-id").value);
    if (id) { agenda.atualizar(id, d); aviso("Agendamento atualizado!"); }
    else { agenda.criar(d); aviso("Agendamento criado!"); }
    dlg.close(); renderLista();
  } catch (err) { $("#erro-form").textContent = err.message; }
});

/* ---------- Ações (delegação de eventos) ---------- */
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-acao]");
  if (!b) return;
  const id = Number(b.dataset.id), a = agenda.buscar(id);
  try {
    switch (b.dataset.acao) {
      case "concluir": agenda.mudarStatus(id, "Concluído"); aviso(`Atendimento de ${a.pet} concluído.`); break;
      case "cancelar":
        if (confirm(`Cancelar o agendamento de ${a.pet}?`)) { agenda.mudarStatus(id, "Cancelado"); aviso("Agendamento cancelado."); }
        break;
      case "reabrir": agenda.reabrir(id); aviso("Agendamento reaberto."); break;
      case "editar": abrirForm(a); return;
      case "excluir":
        if (confirm(`Excluir o agendamento de ${a.pet}? Essa ação não pode ser desfeita.`)) { agenda.remover(id); aviso("Agendamento excluído."); }
        break;
    }
  } catch (err) { aviso(err.message, true); }
  renderLista();
});

/* ---------- Filtros ---------- */
$("#busca").addEventListener("input", (e) => { filtro.busca = e.target.value; renderLista(); });
$("#periodo").addEventListener("change", (e) => { filtro.periodo = e.target.value; renderLista(); });
$("#status").addEventListener("change", (e) => { filtro.status = e.target.value; renderLista(); });

/* ---------- Relógio (também atualiza "atrasados" a cada minuto) ---------- */
function relogio() {
  $("#relogio").textContent = new Date().toLocaleString("pt-BR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}
relogio();
setInterval(() => { relogio(); if (new Date().getSeconds() === 0) renderLista(); }, 1000);

/* ---------- Tema ---------- */
function aplicarTema(t) {
  document.documentElement.setAttribute("data-theme", t);
  $("#btn-tema").textContent = t === "dark" ? "Claro" : "Escuro";
}
aplicarTema(localStorage.getItem("tema") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
$("#btn-tema").addEventListener("click", () => {
  const novo = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  aplicarTema(novo); localStorage.setItem("tema", novo);
});

renderLista();
