/* ==========================================================================
   esqueci-senha.js — recuperação de senha em 2 etapas (simulada)
   Etapa 1: confere login + CPF + celular com a conta salva.
   Etapa 2: grava a nova senha. As máscaras (mascararCPF/mascararTelefone)
   vêm do cadastro.js, carregado antes nesta página.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const formConfirmar = document.getElementById("form-confirmar");
  const formNova = document.getElementById("form-nova-senha");
  if (!formConfirmar || !formNova) return;

  const campoLogin = document.getElementById("rec-login");
  const campoCPF = document.getElementById("rec-cpf");
  const campoCelular = document.getElementById("rec-celular");
  const erroGeral = document.getElementById("rec-erro-geral");
  const campoSenha = document.getElementById("nova-senha");
  const campoConfirmar = document.getElementById("nova-senha-confirmar");

  let contaEncontrada = null; // guarda quem passou na etapa 1

  campoCPF.addEventListener("input", () => { campoCPF.value = mascararCPF(campoCPF.value); });
  campoCelular.addEventListener("input", () => { campoCelular.value = mascararTelefone(campoCelular.value); });

  const soDigitos = (t) => String(t || "").replace(/\D/g, "");

  /* ---------- etapa 1: confirmar identidade --------------------------------------- */
  formConfirmar.addEventListener("submit", (e) => {
    e.preventDefault();

    const conta = obterContas().find(
      (c) =>
        c.login.toLowerCase() === campoLogin.value.trim().toLowerCase() &&
        soDigitos(c.cpf) === soDigitos(campoCPF.value) &&
        soDigitos(c.telefoneCelular) === soDigitos(campoCelular.value)
    );

    if (!conta) {
      // mensagem genérica de propósito: não revelamos QUAL dado está errado,
      // para ninguém descobrir se um login existe só tentando.
      erroGeral.textContent = "Não encontramos uma conta com esses dados. Confira e tente de novo.";
      mostrarToast("Dados não conferem", "Verifique login, CPF e celular.", "erro");
      return;
    }

    contaEncontrada = conta;
    erroGeral.textContent = "";
    formConfirmar.classList.add("oculto");
    formNova.classList.remove("oculto");
    document.getElementById("indicador-1").classList.remove("ativo");
    document.getElementById("indicador-2").classList.add("ativo");
    campoSenha.focus();
  });

  /* ---------- etapa 2: nova senha ---------------------------------------------------- */
  function estado(campo, valido, mensagem) {
    campo.classList.toggle("valido", valido);
    campo.classList.toggle("invalido", !valido);
    document.getElementById(campo.id + "-erro").textContent = valido ? "" : mensagem;
    return valido;
  }
  const validarSenha = () => estado(campoSenha, /^[A-Za-z]{8}$/.test(campoSenha.value), "A senha deve ter exatamente 8 letras.");
  const validarConfirmacao = () =>
    estado(campoConfirmar, campoConfirmar.value.length > 0 && campoConfirmar.value === campoSenha.value, "As senhas não coincidem.");

  campoSenha.addEventListener("input", () => { validarSenha(); if (campoConfirmar.value) validarConfirmacao(); });
  campoConfirmar.addEventListener("input", validarConfirmacao);

  formNova.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!contaEncontrada) return;
    if (![validarSenha(), validarConfirmacao()].every(Boolean)) {
      mostrarToast("Revise a senha", "Corrija os campos destacados.", "erro");
      return;
    }
    if (campoSenha.value === contaEncontrada.senha) {
      estado(campoSenha, false, "Escolha uma senha diferente da atual.");
      return;
    }

    const contas = obterContas();
    const alvo = contas.find((c) => c.login === contaEncontrada.login);
    alvo.senha = campoSenha.value;
    salvarContas(contas);

    mostrarToast("Senha alterada", "Agora é só entrar com a nova senha.");
    setTimeout(() => (window.location.href = "login.html"), 1100);
  });
});
