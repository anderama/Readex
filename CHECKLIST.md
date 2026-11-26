# Checklist de requisitos

Cruzamento de cada item do documento "Aplicação Readex: Sistema para Gestão de Leituras Pessoais" com onde ele foi implementado.

Legenda: ✅ atendido · 🟡 parcial · ❌ não atendido

## Objetivo geral (stack)

| Requisito | Status | Onde / justificativa |
|---|---|---|
| Front-end reativo com Vue.js 3, componentes, Vue Router e consumo da API REST | ✅ | `apps/web` (Composition API em todos os componentes, `src/router/index.ts`, `src/services/http.ts`) |
| API REST própria em Node.js + TypeScript com Fastify | ✅ | `apps/api/src/app.ts` e `src/modules/*` |
| PostgreSQL com Prisma ORM | ✅ | `apps/api/prisma/schema.prisma`; em dev, PostgreSQL 17 embutido |
| Deploy: front na Vercel, back + banco no Render | 🟡 | Configuração pronta (`apps/web/vercel.json`, `render.yaml`) e builds testados. A publicação precisa ser feita com as contas do aluno |
| Git/GitHub com histórico de commits | 🟡 | Repositório Git criado em `readex/`. Falta criar o repositório no GitHub e enviar os commits |

## Regras de negócio

### Catálogo de livros

| Requisito | Status | Onde |
|---|---|---|
| Catálogo de livros para consulta | ✅ | `GET /api/books`; tela Explorar |
| Cada livro com título, autor, gênero, editora e ano, páginas, sinopse e capa | ✅ | Modelo `Book`; 24 livros no seed (11 com capa real do Figma, os outros com capa tipográfica) |
| Detalhes com nota média, gêneros, sinopse, informações técnicas e resenhas da comunidade | ✅ | `/livros/:slug`, aba Detalhes ("Sobre o livro" + "Resenhas da comunidade") |
| A partir dos detalhes, adicionar à estante ou avaliar | ✅ | Botão de status (Quero ler / Lendo agora / Concluído) e botão "Avaliar" na página do livro |

### Avaliações e resenhas

| Requisito | Status | Onde |
|---|---|---|
| Nota de 1 a 5 estrelas | ✅ | `StarRating`, `PUT /api/books/:id/review` (validação 1–5) |
| Resenha em texto livre associada à avaliação | ✅ | `/livros/:slug/escrever-resenha` (até 1.000 caracteres, spoiler, tags) |
| Resenha exibe avatar e nome, data, nota em estrelas e texto | ✅ | `components/books/ReviewCard.vue` |
| Avaliação sem texto mostra "Sem comentário" | ✅ | `ReviewCard`, `PostCard` e lista de resenhas do perfil |
| Nota média recalculada a cada nova avaliação | ✅ | `recomputeAverage` em `modules/reviews/reviews.routes.ts` (também ao excluir avaliação ou conta) |

### Progresso de leitura

| Requisito | Status | Onde |
|---|---|---|
| Registrar quantas páginas já leu | ✅ | Modal "Atualizar progresso" (por página ou %), `POST /api/shelf/:id/progress` |
| Exibir páginas lidas / total, restantes e % | ✅ | Início, página do livro, estante, perfil (`progressOf` em `lib/serializers.ts`) |
| 0% mostra "Você ainda não começou" | ✅ | Início, estante e página do livro |
| 100% move para "Concluído" automaticamente | ✅ | `updateProgress` em `modules/shelf/shelf.service.ts` |

### Minha estante

| Requisito | Status | Onde |
|---|---|---|
| Adicionar livros à estante | ✅ | `ShelfStatusButton` em Explorar, sugestões, livro e perfis de outros leitores |
| Status Quero ler, Lendo agora e Concluído | ✅ | Enum `ShelfStatus`; `/estante` com abas e grupos |
| Um livro em um status por vez | ✅ | `@@unique([userId, bookId])` + upsert |
| Estante vazia com ilustração, "Sua estante está vazia. Adicione um livro!" e botão | ✅ | `pages/ShelfPage.vue` (mascote + botão "Adicionar livro") |

### Metas de leitura

| Requisito | Status | Onde |
|---|---|---|
| Definir meta mensal de livros | ✅ | `/progresso` › "Editar meta", `PUT /api/goals/current` |
| Andamento em quantidade e % | ✅ | Início ("5 de 8 livros" + barra 63%) e Metas |
| Ao atingir: barra completa e "Meta atingida!" | ✅ | Início, Metas e modal "Terminei o livro"; também gera notificação |

### Comunidade e feed social

| Requisito | Status | Onde |
|---|---|---|
| Feed com atividades recentes de outros leitores (avaliações e resenhas) | ✅ | `/comunidade` e "Da comunidade" no Início (`GET /api/feed`) |
| Publicação com avatar, nome, atividade e trecho | ✅ | `PostCard`, `ActivityItem` |
| Interagir com as publicações | ✅ | Curtir resenhas e discussões, responder discussões, copiar link, seguir leitores |

### Busca e recomendações

| Requisito | Status | Onde |
|---|---|---|
| Busca por título, autor ou gênero | ✅ | `/explorar` (sem acento e sem diferenciar maiúsculas; também ISBN) |
| Filtrar resultados por gênero | ✅ | `GenreFilter` (vários gêneros) + "Até 350 págs." |
| Busca sem resultado com estado vazio e orientação | ✅ | Mascote, mensagem e botão "Limpar busca e filtros" |
| "Sugerido para você" com adicionar direto à estante | ✅ | Coluna lateral do Início e Explorar (gêneros favoritos do onboarding + estante) |

### Autenticação e conta

| Requisito | Status | Onde |
|---|---|---|
| Cadastro com nome, username, e-mail, senha e confirmação | ✅ | `/criar-conta` |
| Aceitar os termos de uso | ✅ | Caixa obrigatória + modal com os termos (validado também na API) |
| Login por e-mail e senha com "Lembrar-se" | ✅ | `/entrar` ("Manter conectado": token de 30 dias) |
| Recuperação: "Esqueci minha senha", código por e-mail, nova senha | 🟡 | Fluxo completo com código real de 6 dígitos (hash, validade, tentativas). O envio do e-mail é simulado: o código aparece na tela e no terminal |
| Só usuários autenticados acessam estante, progresso, metas, avaliações e perfil | ✅ | `app.authenticate` em todas as rotas privadas + guarda do Vue Router |

### Perfil e configurações

| Requisito | Status | Onde |
|---|---|---|
| Ver e editar perfil (nome, username e avatar) | ✅ | `/perfil`, `/perfil/editar` (foto reduzida para 256 px no navegador) |
| Estatísticas: livros lidos, avaliações feitas, meta atual | ✅ | Cabeçalho do perfil |
| Configurações com sair (logout) | ✅ | `/configuracoes` › "Sair da conta" |

### Persistência de operações

| Requisito | Status | Onde |
|---|---|---|
| Sessão ativa após atualizar a página enquanto o token for válido | ✅ | Token no `localStorage` + `session.restore()` com `GET /api/auth/me` |
| Progresso e estante salvos no banco | ✅ | `ShelfItem`, `ReadingLog` |
| Avaliações e resenhas vinculadas ao usuário e ao livro | ✅ | `Review` (`userId`, `bookId`) |
| Meta mensal e histórico de leituras concluídas entre sessões | ✅ | `Goal`, `ShelfItem.finishedAt`, estatísticas |

## Frameworks e bibliotecas

| Requisito | Status | Onde / justificativa |
|---|---|---|
| Vue.js 3 (Composition API) | ✅ | `<script setup>` em todos os componentes |
| Vite | ✅ | `apps/web/vite.config.ts` |
| Vue Router com rotas protegidas | ✅ | `router.beforeEach` |
| Tailwind CSS | ✅ | Tailwind 4 com tokens do Figma em `styles/main.css` |
| Node.js + TypeScript | ✅ | `apps/api` (strict) |
| Fastify | ✅ | Fastify 5 |
| Prisma ORM | ✅ | Prisma 6 |
| PostgreSQL | ✅ | PostgreSQL 17 |
| JWT | ✅ | `@fastify/jwt`, header `Authorization: Bearer` |
| bcrypt | ✅ | `bcryptjs` (mesmo algoritmo bcrypt, sem compilação nativa, para rodar em qualquer máquina) |
| Monorepo com arquitetura em camadas | ✅ | npm workspaces; rotas (HTTP + validação Zod) → services (regras) → Prisma (dados) |
| Fonte Poppins | ✅ | `@fontsource/poppins` local |
| Paleta creme (#FFF6D9), âmbar (#FCA311) e azul-marinho (#13213C) | 🟡 | O design final aprovado no Figma trocou para a paleta MP096 (laranja, preto e vermelho alaranjado, fundo branco) por contraste WCAG AA. O código segue o Figma |
| Prototipação, styleguide e handoff no Figma | ✅ | Arquivo "Projeto - Readex" (Design V2, Brandkit, Handoff) |
| Deploy Vercel + Render | 🟡 | Ver "Objetivo geral" |

## Interface e responsividade

| Requisito | Status | Onde / justificativa |
|---|---|---|
| Tema claro com identidade visual própria | ✅ | Gradiente de topo, mascote, capas reais |
| Desktop-first (1440px) com sidebar fixa | ✅ | ≥1024px: sidebar de 240px; colunas a partir de 1440px |
| Tablet: sidebar recolhida em menu | ✅ | 768–1023px: barra superior com menu em gaveta |
| Celular: navegação inferior e coluna única | ✅ | <768px: barra de abas; modais viram gaveta |
| Fundo creme / textos marinho / âmbar em ações | 🟡 | Mesma justificativa da paleta (fundo branco, texto Smoky Black, ações em Merin's Fire) |
| Transições suaves em hover e foco | ✅ | 120ms nos controles, foco visível de 2px |
| Hover nos cards de livros e itens de navegação | ✅ | Capas sobem 2–4px; itens do menu com fundo |
| Skeleton loading | ✅ | `SkeletonBlock` em todas as telas que carregam da API |
| Lazy loading das capas | ✅ | `loading="lazy"` em `BookCover` |
| Fallback para capas indisponíveis | ✅ | Capa tipográfica quando não há imagem ou a imagem falha |

## Componentização

| Componente do documento | Status | Arquivo |
|---|---|---|
| Sidebar | ✅ | `components/layout/AppSidebar.vue` |
| Topbar | ✅ | `components/layout/AppTopbar.vue` |
| SearchBar | ✅ | `components/books/SearchBar.vue` |
| GenreFilter | ✅ | `components/books/GenreFilter.vue` |
| BookGrid | ✅ | `components/books/BookGrid.vue` |
| BookCard | ✅ | `components/books/BookCard.vue` (+ `BookListItem.vue` para listas) |
| StarRating | ✅ | `components/books/StarRating.vue` |
| ProgressBar | ✅ | `components/books/ProgressBar.vue` |
| ReviewCard | ✅ | `components/books/ReviewCard.vue` |
| ChipTag | ✅ | `components/base/ChipTag.vue` |
| InputField | ✅ | `components/base/InputField.vue` |
| BtnPrimary / BtnSecondary | ✅ | `components/base/RxButton.vue` (`variant="primary" | "secondary"`, também ghost e destructive) |
| OtpInput | ✅ | `components/base/OtpInput.vue` |
| AvatarCircle | ✅ | `components/base/AvatarCircle.vue` |
| UserCard | ✅ | `components/base/UserCard.vue` |
| ToastNotification | ✅ | `components/base/ToastNotification.vue` + `stores/toast.ts` |
| Skeleton / LoadingSpinner | ✅ | `components/base/SkeletonBlock.vue`, `LoadingSpinner.vue` |
| EmptyState | ✅ | `components/base/EmptyState.vue` |

## Persistência de dados

| Requisito | Status | Onde |
|---|---|---|
| Usuários com senha criptografada | ✅ | `User.passwordHash` (bcrypt) |
| Livros do catálogo | ✅ | `Book` |
| Estante e status | ✅ | `ShelfItem` |
| Avaliações e resenhas | ✅ | `Review` |
| Progresso de leitura | ✅ | `ShelfItem.currentPage` + histórico em `ReadingLog` |
| Metas mensais | ✅ | `Goal` |
| Token JWT no localStorage | ✅ | `services/http.ts` (`readex.token`) |

## Feedback visual e UX

| Requisito | Status | Onde |
|---|---|---|
| Toasts de sucesso e erro | ✅ | Ex.: livro adicionado (com Desfazer), progresso salvo, login inválido |
| Erros nos campos (e-mail inválido, senhas diferentes, obrigatório) | ✅ | `InputField` com `aria-invalid`; mensagens da API mapeadas para os campos |
| Loading com skeleton | ✅ | Todas as listas e painéis |
| Empty states ilustrados (estante vazia, busca sem resultados, leitura não iniciada) | ✅ | `EmptyState` com o mascote |
| Feedback em botões (hover, carregando, desabilitado) | ✅ | `RxButton` (`loading` com spinner, `disabled`) |

## Dashboard e gráficos

| Requisito | Status | Onde |
|---|---|---|
| Dashboard inicial com resumo das leituras | ✅ | `/` |
| "Lendo agora" com capa, progresso e botão para continuar | ✅ | Destaque do Início ("Atualizar progresso") |
| "Meta do mês" com barra e % | ✅ | Coluna lateral do Início |
| "Sugerido para você" | ✅ | Coluna lateral do Início |
| "Da comunidade" | ✅ | Coluna principal do Início |
| Estatísticas pessoais no perfil | ✅ | Perfil; além disso, `/progresso/estatisticas` com gráficos por semana, mês e ano |

## Segurança e autenticação

| Requisito | Status | Onde |
|---|---|---|
| Senhas com hash bcrypt | ✅ | `auth.service.ts` |
| JWT no header Authorization | ✅ | `services/http.ts` |
| Rotas protegidas na API com middleware | ✅ | `plugins/auth.ts` (`app.authenticate`) |
| Rotas privadas no front com guarda | ✅ | `router/index.ts` |
| Validação dos dados antes de gravar | ✅ | Zod em todas as rotas; erros padronizados `{ message, fields }` |
| Logout remove o token e redireciona para o login | ✅ | `session.logout()` em Configurações |
| Extra | ✅ | Limite de tentativas no login (rate limit) e nos códigos (5 tentativas, 10 min) |

## Além do documento (vindo do Figma)

Onboarding com 3 slides, meta diária e do ano, sequência de dias, estatísticas com gráfico, anotações privadas/públicas, discussões com spoiler e respostas, seguir leitores, notificações com preferências, baixar dados e excluir conta.
