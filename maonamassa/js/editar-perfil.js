/* ==========================================================================
   editar-perfil.js — cliente e profissional editam a PRÓPRIA conta
   Usa as funções do main.js (sessão, contas, toast, modal) e do cadastro.js
   (mascararCEP, mascararTelefone, buscarEnderecoPorCEP), carregados antes.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const sessao = exigirLogin();
  if (!sessao) return;

  const form = document.getElementById("form-editar");
  const conta = obterContas().find((c) => c.id === sessao.id);
  if (!form) return;
  if (!conta) {
    localStorage.removeItem("mnm_sessao");
    window.location.replace("erro.html?motivo=auth");
    return;
  }

  const ehProfissional = conta.tipo === "profissional";
  const $ = (id) => document.getElementById(id);
  const ids = ["nome", "cpf", "login", "cep", "uf", "rua", "bairro", "cidade",
    "telefone-fixo", "telefone-celular", "categoria", "especialidade", "anos",
    "preco", "unidade", "descricao", "senha", "confirmar-senha"];
  const campos = {};
  ids.forEach((id) => (campos[id] = $(id)));

  /* ---------- cabeçalho da página e preenchimento -------------------------- */
  $("perfil-nome").textContent = conta.nome.split(" ")[0];
  $("perfil-tipo").textContent = ehProfissional ? "Profissional" : "Cliente";
  $("perfil-login").textContent = conta.login;
  if (ehProfissional) $("bloco-servico").classList.remove("oculto");

  campos.nome.value = conta.nome;
  campos.cpf.value = conta.cpf;
  campos.login.value = conta.login;
  campos.cep.value = conta.cep || "";
  campos.uf.value = conta.uf || "";
  campos.rua.value = conta.rua || "";
  campos.bairro.value = conta.bairro || "";
  campos.cidade.value = conta.cidade || "";
  campos["telefone-fixo"].value = conta.telefoneFixo || "";
  campos["telefone-celular"].value = conta.telefoneCelular || "";
  if (ehProfissional) {
    campos.categoria.value = conta.categoria;
    campos.especialidade.value = conta.especialidade;
    campos.anos.value = conta.anos;
    campos.preco.value = conta.preco;
    campos.unidade.value = conta.unidade;
    campos.descricao.value = conta.descricao;
  }

  // se a imagem não carregar, o texto alternativo aparece e o layout não quebra
  const foto = $("perfil-avatar");
  foto.addEventListener("error", () => { foto.style.visibility = "hidden"; }, { once: true });

  /* ---------- helpers de validação --------------------------------------------- */
  function estado(campo, valido, mensagem) {
    campo.classList.toggle("valido", valido);
    campo.classList.toggle("invalido", !valido);
    const erro = $(campo.id + "-erro");
    if (erro) erro.textContent = valido ? "" : mensagem;
    return valido;
  }
  const telefoneOk = /^\(\+55\)\d{2}-\d{8,9}$/;

  /* ---------- máscaras e CEP ----------------------------------------------------- */
  campos["telefone-fixo"].addEventListener("input", (e) => { e.target.value = mascararTelefone(e.target.value); });
  campos["telefone-celular"].addEventListener("input", (e) => { e.target.value = mascararTelefone(e.target.value); });
  campos.cep.addEventListener("input", () => { campos.cep.value = mascararCEP(campos.cep.value); });
  campos.cpf.addEventListener("input", () => { campos.cpf.value = mascararCPF(campos.cpf.value); });

  campos.cep.addEventListener("blur", async () => {
    const cepLimpo = campos.cep.value.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;
    try {
      const dados = await buscarEnderecoPorCEP(cepLimpo);
      if (dados.erro) { estado(campos.cep, false, "CEP não encontrado."); return; }
      campos.rua.value = dados.logradouro || "";
      campos.bairro.value = dados.bairro || "";
      campos.cidade.value = dados.localidade || "";
      campos.uf.value = dados.uf || "";
      estado(campos.cep, true, "");
    } catch {
      estado(campos.cep, false, "Não foi possível consultar o CEP agora.");
    }
  });

  /* ---------- salvar ---------------------------------------------------------------- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const fixo = campos["telefone-fixo"];
    const trocaSenha = campos.senha.value !== "" || campos["confirmar-senha"].value !== "";

    const loginEmUso = obterContas().some(
      (c) => c.id !== sessao.id && c.login.toLowerCase() === campos.login.value.toLowerCase()
    );

    const resultados = [
      estado(campos.nome, /^[A-Za-zÀ-ÖØ-öø-ÿ\s]{15,80}$/.test(campos.nome.value.trim()), "Use apenas letras, entre 15 e 80 caracteres."),
      estado(campos.cpf, validarCPF(campos.cpf.value), "CPF inválido — confira os números digitados."),
      /^[A-Za-z]{6}$/.test(campos.login.value)
        ? estado(campos.login, !loginEmUso, "Esse login já está em uso. Escolha outro.")
        : estado(campos.login, false, "O login deve ter exatamente 6 letras."),
      estado(campos.cep, campos.cep.value.replace(/\D/g, "").length === 8 && campos.rua.value !== "", "Informe um CEP válido."),
      fixo.value.replace(/\D/g, "").length === 0 ? estado(fixo, true, "") : estado(fixo, telefoneOk.test(fixo.value), "Use o formato (+55)XX-XXXXXXXX."),
      estado(campos["telefone-celular"], telefoneOk.test(campos["telefone-celular"].value), "Use o formato (+55)XX-XXXXXXXX."),
    ];

    if (ehProfissional) {
      resultados.push(
        estado(campos.especialidade, campos.especialidade.value.trim().length >= 3, "Informe sua especialidade (mín. 3 caracteres)."),
        estado(campos.anos, campos.anos.value !== "" && +campos.anos.value >= 0 && +campos.anos.value <= 60, "Informe de 0 a 60 anos."),
        estado(campos.preco, +campos.preco.value >= 10 && +campos.preco.value <= 5000, "Informe um preço entre R$ 10 e R$ 5.000."),
        estado(campos.descricao, campos.descricao.value.trim().length >= 20, "Escreva pelo menos 20 caracteres.")
      );
    }

    if (trocaSenha) {
      resultados.push(
        estado(campos.senha, /^[A-Za-z]{8}$/.test(campos.senha.value), "A senha deve ter exatamente 8 letras."),
        estado(campos["confirmar-senha"], campos["confirmar-senha"].value === campos.senha.value, "As senhas não coincidem.")
      );
    }

    if (resultados.includes(false)) {
      mostrarToast("Revise o formulário", "Alguns campos precisam de atenção.", "erro");
      return;
    }

    const contas = obterContas();
    const alvo = contas.find((c) => c.id === sessao.id);
    Object.assign(alvo, {
      nome: campos.nome.value.trim(),
      cpf: campos.cpf.value,
      login: campos.login.value,
      cep: campos.cep.value,
      rua: campos.rua.value,
      bairro: campos.bairro.value,
      cidade: campos.cidade.value,
      uf: campos.uf.value,
      telefoneFixo: fixo.value,
      telefoneCelular: campos["telefone-celular"].value,
    });
    if (trocaSenha) alvo.senha = campos.senha.value;
    if (ehProfissional) {
      Object.assign(alvo, {
        categoria: campos.categoria.value,
        especialidade: campos.especialidade.value.trim(),
        anos: Number(campos.anos.value),
        preco: Number(campos.preco.value),
        unidade: campos.unidade.value,
        descricao: campos.descricao.value.trim(),
      });
    }
    salvarContas(contas);

    // mantém a sessão (nome no topo e login) em dia com a conta editada
    try {
      const sessaoAtual = JSON.parse(localStorage.getItem("mnm_sessao") || "null");
      if (sessaoAtual) {
        sessaoAtual.nome = alvo.nome;
        sessaoAtual.login = alvo.login;
        localStorage.setItem("mnm_sessao", JSON.stringify(sessaoAtual));
      }
    } catch { /* ignora */ }

    // pedidos guardam uma cópia do nome do cliente: atualiza para não ficar o nome antigo
    if (!ehProfissional) {
      const pedidos = obterPedidos();
      pedidos.forEach((p) => { if (p.clienteId === sessao.id) p.nomeCliente = alvo.nome; });
      salvarPedidos(pedidos);
    }

    mostrarToast("Perfil atualizado", "Suas alterações foram salvas.");
    setTimeout(() => (window.location.href = "dashboard.html"), 900);
  });

  /* ---------- excluir conta ----------------------------------------------------------- */
  $("botao-excluir").addEventListener("click", async () => {
    const ok = await confirmarAcao({
      titulo: "Excluir conta",
      mensagem: "Tem certeza? Sua conta será apagada e essa ação não pode ser desfeita.",
      textoConfirmar: "Excluir",
      textoCancelar: "Voltar",
    });
    if (!ok) return;
    salvarContas(obterContas().filter((c) => c.id !== sessao.id));
    localStorage.removeItem("mnm_sessao");
    mostrarToast("Conta excluída", "Sentiremos sua falta.");
    setTimeout(() => (window.location.href = "index.html"), 900);
  });
});
