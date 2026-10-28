/* ==========================================================================
   cadastro.js — validações do formulário de cadastro de cliente
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-cadastro");
  if (!form) return;

  const campos = {
    nome: document.getElementById("nome"),
    cpf: document.getElementById("cpf"),
    cep: document.getElementById("cep"),
    rua: document.getElementById("rua"),
    bairro: document.getElementById("bairro"),
    cidade: document.getElementById("cidade"),
    uf: document.getElementById("uf"),
    telefoneFixo: document.getElementById("telefone-fixo"),
    telefoneCelular: document.getElementById("telefone-celular"),
    login: document.getElementById("login"),
    senha: document.getElementById("senha"),
    confirmarSenha: document.getElementById("confirmar-senha"),
  };

  /* ---------- máscaras em tempo real ------------------------------------- */
  campos.cpf.addEventListener("input", () => {
    campos.cpf.value = mascararCPF(campos.cpf.value);
    if (campos.cpf.value.replace(/\D/g, "").length === 11) {
      validarCampoCPF();
    } else {
      limparEstadoCampo(campos.cpf); // ainda digitando: não mostra erro
    }
  });
  campos.cpf.addEventListener("blur", () => {
    if (campos.cpf.value.length) validarCampoCPF();
  });

  campos.telefoneFixo.addEventListener("input", () => {
    campos.telefoneFixo.value = mascararTelefone(campos.telefoneFixo.value);
  });
  campos.telefoneCelular.addEventListener("input", () => {
    campos.telefoneCelular.value = mascararTelefone(campos.telefoneCelular.value);
  });

  campos.cep.addEventListener("input", () => {
    delete campos.cep.dataset.naoEncontrado; // CEP mudou: vale consultar de novo
  });

  campos.cep.addEventListener("blur", async () => {
    const cepLimpo = campos.cep.value.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;
    try {
      const dados = await buscarEnderecoPorCEP(cepLimpo);
      if (dados.erro) {
        campos.cep.dataset.naoEncontrado = "1";
        mostrarErroCampo(campos.cep, "CEP não encontrado.");
        return;
      }
      campos.rua.value = dados.logradouro || "";
      campos.bairro.value = dados.bairro || "";
      campos.cidade.value = dados.localidade || "";
      campos.uf.value = dados.uf || "";
      limparErroCampo(campos.cep);
      mostrarToast("Endereço encontrado", "Rua, bairro, cidade e UF preenchidos automaticamente.");
    } catch (erro) {
      mostrarErroCampo(campos.cep, "Não foi possível consultar o CEP agora.");
    }
  });

  /* ---------- validações em tempo real ------------------------------------ */
  campos.nome.addEventListener("blur", validarCampoNome);
  campos.login.addEventListener("blur", validarCampoLogin);
  campos.senha.addEventListener("input", () => {
    validarCampoSenha();
    validarCampoConfirmacao();
  });
  campos.confirmarSenha.addEventListener("input", validarCampoConfirmacao);

  function validarCampoNome() {
    const regexNome = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]{15,80}$/;
    const valido = regexNome.test(campos.nome.value.trim());
    exibirEstado(campos.nome, valido, "Use apenas letras, entre 15 e 80 caracteres.");
    return valido;
  }

  function validarCampoCPF() {
    const valido = validarCPF(campos.cpf.value);
    exibirEstado(campos.cpf, valido, "CPF inválido — confira os números digitados.");
    return valido;
  }

  function validarCampoCEP() {
    if (campos.cep.dataset.naoEncontrado === "1") {
      exibirEstado(campos.cep, false, "CEP não encontrado.");
      return false;
    }
    const valido = campos.cep.value.replace(/\D/g, "").length === 8;
    exibirEstado(campos.cep, valido, "Informe um CEP com 8 dígitos.");
    return valido;
  }

  function validarCampoTelefone(campo, obrigatorio) {
    const digitos = campo.value.replace(/\D/g, "");
    if (!obrigatorio && digitos.length === 0) { limparErroCampo(campo); return true; }
    const valido = /^\(\+55\)\d{2}-\d{8,9}$/.test(campo.value);
    exibirEstado(campo, valido, "Use o formato (+55)XX-XXXXXXXX.");
    return valido;
  }

  function validarCampoLogin() {
    const valido = /^[A-Za-z]{6}$/.test(campos.login.value);
    exibirEstado(campos.login, valido, "O login deve ter exatamente 6 letras.");
    return valido;
  }

  function validarCampoSenha() {
    const valido = /^[A-Za-z]{8}$/.test(campos.senha.value);
    exibirEstado(campos.senha, valido, "A senha deve ter exatamente 8 letras.");
    return valido;
  }

  function validarCampoConfirmacao() {
    const valido = campos.confirmarSenha.value.length > 0 && campos.confirmarSenha.value === campos.senha.value;
    exibirEstado(campos.confirmarSenha, valido, "As senhas não coincidem.");
    return valido;
  }

  function exibirEstado(campo, valido, mensagem) {
    campo.classList.toggle("valido", valido);
    campo.classList.toggle("invalido", !valido);
    const erroEl = document.getElementById(campo.id + "-erro");
    if (erroEl) erroEl.textContent = valido ? "" : mensagem;
  }
  function limparEstadoCampo(campo) {
    campo.classList.remove("valido", "invalido");
    const erroEl = document.getElementById(campo.id + "-erro");
    if (erroEl) erroEl.textContent = "";
  }
  function mostrarErroCampo(campo, mensagem) { exibirEstado(campo, false, mensagem); }
  function limparErroCampo(campo) { exibirEstado(campo, true, ""); }

  /* ---------- submissão ---------------------------------------------------- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const validacoes = [
      validarCampoNome(),
      validarCampoCPF(),
      validarCampoCEP(),
      validarCampoTelefone(campos.telefoneFixo, false),
      validarCampoTelefone(campos.telefoneCelular, true),
      validarCampoLogin(),
      validarCampoSenha(),
      validarCampoConfirmacao(),
    ];

    if (validacoes.includes(false)) {
      mostrarToast("Revise o formulário", "Alguns campos precisam de atenção antes de enviar.", "erro");
      return;
    }

    const usuario = {
      nome: campos.nome.value.trim(),
      cpf: campos.cpf.value,
      cep: campos.cep.value,
      rua: campos.rua.value,
      bairro: campos.bairro.value,
      cidade: campos.cidade.value,
      uf: campos.uf.value,
      telefoneFixo: campos.telefoneFixo.value,
      telefoneCelular: campos.telefoneCelular.value,
      login: campos.login.value,
      senha: campos.senha.value,
      criadoEm: new Date().toISOString(),
    };

    localStorage.setItem("mnm_usuario", JSON.stringify(usuario));
    mostrarToast("Cadastro concluído", "Agora é só entrar com seu login e senha.");
    setTimeout(() => (window.location.href = "login.html"), 1000);
  });
});

/* ---------- máscaras -------------------------------------------------------- */
function mascararCPF(valor) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function mascararTelefone(valor) {
  // Remove o prefixo "(+55)" já aplicado antes de ler os dígitos; senão o "55" vira DDD
  const semPrefixo = valor.replace(/^\(\+55\)?/, "");
  const digitos = semPrefixo.replace(/\D/g, "").slice(0, 11);
  if (digitos.length <= 2) return digitos.length ? `(+55)${digitos}` : "";
  const ddd = digitos.slice(0, 2);
  const numero = digitos.slice(2);
  return `(+55)${ddd}-${numero}`;
}

/* ---------- validação real do CPF (dígitos verificadores) ------------------- */
function validarCPF(cpfFormatado) {
  const cpf = cpfFormatado.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i], 10) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf[9], 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i], 10) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf[10], 10)) return false;

  return true;
}

/* ---------- integração com a API ViaCEP -------------------------------------- */
async function buscarEnderecoPorCEP(cepLimpo) {
  const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
  if (!resposta.ok) throw new Error("Falha na consulta de CEP");
  return resposta.json();
}