/* ==========================================================================
   main.js — utilidades compartilhadas por todas as páginas
   Menu mobile, toasts, barra de acessibilidade e sessão do usuário
   ========================================================================== */

/* ---------- Toasts (substitui window.alert) ------------------------------ */
function mostrarToast(titulo, mensagem, tipo = "sucesso") {
  let area = document.querySelector(".area-toast");
  if (!area) {
    area = document.createElement("div");
    area.className = "area-toast";
    area.setAttribute("aria-live", "polite");
    document.body.appendChild(area);
  }
  const toast = document.createElement("div");
  toast.className = "toast" + (tipo === "erro" ? " erro" : "");
  toast.innerHTML = `<strong>${titulo}</strong>${mensagem}`;
  area.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("mostrar"));

  setTimeout(() => {
    toast.classList.remove("mostrar");
    setTimeout(() => toast.remove(), 300);
  }, 4200);
}

/* ---------- Modal de confirmação simples ---------------------------------- */
function confirmarAcao({ titulo, mensagem, textoConfirmar = "Confirmar", textoCancelar = "Cancelar" }) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "sobreposicao-modal";
    overlay.innerHTML = `
      <div class="caixa-modal" role="dialog" aria-modal="true" aria-labelledby="titulo-modal">
        <h3 id="titulo-modal">${titulo}</h3>
        <p>${mensagem}</p>
        <div class="acoes-modal">
          <button class="botao botao-secundario" data-acao="cancelar">${textoCancelar}</button>
          <button class="botao botao-primario" data-acao="confirmar">${textoConfirmar}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("mostrar"));

    overlay.addEventListener("click", (e) => {
      if (e.target.dataset.acao === "confirmar") { fechar(true); }
      if (e.target.dataset.acao === "cancelar" || e.target === overlay) { fechar(false); }
    });

    function fechar(resultado) {
      overlay.classList.remove("mostrar");
      setTimeout(() => overlay.remove(), 200);
      resolve(resultado);
    }
  });
}

/* ---------- Menu mobile e submenus ----------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const botaoMenu = document.querySelector(".alterna-menu-mobile");
  const menu = document.querySelector(".menu-principal");
  if (botaoMenu && menu) {
    botaoMenu.addEventListener("click", () => {
      const aberto = menu.classList.toggle("mostrar");
      botaoMenu.setAttribute("aria-expanded", aberto ? "true" : "false");
    });
  }

  document.querySelectorAll("li.tem-submenu > .link-menu").forEach((link) => {
    link.addEventListener("click", (e) => {
      if (window.innerWidth <= 767) {
        e.preventDefault();
        link.parentElement.classList.toggle("aberto");
      }
    });
  });

  aplicarPreferenciasAcessibilidade();
  configurarBarraAcessibilidade();
  exibirSessaoNoTopo();
});

/* ---------- Acessibilidade: tema + escala de fonte -------------------------- */
function aplicarPreferenciasAcessibilidade() {
  const tema = localStorage.getItem("mnm_tema");
  const escala = localStorage.getItem("mnm_escala_fonte");
  if (tema === "escuro") document.body.classList.add("tema-escuro");
  if (escala) document.documentElement.style.setProperty("--fonte-escala", escala);
}

function configurarBarraAcessibilidade() {
  const botaoTema = document.querySelector("[data-a11y='tema']");
  const botaoMais = document.querySelector("[data-a11y='fonte-mais']");
  const botaoMenos = document.querySelector("[data-a11y='fonte-menos']");

  if (botaoTema) {
    const escuroAtivo = document.body.classList.contains("tema-escuro");
    botaoTema.setAttribute("aria-pressed", escuroAtivo ? "true" : "false");
    botaoTema.addEventListener("click", () => {
      const ativo = document.body.classList.toggle("tema-escuro");
      localStorage.setItem("mnm_tema", ativo ? "escuro" : "claro");
      botaoTema.setAttribute("aria-pressed", ativo ? "true" : "false");
    });
  }

  let escala = parseFloat(localStorage.getItem("mnm_escala_fonte")) || 1;
  const limites = { min: 0.85, max: 1.35 };

  function atualizarEscala(nova) {
    escala = Math.min(limites.max, Math.max(limites.min, nova));
    document.documentElement.style.setProperty("--fonte-escala", escala.toFixed(2));
    localStorage.setItem("mnm_escala_fonte", escala.toFixed(2));
  }

  if (botaoMais) botaoMais.addEventListener("click", () => atualizarEscala(escala + 0.1));
  if (botaoMenos) botaoMenos.addEventListener("click", () => atualizarEscala(escala - 0.1));
}

/* ---------- Sessão do usuário ------------------------------------------------ */
function obterSessao() {
  const bruto = localStorage.getItem("mnm_sessao");
  return bruto ? JSON.parse(bruto) : null;
}

function exigirLogin() {
  const sessao = obterSessao();
  if (!sessao) {
    window.location.href = "erro.html?motivo=auth";
    return null;
  }
  return sessao;
}

function exibirSessaoNoTopo() {
  const sessao = obterSessao();
  // querySelectorAll: o nome aparece no menu E no título "Bem-vindo(a)" do painel
  if (sessao) {
    document.querySelectorAll("[data-sessao='nome']").forEach((el) => {
      el.textContent = sessao.nome.split(" ")[0];
    });
  }

  // ícone de boneco + nome viram um link para "Editar perfil"
  if (sessao) {
    document.querySelectorAll(".sessao-usuario .nome-usuario").forEach((nome) => {
      if (nome.closest(".link-perfil")) return;
      const link = document.createElement("a");
      link.href = "editar-perfil.html";
      link.className = "link-perfil";
      link.title = "Meu perfil";
      link.setAttribute("aria-label", "Meu perfil: editar meus dados");
      link.innerHTML =
        '<svg class="icone-perfil" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
        '<circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/>' +
        '<path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
        "</svg>";
      nome.parentNode.insertBefore(link, nome);
      link.appendChild(nome);
    });
  }

  // itens que só fazem sentido para um tipo de conta (cliente ou profissional)
  document.querySelectorAll("[data-so-tipo]").forEach((item) => {
    const tipo = sessao ? sessao.tipo || "cliente" : null;
    item.classList.toggle("oculto", item.dataset.soTipo !== tipo);
  });

  // itens que NÃO fazem sentido para um tipo de conta (ex.: o profissional não "contrata")
  document.querySelectorAll("[data-ocultar-tipo]").forEach((item) => {
    if (sessao && (sessao.tipo || "cliente") === item.dataset.ocultarTipo) item.classList.add("oculto");
  });

  // botões de chamada que mudam de destino quando já há alguém logado
  document.querySelectorAll("[data-cta-logado]").forEach((a) => {
    if (!sessao) return;
    a.setAttribute("href", a.dataset.ctaLogado);
    if (a.dataset.ctaLogadoTexto) a.textContent = a.dataset.ctaLogadoTexto;
  });

  // login e cadastro não fazem sentido para quem já entrou
  if (sessao && document.body.hasAttribute("data-so-visitante")) {
    window.location.replace("dashboard.html");
    return;
  }

  // itens do menu que dependem de estar logado ou não (ex.: Entrar x Sair)
  document.querySelectorAll("[data-visivel]").forEach((item) => {
    const mostrarSeLogado = item.dataset.visivel === "logado";
    item.classList.toggle("oculto", mostrarSeLogado !== Boolean(sessao));
  });

  const botaoLogout = document.querySelector("[data-acao='logout']");
  if (botaoLogout) {
    botaoLogout.addEventListener("click", async (e) => {
      e.preventDefault();
      const ok = await confirmarAcao({
        titulo: "Sair da conta",
        mensagem: "Tem certeza de que deseja encerrar a sessão?",
        textoConfirmar: "Sair",
      });
      if (ok) {
        localStorage.removeItem("mnm_sessao");
        mostrarToast("Até logo!", "Você saiu da sua conta.");
        setTimeout(() => (window.location.href = "index.html"), 700);
      }
    });
  }
}


/* ---------- Segurança: escapar texto antes de usar em innerHTML -------------- */
// Tudo que o usuário digita deve passar por aqui antes de entrar em innerHTML,
// senão alguém poderia digitar <script> num campo e executar código na página.
function esc(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

/* ---------- Estrelas de avaliação (texto) -------------------------------------- */
function estrelasTexto(nota) {
  const cheias = Math.round(nota);
  return "★".repeat(cheias) + "☆".repeat(5 - cheias);
}

/* ---------- Pedidos: lista salva no localStorage ------------------------------- */
// Antes guardávamos só UM pedido. Agora guardamos um array (histórico).
function obterPedidos() {
  try { return JSON.parse(localStorage.getItem("mnm_pedidos") || "[]"); }
  catch { return []; }
}

function salvarPedidos(pedidos) {
  localStorage.setItem("mnm_pedidos", JSON.stringify(pedidos));
}


/* ---------- Contas (clientes e profissionais) ------------------------------------ */
// Todas as contas ficam em UM array, e o campo "tipo" diz se é "cliente" ou "profissional".
function obterContas() {
  let contas = [];
  try { contas = JSON.parse(localStorage.getItem("mnm_contas") || "[]"); } catch { contas = []; }
  // compatibilidade: cadastros feitos na versão antiga (um único usuário)
  try {
    const antigo = JSON.parse(localStorage.getItem("mnm_usuario") || "null");
    if (antigo && !contas.some((c) => c.login === antigo.login)) {
      contas.push({ ...antigo, tipo: "cliente", id: antigo.id || 1 });
    }
  } catch { /* ignora */ }
  return contas;
}

function salvarConta(conta) {
  const contas = obterContas();
  contas.push(conta);
  localStorage.setItem("mnm_contas", JSON.stringify(contas));
  localStorage.removeItem("mnm_usuario");
}

function loginJaExiste(login) {
  return obterContas().some((c) => c.login.toLowerCase() === login.toLowerCase());
}


// grava a lista inteira de contas (usado, por exemplo, ao trocar uma senha)
function salvarContas(contas) {
  localStorage.setItem("mnm_contas", JSON.stringify(contas));
  localStorage.removeItem("mnm_usuario"); // a conta antiga já foi migrada para a lista
}
