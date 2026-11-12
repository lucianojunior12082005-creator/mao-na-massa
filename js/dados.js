/* ==========================================================================
   dados.js — "banco de dados" simulado dos profissionais
   Como o projeto é só Front-End, os profissionais ficam num array JS.
   Cada objeto tem as mesmas chaves: assim um único código (profissionais.js)
   consegue listar, filtrar e ordenar todos eles.
   ========================================================================== */

const PROFISSIONAIS_FIXOS = [
  { id: 1, nome: "Roseli A.",   categoria: "limpeza",    especialidade: "Faxina residencial",       bairro: "Tijuca",       anos: 12, nota: 4.9, avaliacoes: 87,  preco: 120, unidade: "diária", descricao: "Faxina completa e organização de ambientes, com produtos próprios." },
  { id: 2, nome: "Marcos T.",   categoria: "manutencao", especialidade: "Elétrica residencial",     bairro: "Méier",        anos: 9,  nota: 4.9, avaliacoes: 64,  preco: 90,  unidade: "visita", descricao: "Instalações, troca de fiação e atendimento de emergência." },
  { id: 3, nome: "Juliana P.",  categoria: "obras",      especialidade: "Pintura e montagem",       bairro: "Madureira",    anos: 6,  nota: 4.7, avaliacoes: 41,  preco: 150, unidade: "diária", descricao: "Pintura de ambientes e montagem de móveis com acabamento limpo." },
  { id: 4, nome: "Cláudio R.",  categoria: "manutencao", especialidade: "Encanamento",              bairro: "Campo Grande", anos: 15, nota: 4.8, avaliacoes: 112, preco: 100, unidade: "visita", descricao: "Vazamentos, troca de torneiras, registros e desentupimento." },
  { id: 5, nome: "Edna S.",     categoria: "limpeza",    especialidade: "Limpeza pós-obra",         bairro: "Barra",        anos: 8,  nota: 4.6, avaliacoes: 33,  preco: 180, unidade: "diária", descricao: "Remoção de resíduos e limpeza pesada depois de reformas." },
  { id: 6, nome: "Paulo H.",    categoria: "obras",      especialidade: "Alvenaria e reparos",      bairro: "São Gonçalo",  anos: 20, nota: 4.8, avaliacoes: 95,  preco: 220, unidade: "diária", descricao: "Rebocos, pequenos muros, assentamento de piso e revestimento." },
  { id: 7, nome: "Tânia M.",    categoria: "limpeza",    especialidade: "Higienização de estofados",bairro: "Niterói",      anos: 5,  nota: 4.5, avaliacoes: 28,  preco: 140, unidade: "serviço",descricao: "Higienização de sofás, colchões e tapetes com equipamento profissional." },
  { id: 8, nome: "Rafael D.",   categoria: "manutencao", especialidade: "Ar-condicionado",          bairro: "Copacabana",   anos: 11, nota: 4.9, avaliacoes: 78,  preco: 160, unidade: "serviço",descricao: "Instalação, limpeza e manutenção preventiva de split." },
  { id: 9, nome: "Wagner L.",   categoria: "obras",      especialidade: "Marcenaria e montagem",    bairro: "Tijuca",       anos: 13, nota: 4.7, avaliacoes: 52,  preco: 130, unidade: "diária", descricao: "Montagem de guarda-roupas, cozinhas planejadas e pequenos reparos." },
];

/* Profissionais que se cadastraram no site entram na mesma lista dos fixos.
   Eles começam sem nota (null); a nota passa a ser a média das avaliações
   que os clientes dão nos pedidos concluídos. */
function profissionaisCadastrados() {
  let contas = [];
  let pedidos = [];
  try { contas = JSON.parse(localStorage.getItem("mnm_contas") || "[]"); } catch { /* ignora */ }
  try { pedidos = JSON.parse(localStorage.getItem("mnm_pedidos") || "[]"); } catch { /* ignora */ }

  return contas.filter((c) => c.tipo === "profissional").map((c) => {
    const notas = pedidos
      .filter((p) => p.profissionalId === c.id && p.avaliacao)
      .map((p) => p.avaliacao.nota);
    const media = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null;
    const [primeiro, ...resto] = c.nome.split(" ");
    return {
      id: c.id,
      nome: `${primeiro} ${resto.length ? resto[resto.length - 1][0] + "." : ""}`.trim(),
      categoria: c.categoria,
      especialidade: c.especialidade,
      bairro: c.bairro || c.cidade || "Rio de Janeiro",
      anos: c.anos,
      nota: media,
      avaliacoes: notas.length,
      preco: c.preco,
      unidade: c.unidade,
      descricao: c.descricao,
      novo: true,
    };
  });
}

const PROFISSIONAIS = [...PROFISSIONAIS_FIXOS, ...profissionaisCadastrados()];

function textoNota(p) {
  return p.nota == null ? "Novo" : p.nota.toFixed(1).replace(".", ",");
}

const NOMES_CATEGORIA = {
  limpeza: "Limpeza",
  manutencao: "Manutenção",
  obras: "Pequenas obras",
};

function obterProfissional(id) {
  return PROFISSIONAIS.find((p) => p.id === Number(id)) || null;
}


/* Cartão do profissional: usado na página Profissionais e na prévia do painel
   do próprio profissional, para os dois sempre ficarem idênticos. */
function cartaoProfissionalHTML(p, comBotao = true) {
  return `
      <article class="cartao-profissional">
        <span class="servico-tag">${NOMES_CATEGORIA[p.categoria]} · ${esc(p.especialidade)}</span>
        <h3>${esc(p.nome)}</h3>
        <p class="nota-profissional">
          ${p.nota == null
            ? "<strong>Novo na plataforma</strong>"
            : `<span class="estrelas" aria-hidden="true">${estrelasTexto(p.nota)}</span>
               <strong>${textoNota(p)}</strong> <small>(${p.avaliacoes} avaliações)</small>`}
        </p>
        <p>${esc(p.descricao)}</p>
        <p class="dica-campo">${p.anos} anos de experiência · atende em ${esc(p.bairro)}</p>
        <p class="preco">R$ ${p.preco} <small>/ ${p.unidade}</small></p>
        ${comBotao ? `<a class="botao botao-primario" href="orcamento.html?prof=${p.id}">Pedir orçamento</a>` : ""}
      </article>`;
}
