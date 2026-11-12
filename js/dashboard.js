/* ==========================================================================
   dashboard.js — painel do cliente: resumo, histórico, status e avaliação
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const sessao = exigirLogin();
  if (!sessao) return;

  const nomesServico = { limpeza: "Limpeza", manutencao: "Manutenção", obras: "Pequenas obras" };
  const rotulosStatus = {
    pendente: "Aguardando profissional",
    aceito: "Aceito — em andamento",
    concluido: "Concluído",
    cancelado: "Cancelado",
    recusado: "Recusado",
  };

  const ehProfissional = sessao.tipo === "profissional";
  const lista = document.getElementById("lista-pedidos");
  const resumo = document.getElementById("resumo-numeros");

  function desenharResumo(pedidos) {
    const total = pedidos.length;
    const concluidos = pedidos.filter((p) => p.status === "concluido").length;
    const pendentes = pedidos.filter((p) => p.status === "pendente" || p.status === "aceito").length;
    resumo.innerHTML = `
      <div class="numero-resumo"><strong>${total}</strong><span>Pedidos</span></div>
      <div class="numero-resumo"><strong>${pendentes}</strong><span>Em aberto</span></div>
      <div class="numero-resumo"><strong>${concluidos}</strong><span>Concluídos</span></div>`;
  }

  // cada tipo de conta vê apenas os SEUS pedidos
  function meusPedidos() {
    return obterPedidos().filter((p) =>
      ehProfissional ? p.profissionalId === sessao.id : p.clienteId === sessao.id || p.clienteId === undefined
    );
  }

  function desenharPedido(p) {
    const prof = obterProfissional(p.profissionalId);
    const data = new Date(p.enviadoEm).toLocaleDateString("pt-BR");
    let acoes = "";
    const btn = (classe, acao, texto) => `<button class="botao ${classe}" data-acao-pedido="${acao}" data-id="${p.id}">${texto}</button>`;
    if (ehProfissional) {
      // fluxo do profissional: aceitar/recusar -> concluir
      if (p.status === "pendente") acoes = btn("botao-primario", "aceitar", "Aceitar") + btn("botao-perigo", "recusar", "Recusar");
      else if (p.status === "aceito") acoes = btn("botao-secundario", "concluir", "Marcar como concluído");
      else if (p.status === "concluido") {
        acoes = p.avaliacao
          ? `<span class="estrelas" aria-label="Nota do cliente: ${p.avaliacao.nota} de 5">${estrelasTexto(p.avaliacao.nota)}</span>
             <small>${esc(p.avaliacao.comentario)}</small>`
          : "<small>Aguardando avaliação do cliente.</small>";
      }
    } else {
      // fluxo do cliente: pode cancelar até concluir; depois avalia
      if (p.status === "pendente" || p.status === "aceito") acoes = btn("botao-perigo", "cancelar", "Cancelar");
      else if (p.status === "concluido") {
        acoes = p.avaliacao
          ? `<span class="estrelas" aria-label="Sua nota: ${p.avaliacao.nota} de 5">${estrelasTexto(p.avaliacao.nota)}</span>
             <small>${esc(p.avaliacao.comentario)}</small>`
          : btn("botao-primario", "avaliar", "Avaliar atendimento");
      }
    }
    return `
      <article class="item-pedido">
        <div class="item-pedido-topo">
          <h4>${nomesServico[p.tipoServico] || esc(p.tipoServico)}${ehProfissional ? " — " + esc(p.nomeCliente) : ""}</h4>
          <span class="status status-${p.status}">${rotulosStatus[p.status]}</span>
        </div>
        <p class="dica-campo">${ehProfissional ? "" : (prof ? esc(prof.nome) : "Qualquer profissional") + " · "}${esc(p.periodo)} · pedido em ${data}</p>
        ${p.detalhes ? `<p>${esc(p.detalhes)}</p>` : ""}
        <div class="acoes-pedido">${acoes}</div>
      </article>`;
  }

  /* ---------- mural: pedidos sem profissional escolhido, na categoria dele ------- */
  function desenharMural() {
    const mural = document.getElementById("mural-abertos");
    if (!ehProfissional || !mural) return;
    const conta = obterContas().find((c) => c.id === sessao.id);
    const abertos = obterPedidos().filter(
      (p) => p.profissionalId == null && p.status === "pendente" && conta && p.tipoServico === conta.categoria
    );
    mural.classList.remove("oculto");
    document.getElementById("lista-mural").innerHTML = abertos.length
      ? abertos.sort((a, b) => b.id - a.id).map((p) => `
        <article class="item-pedido">
          <div class="item-pedido-topo">
            <h4>${esc(p.nomeCliente)}</h4>
            <span class="status status-pendente">${esc(p.urgenciaTexto)}</span>
          </div>
          <p class="dica-campo">${esc(p.periodo)} · pedido em ${new Date(p.enviadoEm).toLocaleDateString("pt-BR")}</p>
          ${p.detalhes ? `<p>${esc(p.detalhes)}</p>` : ""}
          <div class="acoes-pedido"><button class="botao botao-primario" data-acao-pedido="assumir" data-id="${p.id}">Aceitar este pedido</button></div>
        </article>`).join("")
      : '<p class="dica-campo">Nenhum pedido aberto na sua categoria no momento.</p>';
  }

  function desenhar() {
    desenharMural();
    const pedidos = meusPedidos().sort((a, b) => b.id - a.id);
    desenharResumo(pedidos);
    lista.innerHTML = pedidos.length
      ? pedidos.map(desenharPedido).join("")
      : '<p class="dica-campo">Nenhuma solicitação enviada ainda.</p>';
  }

  /* ---------- avaliação em um modal com estrelas -------------------------------- */
  function pedirAvaliacao() {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "sobreposicao-modal";
      overlay.innerHTML = `
        <div class="caixa-modal" role="dialog" aria-modal="true" aria-labelledby="titulo-avaliacao">
          <h3 id="titulo-avaliacao">Como foi o atendimento?</h3>
          <div class="escolha-estrelas" role="radiogroup" aria-label="Nota de 1 a 5">
            ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="estrela-botao" data-nota="${n}" role="radio" aria-checked="false" aria-label="${n} de 5">☆</button>`).join("")}
          </div>
          <div class="campo"><label for="comentario-avaliacao">Comentário (opcional)</label>
            <input type="text" id="comentario-avaliacao" maxlength="120"></div>
          <div class="acoes-modal">
            <button class="botao botao-secundario" data-fim="cancelar">Agora não</button>
            <button class="botao botao-primario" data-fim="enviar">Enviar avaliação</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add("mostrar"));

      let nota = 0;
      const botoes = overlay.querySelectorAll(".estrela-botao");
      function pintar() {
        botoes.forEach((b) => {
          const ativo = Number(b.dataset.nota) <= nota;
          b.textContent = ativo ? "★" : "☆";
          b.setAttribute("aria-checked", Number(b.dataset.nota) === nota ? "true" : "false");
        });
      }
      function fechar(valor) {
        overlay.classList.remove("mostrar");
        setTimeout(() => overlay.remove(), 200);
        resolve(valor);
      }

      overlay.addEventListener("click", (e) => {
        if (e.target.dataset.nota) { nota = Number(e.target.dataset.nota); pintar(); }
        if (e.target.dataset.fim === "cancelar" || e.target === overlay) fechar(null);
        if (e.target.dataset.fim === "enviar") {
          if (!nota) { mostrarToast("Escolha uma nota", "Toque nas estrelas de 1 a 5.", "erro"); return; }
          fechar({ nota, comentario: document.getElementById("comentario-avaliacao").value.trim() });
        }
      });
    });
  }

  /* ---------- cliques nos botões dos pedidos (um listener só, na lista) -------- */
  document.querySelector("main").addEventListener("click", async (e) => {
    const botao = e.target.closest("[data-acao-pedido]");
    if (!botao) return;
    const pedidos = obterPedidos();
    const pedido = pedidos.find((p) => p.id === Number(botao.dataset.id));
    if (!pedido) return;

    const acao = botao.dataset.acaoPedido;
    if (acao === "cancelar" || acao === "recusar") {
      const recusar = acao === "recusar";
      const ok = await confirmarAcao({
        titulo: recusar ? "Recusar pedido" : "Cancelar pedido",
        mensagem: recusar ? "Deseja mesmo recusar este pedido?" : "Deseja mesmo cancelar esta solicitação?",
        textoConfirmar: recusar ? "Recusar" : "Cancelar pedido",
        textoCancelar: "Voltar",
      });
      if (!ok) return;
      pedido.status = recusar ? "recusado" : "cancelado";
      mostrarToast(recusar ? "Pedido recusado" : "Pedido cancelado", recusar ? "O cliente será avisado." : "Você pode solicitar um novo quando quiser.");
    } else if (acao === "aceitar") {
      pedido.status = "aceito";
      mostrarToast("Pedido aceito", "Combine os detalhes com o cliente e conclua o serviço.");
    } else if (acao === "assumir") {
      pedido.profissionalId = sessao.id; // o pedido deixa de ser "aberto" e passa a ser dele
      pedido.status = "aceito";
      mostrarToast("Pedido aceito", "Ele agora aparece em Pedidos recebidos.");
    } else if (acao === "concluir") {
      pedido.status = "concluido";
      mostrarToast("Serviço concluído", "O cliente já pode avaliar o atendimento.");
    } else if (acao === "avaliar") {
      const avaliacao = await pedirAvaliacao();
      if (!avaliacao) return;
      pedido.avaliacao = avaliacao;
      mostrarToast("Obrigado!", "Sua avaliação foi registrada.");
    }
    salvarPedidos(pedidos);
    desenhar();
  });

  /* ---------- visão do profissional: troca textos e mostra o perfil ---------------- */
  if (ehProfissional) {
    const conta = obterContas().find((c) => c.id === sessao.id);
    document.getElementById("titulo-pedidos").textContent = "Pedidos recebidos";
    document.getElementById("subtitulo-painel").textContent =
      "Este é o seu painel de profissional. Aceite pedidos, conclua serviços e acompanhe suas avaliações.";
    document.getElementById("botao-novo-pedido").classList.add("oculto");
    lista.querySelector("p")?.remove();
    if (conta) {
      const prof = obterProfissional(conta.id);
      // prévia: o profissional vê exatamente o cartão que os clientes veem
      document.getElementById("card-conta").innerHTML = `
        <h3>Como os clientes veem você</h3>
        ${prof ? cartaoProfissionalHTML(prof, false) : ""}
        <p class="dica-campo">Esse cartão aparece na página Profissionais. A nota é a média das avaliações dos seus atendimentos.</p>
        <a href="editar-perfil.html" class="botao botao-secundario" style="margin-top:.8rem;">Editar perfil</a>`;
    }
  }

  desenhar();
});
