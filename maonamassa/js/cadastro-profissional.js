/* ==========================================================================
   cadastro-profissional.js — abas do cadastro + conta de PROFISSIONAL
   Reaproveita as funções de cadastro.js (máscaras, validarCPF, ViaCEP).
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const formCliente = document.getElementById("form-cadastro");
  const form = document.getElementById("form-profissional");
  if (!form || !formCliente) return;

  /* ---------- abas: mostra um formulário e esconde o outro --------------------- */
  const abas = document.querySelectorAll(".aba");
  function mostrarAba(nome) {
    formCliente.classList.toggle("oculto", nome !== "cliente");
    form.classList.toggle("oculto", nome !== "profissional");
    abas.forEach((aba) => {
      const ativa = aba.dataset.aba === nome;
      aba.classList.toggle("ativa", ativa);
      aba.setAttribute("aria-selected", ativa ? "true" : "false");
    });
  }
  abas.forEach((aba) => aba.addEventListener("click", () => mostrarAba(aba.dataset.aba)));
  if (window.location.hash === "#profissional") mostrarAba("profissional");

  /* ---------- campos ---------------------------------------------------------------- */
  const $ = (id) => document.getElementById("p-" + id);
  const campos = ["nome", "cpf", "cep", "rua", "bairro", "cidade", "uf", "telefone-fixo", "telefone-celular",
    "categoria", "especialidade", "anos", "preco", "unidade", "descricao", "login", "senha", "confirmar-senha"]
    .reduce((obj, id) => ({ ...obj, [id]: $(id) }), {});

  function estado(campo, valido, mensagem) {
    campo.classList.toggle("valido", valido);
    campo.classList.toggle("invalido", !valido);
    const erro = document.getElementById(campo.id + "-erro");
    if (erro) erro.textContent = valido ? "" : mensagem;
    return valido;
  }

  /* ---------- máscaras e CEP ------------------------------------------------------- */
  campos.cpf.addEventListener("input", () => { campos.cpf.value = mascararCPF(campos.cpf.value); });
  campos["telefone-fixo"].addEventListener("input", (e) => { e.target.value = mascararTelefone(e.target.value); });
  campos["telefone-celular"].addEventListener("input", (e) => { e.target.value = mascararTelefone(e.target.value); });
  campos.cep.addEventListener("input", () => { campos.cep.value = mascararCEP(campos.cep.value); });
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

  /* ---------- validações ------------------------------------------------------------ */
  const validar = {
    nome: () => estado(campos.nome, /^[A-Za-zÀ-ÖØ-öø-ÿ\s]{15,80}$/.test(campos.nome.value.trim()), "Use apenas letras, entre 15 e 80 caracteres."),
    cpf: () => estado(campos.cpf, validarCPF(campos.cpf.value), "CPF inválido — confira os números digitados."),
    cep: () => estado(campos.cep, campos.cep.value.replace(/\D/g, "").length === 8, "Informe um CEP com 8 dígitos."),
    celular: () => estado(campos["telefone-celular"], /^\(\+55\)\d{2}-\d{8,9}$/.test(campos["telefone-celular"].value), "Use o formato (+55)XX-XXXXXXXX."),
    fixo: () => {
      const f = campos["telefone-fixo"];
      if (f.value.replace(/\D/g, "").length === 0) return estado(f, true, "");
      return estado(f, /^\(\+55\)\d{2}-\d{8,9}$/.test(f.value), "Use o formato (+55)XX-XXXXXXXX.");
    },
    categoria: () => estado(campos.categoria, campos.categoria.value !== "", "Escolha uma categoria."),
    especialidade: () => estado(campos.especialidade, campos.especialidade.value.trim().length >= 3, "Informe sua especialidade (mín. 3 caracteres)."),
    anos: () => estado(campos.anos, campos.anos.value !== "" && +campos.anos.value >= 0 && +campos.anos.value <= 60, "Informe de 0 a 60 anos."),
    preco: () => estado(campos.preco, +campos.preco.value >= 10 && +campos.preco.value <= 5000, "Informe um preço entre R$ 10 e R$ 5.000."),
    descricao: () => estado(campos.descricao, campos.descricao.value.trim().length >= 20, "Escreva pelo menos 20 caracteres."),
    login: () => estado(campos.login, /^[A-Za-z]{6}$/.test(campos.login.value), "O login deve ter exatamente 6 letras."),
    senha: () => estado(campos.senha, /^[A-Za-z]{8}$/.test(campos.senha.value), "A senha deve ter exatamente 8 letras."),
    confirmar: () => estado(campos["confirmar-senha"], campos["confirmar-senha"].value.length > 0 && campos["confirmar-senha"].value === campos.senha.value, "As senhas não coincidem."),
  };

  campos.nome.addEventListener("blur", validar.nome);
  campos.cpf.addEventListener("blur", validar.cpf);
  campos.login.addEventListener("blur", validar.login);
  campos.senha.addEventListener("input", () => { validar.senha(); validar.confirmar(); });
  campos["confirmar-senha"].addEventListener("input", validar.confirmar);

  /* ---------- envio ------------------------------------------------------------------ */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const resultados = Object.values(validar).map((fn) => fn());
    if (resultados.includes(false)) {
      mostrarToast("Revise o formulário", "Alguns campos precisam de atenção antes de enviar.", "erro");
      return;
    }
    if (loginJaExiste(campos.login.value)) {
      estado(campos.login, false, "Esse login já está em uso. Escolha outro.");
      mostrarToast("Login indisponível", "Escolha outro login de 6 letras.", "erro");
      return;
    }

    salvarConta({
      id: Date.now(),
      tipo: "profissional",
      nome: campos.nome.value.trim(),
      cpf: campos.cpf.value,
      cep: campos.cep.value,
      rua: campos.rua.value,
      bairro: campos.bairro.value,
      cidade: campos.cidade.value,
      uf: campos.uf.value,
      telefoneFixo: campos["telefone-fixo"].value,
      telefoneCelular: campos["telefone-celular"].value,
      categoria: campos.categoria.value,
      especialidade: campos.especialidade.value.trim(),
      anos: Number(campos.anos.value),
      preco: Number(campos.preco.value),
      unidade: campos.unidade.value,
      descricao: campos.descricao.value.trim(),
      login: campos.login.value,
      senha: campos.senha.value,
      criadoEm: new Date().toISOString(),
    });
    mostrarToast("Perfil criado", "Você já aparece na lista de profissionais. Entre com seu login.");
    setTimeout(() => (window.location.href = "login.html"), 1100);
  });
});
