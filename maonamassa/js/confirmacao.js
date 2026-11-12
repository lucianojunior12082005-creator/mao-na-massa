/* ==========================================================================
   confirmacao.js — exibe os dados do último pedido enviado
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const sessao = exigirLogin();
  if (!sessao) return;

  const recibo = document.getElementById("recibo-pedido");
  const id = Number(localStorage.getItem("mnm_ultimo_pedido"));
  const pedido = obterPedidos().find((p) => p.id === id);

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

  // esc() em tudo que veio de digitação do usuário
  recibo.innerHTML = `
    <dt>Cliente</dt><dd>${esc(pedido.nomeCliente)}</dd>
    <dt>Serviço solicitado</dt><dd>${esc(nomesServico[pedido.tipoServico] || pedido.tipoServico)}</dd>
    <dt>Profissional</dt><dd>${prof ? esc(prof.nome) : "Qualquer disponível"}</dd>
    <dt>Data e hora</dt><dd>${esc(quando)}</dd>
    <dt>Nível de urgência</dt><dd>${esc(pedido.urgenciaTexto)}</dd>
    <dt>Período preferido</dt><dd>${esc(pedido.periodo)}</dd>
    <dt>Serviços extras</dt><dd>${pedido.extras.length ? esc(pedido.extras.join(", ")) : "Nenhum"}</dd>
    <dt>Detalhes</dt><dd>${esc(pedido.detalhes) || "—"}</dd>
    <dt>Enviado em</dt><dd>${new Date(pedido.enviadoEm).toLocaleString("pt-BR")}</dd>
  `;
});
