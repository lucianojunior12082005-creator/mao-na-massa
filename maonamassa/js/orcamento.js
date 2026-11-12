/* ==========================================================================
   orcamento.js — formulário de solicitação de orçamento (área restrita)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const sessao = exigirLogin();
  if (!sessao) return;

  // só clientes pedem orçamento; profissional vai para o próprio painel
  if (sessao.tipo === "profissional") {
    window.location.href = "dashboard.html";
    return;
  }

  const form = document.getElementById("form-orcamento");
  if (!form) return;

  const campoProf = document.getElementById("profissional");
  const campoServico = document.getElementById("tipo-servico");
  const campoDataHora = document.getElementById("data-hora");
  const urgencia = document.getElementById("urgencia");
  const valorUrgencia = document.getElementById("valor-urgencia");
  const rotulos = ["Sem pressa", "Esta semana", "Nos próximos 2 dias", "Hoje", "Agora — é urgente"];

  /* ---------- lista de profissionais no select ------------------------------ */
  PROFISSIONAIS.forEach((p) => {
    const opcao = document.createElement("option");
    opcao.value = p.id;
    opcao.textContent = `${p.nome} — ${p.especialidade} (${textoNota(p)}${p.nota == null ? "" : " ★"})`;
    campoProf.appendChild(opcao);
  });

  // vindo de profissionais.html?prof=3, já deixa o profissional e a categoria escolhidos
  const profUrl = obterProfissional(new URLSearchParams(window.location.search).get("prof"));
  if (profUrl) {
    campoProf.value = profUrl.id;
    campoServico.value = profUrl.categoria;
  }

  // se o usuário escolher um profissional, a categoria acompanha
  campoProf.addEventListener("change", () => {
    const p = obterProfissional(campoProf.value);
    if (p) campoServico.value = p.categoria;
  });

  // não permite agendar no passado
  const agora = new Date();
  agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
  campoDataHora.min = agora.toISOString().slice(0, 16);

  urgencia.addEventListener("input", () => {
    valorUrgencia.textContent = rotulos[urgencia.value - 1];
  });
  valorUrgencia.textContent = rotulos[urgencia.value - 1];

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const tipoServico = campoServico.value;
    const periodo = form.querySelector('input[name="periodo"]:checked');

    if (!tipoServico) {
      mostrarToast("Falta uma informação", "Selecione o tipo de serviço desejado.", "erro");
      return;
    }
    if (!periodo) {
      mostrarToast("Falta uma informação", "Escolha o período de preferência.", "erro");
      return;
    }
    const prof = obterProfissional(campoProf.value);
    if (prof && prof.categoria !== tipoServico) {
      mostrarToast("Serviço incompatível", `${prof.nome} atua em ${NOMES_CATEGORIA[prof.categoria]}. Ajuste o tipo de serviço.`, "erro");
      return;
    }

    const extras = Array.from(form.querySelectorAll('input[name="extra"]:checked')).map((c) => c.value);

    const pedidos = obterPedidos();
    const pedido = {
      id: Date.now(),
      clienteId: sessao.id,
      nomeCliente: sessao.nome,
      tipoServico,
      profissionalId: prof ? prof.id : null,
      dataHora: campoDataHora.value || null,
      urgencia: Number(urgencia.value),
      urgenciaTexto: rotulos[urgencia.value - 1],
      periodo: periodo.value,
      extras,
      detalhes: document.getElementById("detalhes").value.trim(),
      enviadoEm: new Date().toISOString(),
      status: "pendente",
      avaliacao: null,
    };

    pedidos.push(pedido);
    salvarPedidos(pedidos);
    localStorage.setItem("mnm_ultimo_pedido", String(pedido.id));
    mostrarToast("Solicitação enviada", "Já vamos te mostrar o resumo do pedido.");
    setTimeout(() => (window.location.href = "confirmacao.html"), 700);
  });
});
