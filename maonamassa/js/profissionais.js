/* ==========================================================================
   profissionais.js — listagem com busca, filtros e ordenação
   Ideia central: a tela é sempre DESENHADA A PARTIR DOS DADOS.
   Toda vez que o usuário mexe em um filtro, rodamos: filtrar -> ordenar -> desenhar.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const lista = document.getElementById("lista-profissionais");
  if (!lista) return;

  // quem oferece serviço não compara nem pede orçamento: o perfil dele
  // já aparece na prévia do painel, então voltamos para lá
  const sessao = obterSessao();
  if (sessao && sessao.tipo === "profissional") {
    window.location.replace("dashboard.html");
    return;
  }

  const campoBusca = document.getElementById("busca");
  const campoCategoria = document.getElementById("filtro-categoria");
  const campoNota = document.getElementById("filtro-nota");
  const campoOrdem = document.getElementById("ordenar");
  const contador = document.getElementById("contador");

  // permite chegar aqui já filtrado: profissionais.html?categoria=limpeza
  const params = new URLSearchParams(window.location.search);
  if (params.get("categoria")) campoCategoria.value = params.get("categoria");

  function normalizar(texto) {
    // tira acentos e põe em minúsculas: "Manutenção" casa com "manutencao"
    return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  function filtrar() {
    const termo = normalizar(campoBusca.value.trim());
    const categoria = campoCategoria.value;
    const notaMin = parseFloat(campoNota.value);

    return PROFISSIONAIS.filter((p) => {
      const texto = normalizar(`${p.nome} ${p.bairro} ${p.especialidade} ${NOMES_CATEGORIA[p.categoria]}`);
      return (
        (!termo || texto.includes(termo)) &&
        (!categoria || p.categoria === categoria) &&
        (p.nota || 0) >= notaMin
      );
    });
  }

  function ordenar(itens) {
    const criterios = {
      "nota": (a, b) => (b.nota || 0) - (a.nota || 0) || b.avaliacoes - a.avaliacoes,
      "preco-asc": (a, b) => a.preco - b.preco,
      "preco-desc": (a, b) => b.preco - a.preco,
      "experiencia": (a, b) => b.anos - a.anos,
    };
    return itens.sort(criterios[campoOrdem.value]);
  }

  function desenhar() {
    const resultado = ordenar(filtrar());
    contador.textContent =
      resultado.length === 1 ? "1 profissional encontrado" : `${resultado.length} profissionais encontrados`;
    lista.innerHTML = resultado.length
      ? resultado.map((p) => cartaoProfissionalHTML(p)).join("")
      : `<p class="dica-campo">Nenhum profissional com esses filtros. Tente ampliar a busca.</p>`;
  }

  [campoBusca, campoCategoria, campoNota, campoOrdem].forEach((el) => {
    el.addEventListener("input", desenhar);
  });

  desenhar();
});
