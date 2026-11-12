/* ==========================================================================
   login.js — autenticação simulada via localStorage
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-login");
  if (!form) return;

  const campoLogin = document.getElementById("login-usuario");
  const campoSenha = document.getElementById("login-senha");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const contas = obterContas();

    if (contas.length === 0) {
      mostrarToast("Nenhum cadastro encontrado", "Crie uma conta antes de entrar.", "erro");
      setTimeout(() => (window.location.href = "erro.html?motivo=auth"), 900);
      return;
    }

    // procura a conta cujo login e senha batem (pode ser de cliente ou de profissional)
    const usuarioSalvo = contas.find((c) => c.login === campoLogin.value && c.senha === campoSenha.value);

    if (!usuarioSalvo) {
      const erroEl = document.getElementById("login-erro-geral");
      if (erroEl) erroEl.textContent = "Login ou senha incorretos.";
      mostrarToast("Não foi possível entrar", "Confira seu login e senha.", "erro");
      return;
    }

    localStorage.setItem(
      "mnm_sessao",
      JSON.stringify({
        id: usuarioSalvo.id,
        tipo: usuarioSalvo.tipo || "cliente",
        nome: usuarioSalvo.nome,
        login: usuarioSalvo.login,
        entrouEm: new Date().toISOString(),
      })
    );

    mostrarToast("Bem-vindo de volta!", `Login realizado como ${usuarioSalvo.nome.split(" ")[0]}.`);
    setTimeout(() => (window.location.href = "dashboard.html"), 700);
  });
});
