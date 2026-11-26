# Readex

Aplicação web full stack para organizar leituras pessoais e avaliar livros. A pessoa monta a estante (Quero ler, Lendo agora, Concluído), registra a página em que parou, define metas do mês, escreve resenhas e conversa com outros leitores.

Projeto acadêmico de Anderson Ramalho (Desenvolvimento Full Stack e UI/UX Design). O design de todas as telas está no Figma (arquivo "Projeto - Readex", páginas Design V2 e Handoff).

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Front-end | Vue.js 3 (Composition API), Vite, Vue Router (rotas protegidas), Tailwind CSS 4, Lucide (ícones), Poppins |
| Back-end | Node.js + TypeScript, Fastify (API REST), Zod (validação), JWT (`@fastify/jwt`), bcrypt (`bcryptjs`) |
| Banco | PostgreSQL com Prisma ORM |
| Organização | Monorepo com npm workspaces; back-end em camadas (rotas → serviços → Prisma) |
| Deploy | Front na Vercel (`apps/web/vercel.json`), API + banco no Render (`render.yaml`) |

## Como instalar e rodar

Pré-requisito: **Node.js 20 ou mais novo**. Não precisa instalar PostgreSQL nem Docker: em desenvolvimento a API usa um PostgreSQL de verdade embutido (pacote `embedded-postgres`, que baixa os binários pelo npm).

```bash
# Na pasta readex/

# 1. Instala tudo, cria o apps/api/.env, as tabelas e os dados de exemplo
npm run setup

# 2. Sobe banco, API e front de uma vez
npm run dev
```

Abra **http://localhost:5173** e entre com a conta de demonstração:

- E-mail: `anderson@readex.com`
- Senha: `readex123`

Há um botão "Usar conta de demonstração" na tela de login que preenche os campos.

Outros comandos úteis:

| Comando | O que faz |
|---|---|
| `npm run demo:reset` | Apaga tudo e recarrega os dados de exemplo (use antes da apresentação) |
| `npm run build` | Gera os builds de produção da API e do front |

Portas: front 5173, API 3333 (`/api`), banco 5433. Os dados do banco local ficam em `~/.readex/pgdata` (fora do OneDrive, para evitar conflito de sincronização).

## Deploy

**No ar:**

- Site: https://readex-phi.vercel.app
- API: https://readex-api.onrender.com/api (verificação: `/health`)

Cada push na branch `main` publica o site de novo na Vercel automaticamente. No Render, o serviço foi criado pela URL pública do repositório: depois de mudar a API, use **Manual Deploy › Deploy latest commit** no painel do `readex-api`.

Como foi configurado:

1. **Banco + API no Render:** New › Blueprint › este repositório. O `render.yaml` cria o PostgreSQL e o serviço da API. Na primeira subida, as tabelas são criadas (`prisma db push`) e os dados de exemplo são carregados só se o banco estiver vazio. Preencha `WEB_ORIGIN` com a URL da Vercel.
2. **Front na Vercel:** importe o repositório com *Root Directory* `apps/web` e defina `VITE_API_URL=https://<sua-api>.onrender.com/api`.

O plano gratuito do Render hiberna a API depois de alguns minutos sem uso: a primeira requisição pode levar ~1 minuto. Abra o site um pouco antes de apresentar.

## Estrutura de pastas

```
readex/
├── package.json            # workspaces e scripts (setup, dev, build, demo:reset)
├── render.yaml             # deploy da API + banco no Render
├── apps/
│   ├── api/                # back-end Fastify + Prisma
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # modelos: User, Book, ShelfItem, ReadingLog, Review, Goal, Note, Post...
│   │   │   └── seed.ts         # dados de exemplo coerentes com o Figma
│   │   ├── scripts/            # PostgreSQL embutido e preparação do banco
│   │   └── src/
│   │       ├── config/         # variáveis de ambiente validadas
│   │       ├── lib/            # prisma, erros, datas, serializadores, notificações
│   │       ├── plugins/        # autenticação JWT (middleware)
│   │       └── modules/        # auth, books, shelf, reviews, goals, dashboard, stats,
│   │                           # community, notes, users, notifications, account
│   │                           # (cada um com rotas e, quando há regra de negócio, um service)
│   └── web/                # front-end Vue 3
│       ├── public/covers/      # capas reais exportadas do Figma
│       └── src/
│           ├── assets/         # mascote, logotipo e gradiente (do Figma)
│           ├── components/
│           │   ├── base/       # RxButton, InputField, OtpInput, ChipTag, RxModal, ToastNotification,
│           │   │               # SkeletonBlock, LoadingSpinner, EmptyState, AvatarCircle, UserCard...
│           │   ├── books/      # BookCover, BookCard, BookGrid, StarRating, ProgressBar,
│           │   │               # ShelfStatusButton, ReviewCard, SearchBar, GenreFilter...
│           │   ├── community/  # PostCard, ActivityItem
│           │   ├── layout/     # AppSidebar, AppTabBar, AppTopbar, NotificationBell...
│           │   └── modals/     # Atualizar progresso, Terminei o livro, Nova discussão, Anotação
│           ├── composables/    # useAsync, useShelf, useCountdown
│           ├── layouts/        # AppLayout (logado) e AuthLayout (acesso)
│           ├── pages/          # uma página por rota
│           ├── router/         # rotas e guarda de navegação
│           ├── services/       # cliente HTTP (JWT no header) e tipos
│           ├── stores/         # sessão, avisos e estado de interface
│           ├── styles/         # Tailwind + tokens do Figma (@theme)
│           └── utils/          # formatação pt-BR
```

## Rotas

| Rota | Tela |
|---|---|
| `/entrar`, `/criar-conta`, `/confirmar-email`, `/esqueci-senha`, `/redefinir-senha` | Acesso (públicas) |
| `/boas-vindas` | Onboarding: 3 slides, gêneros favoritos, primeiros passos |
| `/` | Início (dashboard) |
| `/estante` | Minha Estante |
| `/explorar` | Busca, filtros por gênero e sugestões (`?adicionar=1` abre no modo "Adicionar livro") |
| `/livros/:slug` e `/livros/:slug/anotacoes | discussoes | resenhas` | Página do livro com abas |
| `/livros/:slug/escrever-resenha` | Avaliar e escrever resenha |
| `/comunidade`, `/comunidade/posts/:id` | Feed e discussão aberta |
| `/progresso`, `/progresso/estatisticas` | Metas e estatísticas |
| `/perfil`, `/perfil/editar`, `/leitores/:usuario`, `/leitores/:usuario/seguindo` | Perfis |
| `/notificacoes` | Todas as notificações |
| `/configuracoes` (+ `/seguranca`, `/privacidade`, `/notificacoes`) | Configurações e logout |

## O que é real e o que é simulado

**Real (funciona de ponta a ponta, com dados no PostgreSQL):**

- Cadastro com nome, nome de usuário, e-mail, senha + confirmação e aceite dos termos; senha guardada com hash bcrypt.
- Login por e-mail ou usuário, "Manter conectado" (token de 30 dias; sem marcar, 1 dia), sessão mantida ao recarregar, logout.
- Rotas protegidas na API (middleware JWT) e no front (guarda do Vue Router).
- Catálogo com 24 livros, busca por título/autor/gênero/ISBN, filtro por gênero e por páginas.
- Estante com um status por livro, progresso com páginas lidas/restantes/%, "Você ainda não começou" e conclusão automática a 100%.
- Avaliação de 1 a 5 estrelas com resenha opcional ("Sem comentário" quando não há texto) e média recalculada a cada avaliação.
- Meta mensal com quantidade e % e "Meta atingida!"; meta diária em minutos; meta do ano opcional; sequência de dias.
- Feed da comunidade, curtidas, discussões com hashtags, spoiler e respostas, seguir leitores.
- Anotações privadas ou públicas, perfil com estatísticas, edição de perfil com foto.
- Notificações no app (sino, contador, marcar como lidas com Desfazer) e preferências por categoria.
- Baixar meus dados (arquivo JSON) e excluir conta (digitando EXCLUIR).

**Simulado (avisado também na interface):**

- **Envio de e-mail:** os códigos de confirmação e de redefinição de senha são gerados e validados de verdade (6 dígitos, 10 minutos, reenvio após 45 s), mas não há envio de e-mail. Em modo demonstração (`DEMO_CODES=true`) o código aparece na tela e no terminal da API.
- **Entrar com Google/Apple:** os botões existem como no design, mas mostram um aviso de que não estão disponíveis.
- **Push no celular:** a preferência "Push" é salva, mas nenhum push é enviado.
- **Minutos de leitura:** quando a pessoa registra páginas sem informar o tempo, a API estima 1,5 min por página.
- **Dados de exemplo:** leitores, resenhas, discussões e notificações são fictícios e foram criados pelo seed; as datas são relativas ao dia de hoje.

**Fora do escopo desta versão:** enquete e imagem nas discussões, lista de aparelhos conectados, tema escuro e captura de anotações por foto.

## Decisões sobre o documento e o design

- **Paleta:** o documento cita creme, âmbar e azul-marinho; a versão final aprovada no Figma usa a paleta MP096 (Merin's Fire, Smoky Black, Sauce Piquante) com fundo branco, por contraste medido (WCAG 2.1 AA). O código segue o Figma.
- **Cadastro:** segue o documento (nome de usuário, confirmação de senha e termos) com o visual do Figma.
- **Telas complementadas** para atender ao documento, seguindo o `DESIGN.md`: "Sobre o livro" (sinopse, gêneros, ficha técnica), "Sugerido para você" no Início, estatísticas do perfil (livros lidos, avaliações, meta) e barra com % na meta do Início.
- **Status:** a interface usa "Concluído", como no documento.
- **Tablet (768–1023px):** menu lateral recolhido numa gaveta, como pede o documento.

Detalhes de requisitos: veja [CHECKLIST.md](CHECKLIST.md). Roteiro da apresentação: [ROTEIRO.md](ROTEIRO.md).
