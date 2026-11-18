/* ==========================================================================
   confirmacao.js — exibe os dados do último pedido enviado e imprime o recibo
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const sessao = exigirLogin();
  if (!sessao) return;

  const recibo = document.getElementById("recibo-pedido");
  const id = Number(localStorage.getItem("mnm_ultimo_pedido"));
  const pedido = obterPedidos().find((p) => p.id === id);

  // vem de orcamento.js logo após o envio; limpa o parâmetro para recarregar não imprimir de novo
  const deveImprimir = new URLSearchParams(window.location.search).get("imprimir") === "1";
  if (deveImprimir) history.replaceState(null, "", window.location.pathname);

  if (!pedido) {
    recibo.innerHTML = "<p>Nenhuma solicitação encontrada. Que tal pedir um orçamento agora?</p>";
    return;
  }

  const nomesServico = {
    limpeza: "Limpeza residencial",
    manutencao: "Manutenção geral",
    obras: "Pequenas obras e reparos",
  };

  const prof = obterProfissional(pedido.profissionalId);
  const quando = pedido.dataHora ? new Date(pedido.dataHora).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "A combinar";
  const extras = Array.isArray(pedido.extras) ? pedido.extras : [];

  // esc() em tudo que veio de digitação do usuário
  recibo.innerHTML = `
    <dt>Cliente</dt><dd>${esc(pedido.nomeCliente)}</dd>
    <dt>Serviço solicitado</dt><dd>${esc(pedido.nomeServico || nomesServico[pedido.tipoServico] || pedido.tipoServico)}</dd>
    <dt>Endereço</dt><dd>${pedido.endereco ? esc(`${pedido.endereco.rua}, ${pedido.endereco.complemento ? pedido.endereco.complemento + ", " : ""}${pedido.endereco.bairro} — ${pedido.endereco.cidade}/${pedido.endereco.uf} · CEP ${pedido.endereco.cep}`) : "Não informado"}</dd>
    <dt>Profissional</dt><dd>${prof ? esc(prof.nome) : "Qualquer disponível"}</dd>
    <dt>Data e hora</dt><dd>${esc(quando)}</dd>
    <dt>O profissional deve trazer os materiais?</dt><dd>${pedido.extraMaterial === "sim" ? "sim" : "Não"}</dd>
    <dt>Detalhes</dt><dd>${esc(pedido.detalhes) || "—"}</dd>
    <dt>Enviado em</dt><dd>${new Date(pedido.enviadoEm).toLocaleString("pt-BR")}</dd>
  `;

  /* ---------- impressão do recibo ------------------------------------------- */

  // na impressão, mostra só o recibo (esconde cabeçalho, rodapé e botão)
  const estiloImpressao = document.createElement("style");
  estiloImpressao.textContent = `
    @media print {
      .cabecalho, .rodape, .botao-imprimir { display: none !important; }
      body { background: #fff !important; }
    }
  `;
  document.head.appendChild(estiloImpressao);

  // botão para imprimir de novo quando quiser
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao botao-secundario botao-imprimir";
  botao.textContent = "Imprimir recibo";
  botao.addEventListener("click", () => window.print());
  recibo.insertAdjacentElement("afterend", botao);

  // impressão automática logo após o envio do pedido
  if (deveImprimir) {
    const imprimir = () => setTimeout(() => window.print(), 500);
    if (document.readyState === "complete") imprimir();
    else window.addEventListener("load", imprimir);
  }
});