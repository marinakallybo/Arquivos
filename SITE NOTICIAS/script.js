/* =====================================================================
   SCRIPT.JS — toda a interatividade do site
   IDEIA CENTRAL (vale para qualquer site de prova):
     1) Os dados ficam num ARRAY de objetos.
     2) Uma variável de ESTADO guarda o que o usuário escolheu
        (categoria, texto da busca, quantos cards mostrar).
     3) Funções "render" desenham o HTML a partir dos dados + estado.
     4) EVENTOS (click, input, submit) mudam o estado e chamam o render de novo.
   ===================================================================== */


/* =====================================================================
   1. DADOS
   Array = lista []; cada notícia é um objeto {} com propriedades
   (chave: valor). Para criar uma notícia nova, basta copiar uma linha
   e trocar os valores.
   ===================================================================== */

// Lista de categorias usada para gerar os botões de filtro.
// Os nomes precisam ser IGUAIS aos do campo "categoria" das notícias
// (e aos data-cat do CSS), senão o filtro e as cores não funcionam.
const categorias = ["Lançamentos", "Indie", "Esports", "Hardware", "Opinião"];

// Cada objeto = uma notícia.
//   id        -> número único da notícia
//   titulo    -> texto do título
//   categoria -> uma das categorias acima
//   autor     -> quem escreveu
//   data      -> data de publicação (texto)
//   min       -> minutos de leitura
//   resumo    -> frase curta (usada só no destaque)
//   img       -> endereço da imagem (aqui, Lorem Picsum; "seed" fixa a foto)
//   alt       -> descrição da imagem (ACESSIBILIDADE: obrigatório na prova!)
const noticias = [
  { id: 1, titulo: "Novo console portátil promete 12 horas de bateria", categoria: "Hardware", autor: "Marina Alves", data: "21 set", min: 6,
    resumo: "Fabricantes apostam em chips mais eficientes para mudar o jogo fora de casa.", img: "https://picsum.photos/seed/console/800/450", alt: "Console portátil sobre uma mesa" },
  { id: 2, titulo: "Estúdio indie brasileiro conquista prêmio internacional", categoria: "Indie", autor: "Rafael Costa", data: "21 set", min: 4,
    resumo: "Jogo de aventura feito por três pessoas vence festival.", img: "https://picsum.photos/seed/indie/800/450", alt: "Cena colorida de um jogo de aventura" },
  { id: 3, titulo: "Final do campeonato mundial bate recorde de audiência", categoria: "Esports", autor: "Beatriz Nunes", data: "20 set", min: 5,
    resumo: "Mais de 6 milhões de espectadores simultâneos acompanharam a decisão.", img: "https://picsum.photos/seed/esports/800/450", alt: "Arena lotada em uma final de esports" },
  { id: 4, titulo: "Trailer de RPG mundo aberto surpreende a comunidade", categoria: "Lançamentos", autor: "Diego Prado", data: "20 set", min: 3,
    resumo: "O título chega no próximo ano para PC e consoles.", img: "https://picsum.photos/seed/rpg/800/450", alt: "Cavaleiro diante de um castelo" },
  { id: 5, titulo: "Placas de vídeo: vale esperar a próxima geração?", categoria: "Hardware", autor: "Rafael Costa", data: "19 set", min: 7,
    resumo: "Comparamos preços e desempenho para ajudar na decisão de compra.", img: "https://picsum.photos/seed/gpu/800/450", alt: "Placa de vídeo em close" },
  { id: 6, titulo: "Por que jogos curtos estão voltando à moda", categoria: "Opinião", autor: "Marina Alves", data: "19 set", min: 5,
    resumo: "Menos horas, mais experiência: o que explica a tendência.", img: "https://picsum.photos/seed/opiniao/800/450", alt: "Controle de videogame sobre um sofá" },
  { id: 7, titulo: "Jogo de plataforma com pixel art ganha demo gratuita", categoria: "Indie", autor: "Beatriz Nunes", data: "18 set", min: 3,
    resumo: "A demo já está disponível e recebeu críticas positivas.", img: "https://picsum.photos/seed/pixel/800/450", alt: "Personagem em pixel art pulando" },
  { id: 8, titulo: "Time brasileiro avança às semifinais do mundial", categoria: "Esports", autor: "Diego Prado", data: "18 set", min: 4,
    resumo: "Vitória apertada por 2 a 1 garantiu a vaga.", img: "https://picsum.photos/seed/time/800/450", alt: "Jogadores comemorando uma vitória" },
  { id: 9, titulo: "Grande lançamento de corrida chega com 400 carros", categoria: "Lançamentos", autor: "Rafael Costa", data: "17 set", min: 4,
    resumo: "Novo simulador traz física renovada e pistas inéditas.", img: "https://picsum.photos/seed/corrida/800/450", alt: "Carro de corrida em alta velocidade" },
  { id: 10, titulo: "Monitores de 240 Hz: quem realmente precisa?", categoria: "Hardware", autor: "Marina Alves", data: "17 set", min: 6,
    resumo: "Testamos taxas de atualização em jogos competitivos e casuais.", img: "https://picsum.photos/seed/monitor/800/450", alt: "Monitor gamer em ambiente escuro" },
];


/* =====================================================================
   2. ESTADO
   Variáveis que "lembram" o que o usuário fez. Quando elas mudam,
   chamamos renderGrade() para a tela refletir a mudança.
   ===================================================================== */

const POR_PAGINA = 3;          // const = valor fixo: quantos cards o "Carregar mais" adiciona
let categoriaAtiva = "Todas";  // let = valor que MUDA: categoria selecionada no filtro
let termoBusca = "";           // texto digitado na busca
let visiveis = 6;              // quantos cards aparecem na grade agora


/* =====================================================================
   3. REFERÊNCIAS DO DOM
   Guardamos os elementos do HTML em variáveis para usar depois.
   ===================================================================== */

// Atalho: em vez de escrever document.querySelector(...) toda hora,
// escrevemos $("...") — o seletor funciona igual ao CSS (#id, .classe, tag).
const $ = (sel) => document.querySelector(sel);

const grade = $("#grade");     // <div id="grade"> onde ficam os cards
const filtros = $("#filtros"); // <div id="filtros"> onde ficam os botões de categoria
const btnMais = $("#mais");    // botão "Carregar mais"
const vazio = $("#vazio");     // mensagem "Nenhuma notícia encontrada"


/* =====================================================================
   4. RENDERIZAÇÃO
   Funções que montam o HTML com template strings (crases ``) e
   ${variável} para encaixar os dados, e o colocam na página com innerHTML.
   ===================================================================== */

// Desenha a matéria principal (a primeira do array: noticias[0]).
function renderDestaque() {
  const n = noticias[0]; // pega o primeiro objeto do array (índice 0)

  // innerHTML substitui o conteúdo interno do elemento #destaque.
  $("#destaque").innerHTML = `
    <img src="${n.img}" alt="${n.alt}">
    <span class="tag" data-cat="${n.categoria}">${n.categoria}</span>
    <h1 id="hero-titulo">${n.titulo}</h1>
    <p>${n.resumo}</p>
    <p class="meta">Por <strong>${n.autor}</strong> · ${n.data} 2026 · ${n.min} min de leitura</p>`;
}

// Desenha a lista numerada ao lado do destaque (3 notícias).
function renderLateral() {
  // slice(1, 4) copia do índice 1 até o 3 (o 4 não entra) -> notícias 2, 3 e 4.
  // map() transforma CADA notícia em um pedaço de HTML (i = posição 0, 1, 2).
  // join("") junta todos os pedaços num texto único (sem vírgulas entre eles).
  $("#lista-lateral").innerHTML = noticias.slice(1, 4).map((n, i) => `
    <li>
      <span class="num">${i + 1}</span>
      <a href="#"><h3>${n.titulo}</h3>
      <p class="meta">${n.categoria} · ${n.data}</p></a>
    </li>`).join("");
}

// Desenha os botões de filtro: "Todas" + uma para cada categoria.
function renderFiltros() {
  // [ "Todas", ...categorias ] cria um array novo com "Todas" na frente
  // (os três pontos "espalham" os itens de categorias).
  filtros.innerHTML = ["Todas", ...categorias].map((c) =>
    // O botão da categoria ativa recebe a classe "ativo" (destacado no CSS).
    // aria-pressed informa a leitores de tela se o botão está selecionado.
    // data-cat guarda o nome da categoria para lermos no clique (dataset.cat).
    `<button type="button" data-cat="${c}" class="${c === categoriaAtiva ? "ativo" : ""}"
      aria-pressed="${c === categoriaAtiva}">${c}</button>`).join("");
}

// Devolve só as notícias que passam nos DOIS filtros: categoria E busca.
function filtrar() {
  // trim() tira espaços das pontas; toLowerCase() ignora maiúsculas/minúsculas.
  const termo = termoBusca.trim().toLowerCase();

  // filter() mantém apenas os itens em que a condição é verdadeira.
  return noticias.filter((n) =>
    // condição 1: categoria "Todas" aceita tudo; senão precisa ser igual
    (categoriaAtiva === "Todas" || n.categoria === categoriaAtiva) &&
    // condição 2: o título contém o texto buscado (includes)
    // (busca vazia "" está contida em qualquer texto, então mostra tudo)
    n.titulo.toLowerCase().includes(termo));
}

// Desenha a grade de cards respeitando filtro, busca e "carregar mais".
function renderGrade() {
  const lista = filtrar();                 // notícias que passaram nos filtros
  const mostrar = lista.slice(0, visiveis); // só as primeiras "visiveis" (paginação)

  grade.innerHTML = mostrar.map((n) => `
    <article class="card">
      <a href="#">
        <!-- loading="lazy": o navegador só baixa a imagem quando ela está perto de aparecer -->
        <img src="${n.img}" alt="${n.alt}" loading="lazy">
      </a>
      <span class="tag" data-cat="${n.categoria}">${n.categoria}</span>
      <h3><a href="#">${n.titulo}</a></h3>
      <p class="meta">${n.autor} · ${n.data} · ${n.min} min</p>
    </article>`).join("");

  // hidden = true esconde o elemento.
  // Mensagem "vazio" só aparece se NÃO houver nenhum resultado.
  vazio.hidden = lista.length > 0;
  // Botão "Carregar mais" some quando já estamos mostrando tudo.
  btnMais.hidden = visiveis >= lista.length;
}


/* =====================================================================
   5. RECURSOS INTERATIVOS (o que a prova pede: mínimo 2)
   ===================================================================== */

/* ---------- 5.1 RELÓGIO AO VIVO ---------- */
function atualizarRelogio() {
  const agora = new Date(); // objeto com a data e hora atuais do computador

  // toLocaleDateString formata a data; "pt-BR" = português do Brasil.
  // Ex.: "segunda-feira, 5 de outubro"
  const data = agora.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  // toLocaleTimeString formata a hora. Ex.: "17:51:20"
  const hora = agora.toLocaleTimeString("pt-BR");

  // textContent troca só o TEXTO do elemento (mais seguro que innerHTML).
  $("#relogio").textContent = data + " · " + hora;
}
atualizarRelogio();                // roda uma vez já, para não esperar 1 segundo
setInterval(atualizarRelogio, 1000); // e repete a cada 1000 ms (1 segundo)


/* ---------- 5.2 TEMA CLARO/ESCURO (+ localStorage = bônus) ---------- */
const btnTema = $("#btn-tema");

// Aplica o tema: coloca data-theme="dark" ou "light" na tag <html>.
// No CSS, [data-theme="dark"] redefine as variáveis de cor.
function aplicarTema(tema) {
  document.documentElement.setAttribute("data-theme", tema); // documentElement = <html>
  // O botão mostra o tema PARA O QUAL ele vai trocar.
  btnTema.textContent = tema === "dark" ? "Claro" : "Escuro";
}

// localStorage guarda dados no navegador, mesmo depois de fechar a página.
// getItem lê o valor salvo (ou null, se nunca foi salvo).
const salvo = localStorage.getItem("tema");

// matchMedia pergunta ao navegador/sistema se o usuário prefere tema escuro.
const sistema = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

// Prioridade: 1º o que o usuário escolheu antes, 2º a preferência do sistema.
// (o operador || usa o primeiro valor que não for vazio/null)
aplicarTema(salvo || sistema);

// Ao clicar: descobre o tema atual, troca pelo oposto, aplica e salva.
btnTema.addEventListener("click", () => {
  const atual = document.documentElement.getAttribute("data-theme");
  const novo = atual === "dark" ? "light" : "dark";
  aplicarTema(novo);
  localStorage.setItem("tema", novo); // setItem(chave, valor) salva a escolha
});


/* ---------- 5.3 FILTRO POR CATEGORIA ---------- */

// DELEGAÇÃO DE EVENTOS: como os botões são recriados a cada renderFiltros(),
// colocamos UM ouvinte no elemento pai (#filtros) em vez de um em cada botão.
// Assim ele continua funcionando mesmo com os botões sendo recriados.
filtros.addEventListener("click", (e) => {
  // e.target = elemento clicado; closest("button") sobe até achar o <button>.
  const btn = e.target.closest("button");
  if (!btn) return; // clicou fora de um botão (no espaço vazio)? não faz nada.

  categoriaAtiva = btn.dataset.cat; // lê o atributo data-cat do botão
  visiveis = 6;                     // volta para as 6 primeiras ao trocar de filtro
  renderFiltros();                  // redesenha os botões (muda qual está "ativo")
  renderGrade();                    // redesenha os cards já filtrados
});

// Os links do menu de navegação também filtram pela categoria deles.
// forEach percorre cada link <a> dentro de .nav.
document.querySelectorAll(".nav a").forEach((a) =>
  a.addEventListener("click", () => {
    categoriaAtiva = a.dataset.cat;
    visiveis = 6;
    renderFiltros();
    renderGrade();
  }));


/* ---------- 5.4 BUSCA EM TEMPO REAL ---------- */

// O evento "input" dispara a CADA letra digitada (diferente de "change",
// que só dispara quando o campo perde o foco).
$("#busca").addEventListener("input", (e) => {
  termoBusca = e.target.value; // e.target.value = texto atual do campo
  visiveis = 6;
  renderGrade();
});


/* ---------- 5.5 CARREGAR MAIS ---------- */
btnMais.addEventListener("click", () => {
  visiveis += POR_PAGINA; // soma 3 ao total visível (6 -> 9 -> 12...)
  renderGrade();          // redesenha mostrando mais cards
});


/* ---------- 5.6 NEWSLETTER COM VALIDAÇÃO (REGEX) ---------- */
$("#form-news").addEventListener("submit", (e) => {
  e.preventDefault(); // impede o comportamento padrão (recarregar a página)

  const email = $("#email").value.trim(); // texto digitado, sem espaços nas pontas
  const msg = $("#msg-news");             // parágrafo onde mostramos o resultado

  // Expressão regular (regex) = padrão que o texto precisa seguir:
  //   ^        início do texto
  //   [^\s@]+  um ou mais caracteres que NÃO sejam espaço nem @
  //   @        um arroba
  //   [^\s@]+  um ou mais caracteres (o domínio)
  //   \.       um ponto literal
  //   [^\s@]+  um ou mais caracteres (ex.: com, br)
  //   $        fim do texto
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // regex.test(texto) devolve true se o texto segue o padrão.
  if (regex.test(email)) {
    msg.textContent = "Inscrição confirmada! Obrigada.";
    msg.className = "ok";   // classe CSS que deixa o texto verde
    e.target.reset();       // limpa o formulário (e.target = o <form>)
  } else {
    msg.textContent = "Digite um e-mail válido.";
    msg.className = "erro"; // classe CSS que deixa o texto vermelho
  }
});


/* =====================================================================
   6. INICIALIZAÇÃO
   Ao carregar a página, desenhamos tudo uma primeira vez.
   (O <script> está no fim do <body>, então o HTML já existe aqui.)
   ===================================================================== */
renderDestaque();
renderLateral();
renderFiltros();
renderGrade();
