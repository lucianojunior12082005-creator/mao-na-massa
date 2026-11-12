# Mão na Massa — MVP Front-End

Portal de divulgação e captura de clientes para contratação de profissionais
autônomos de **limpeza, manutenção e pequenas obras**.

Projeto desenvolvido para a disciplina **Projeto de Desenvolvimento em Front-End**
(ADS — UNISUAM, 2026.1, Prof. Bruno Cezario).

> Projeto exclusivamente Front-End: toda persistência de dados é simulada com
> `localStorage`, sem back-end ou banco de dados.
> As senhas ficam salvas em texto puro no navegador apenas porque o login é simulado;
> em um sistema real elas seriam protegidas no servidor.

## Tecnologias

- HTML5 semântico
- CSS3 (variáveis CSS, grid, flexbox, media queries)
- JavaScript puro (Vanilla JS)
- API pública [ViaCEP](https://viacep.com.br/) para preenchimento automático de endereço

## Estrutura de pastas

```
maonamassa/
├── index.html             # Landing page (catálogo + menu com submenus)
├── cadastro.html          # Cadastro com abas: "Quero contratar" (cliente) e "Quero oferecer serviço" (profissional)
├── login.html             # Login (compara com localStorage)
├── esqueci-senha.html     # Recuperação de senha em 2 etapas (simulada)
├── dashboard.html         # Área restrita — painel do cliente ou do profissional
├── editar-perfil.html     # Edição dos dados da própria conta (ícone ao lado do nome)
├── orcamento.html         # Formulário de solicitação (range, select, radio, checkbox)
├── confirmacao.html       # Exibição dos dados enviados no formulário
├── profissionais.html     # Catálogo com busca, filtros e ordenação
├── erro.html              # Página de erro personalizada (404 / falha de autenticação)
├── 404.html               # Cópia de erro.html para hospedagens estáticas
├── css/
│   ├── style.css          # estilos gerais, tema escuro e responsividade
│   └── perfil.css         # estilos só da tela Editar perfil
├── js/
│   ├── main.js                    # menu mobile, toasts, modal, acessibilidade, sessão e contas
│   ├── cadastro.js                # validações do cadastro de cliente + ViaCEP + máscaras
│   ├── cadastro-profissional.js   # abas do cadastro + conta de profissional
│   ├── login.js                   # autenticação simulada
│   ├── esqueci-senha.js           # recuperação de senha
│   ├── editar-perfil.js           # edição de perfil, troca de senha e exclusão de conta
│   ├── orcamento.js               # formulário de solicitação de orçamento
│   ├── confirmacao.js             # resumo do pedido enviado
│   ├── dados.js                   # profissionais (fixos + cadastrados) e cartão do profissional
│   ├── profissionais.js           # busca, filtros e ordenação
│   └── dashboard.js               # histórico, status, avaliação e mural do profissional
└── assets/                # imagens e ícones (executivo.png = avatar padrão)
```

## Recursos extras

- **Profissionais** (`profissionais.html`): catálogo com busca por texto, filtro por categoria e nota mínima, ordenação (nota, preço, experiência) e botão "Pedir orçamento" que já preenche o formulário
- **Histórico de pedidos** no painel: lista de solicitações com status (aguardando, concluído, cancelado) e resumo em números
- **Avaliação do atendimento** com nota de 1 a 5 estrelas e comentário
- **Recuperação de senha** (`esqueci-senha.html`): confirma a identidade com login, CPF e celular e depois grava a nova senha (simulado, sem envio de e-mail)
- **Painel do profissional**: aceitar ou recusar pedidos, concluir serviços, mural de pedidos abertos da categoria (clientes que não escolheram profissional) e edição do perfil (`editar-perfil.html`)
- **Editar perfil** (`editar-perfil.html`): ícone de perfil ao lado do nome no menu; cliente e profissional alteram nome, CPF, login, endereço (CEP), telefones e senha, e podem excluir a conta
- Menu que muda conforme o usuário está logado ou não
- `404.html` para páginas inexistentes; textos digitados pelo usuário são escapados antes de ir para a tela

## Fluxos

**Público:** Landing Page → Cadastro → Login → Erro (404/401)
**Restrito (após login):** Dashboard → Solicitar orçamento → Confirmação

## Validações implementadas

- Nome completo: 15–80 caracteres, apenas letras
- CPF: cálculo real dos dígitos verificadores
- CEP: consulta à API ViaCEP com preenchimento automático de rua, bairro, cidade e UF
- Telefones: máscara `(+55)XX-XXXXXXXX`
- Login: exatamente 6 letras · Senha: exatamente 8 letras · Confirmação idêntica à senha
- Persistência do cadastro em `localStorage` como objeto JSON
- Login validado contra os dados salvos; nome do usuário mantido no topo entre as páginas internas

## Recursos de UX

- Nenhum uso de `window.alert()` — feedback via toasts e modal de confirmação
- Responsivo em Mobile (375px+), Tablet (768px+) e Desktop (1024px+)
- Menu fixo no topo com submenus e botão de logout na área restrita

## Desafio Plus — Acessibilidade

Barra de ferramentas com:
- Alternância entre tema claro e tema escuro (alto contraste, texto escuro sobre as cores claras do tema escuro)
- Botões A+ / A- para aumentar/diminuir a fonte do conteúdo, sem quebrar o layout
- Respeita `prefers-reduced-motion` (sem animações para quem pediu menos movimento)
- Barra de acessibilidade presente em todas as páginas, inclusive 404 e erro

## Como rodar

Basta abrir `index.html` no navegador, ou publicar a pasta em GitHub Pages, Vercel ou Netlify.

## Integrantes

- Nome 1
- Nome 2
- Nome 3
- Nome 4
