// Dados de exemplo coerentes com as telas do Figma (leitor Anderson Ramalho, O Nome do Vento, meta de 8 livros)
// Todas as datas são relativas a hoje, para a demonstração sempre fazer sentido.
import { PrismaClient, type ShelfStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const now = new Date()
const daysAgo = (d: number, h = 20, m = 0) => { const x = new Date(now); x.setDate(x.getDate() - d); x.setHours(h, m, 0, 0); return x }
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000)
const thisMonth = (day: number, h = 21) => new Date(now.getFullYear(), now.getMonth(), Math.max(1, Math.min(day, now.getDate())), h)

type BookSeed = { slug: string; title: string; author: string; genres: string[]; publisher: string; year: number; pages: number; synopsis: string; cover?: string; tone?: string; isbn?: string }

const books: BookSeed[] = [
  { slug: 'o-nome-do-vento', title: 'O Nome do Vento', author: 'Patrick Rothfuss', genres: ['Fantasia', 'Aventura'], publisher: 'Arqueiro', year: 2009, pages: 672, cover: '/covers/o-nome-do-vento.png', isbn: '9788599296493',
    synopsis: 'Kvothe, hoje um estalajadeiro discreto, decide contar a própria história: a infância numa trupe de artistas, os anos nas ruas e a entrada na Universidade, onde busca respostas sobre a tragédia que mudou sua vida.' },
  { slug: 'duna', title: 'Duna', author: 'Frank Herbert', genres: ['Ficção científica', 'Clássicos'], publisher: 'Aleph', year: 2017, pages: 688, cover: '/covers/duna.jpg', isbn: '9788576573135',
    synopsis: 'No planeta desértico Arrakis, única fonte da especiaria mais valiosa do universo, o jovem Paul Atreides se vê no centro de uma disputa entre casas nobres, um império e o povo do deserto.' },
  { slug: '1984', title: '1984', author: 'George Orwell', genres: ['Distopia', 'Clássicos', 'Ficção científica'], publisher: 'Companhia das Letras', year: 2009, pages: 416, cover: '/covers/1984.jpg', isbn: '9788535914849',
    synopsis: 'Winston Smith trabalha reescrevendo o passado para o Partido, num Estado que vigia cada gesto. Quando começa a duvidar, descobre o preço de pensar por conta própria.' },
  { slug: 'o-hobbit', title: 'O Hobbit', author: 'J.R.R. Tolkien', genres: ['Fantasia', 'Aventura', 'Clássicos'], publisher: 'HarperCollins Brasil', year: 2019, pages: 336, cover: '/covers/o-hobbit.jpg', isbn: '9788595084742',
    synopsis: 'Bilbo Bolseiro gosta de conforto e rotina, até ser convocado por um mago e treze anões para recuperar um tesouro guardado por um dragão.' },
  { slug: 'atelier-of-witch-hat', title: 'Atelier of Witch Hat', author: 'Kamome Shirahama', genres: ['Fantasia', 'Mangá'], publisher: 'Panini', year: 2021, pages: 192, cover: '/covers/atelier-of-witch-hat.jpg',
    synopsis: 'Coco sempre sonhou em ser bruxa, mas a magia parecia reservada a quem nasce com ela. Um encontro inesperado abre as portas de um ateliê e de um mundo de segredos.' },
  { slug: 'objetos-cortantes', title: 'Objetos Cortantes', author: 'Gillian Flynn', genres: ['Suspense'], publisher: 'Intrínseca', year: 2015, pages: 256, cover: '/covers/objetos-cortantes.jpg',
    synopsis: 'A repórter Camille volta à cidade natal para cobrir crimes contra duas meninas e precisa encarar a família e as próprias feridas.' },
  { slug: 'o-senhor-dos-aneis', title: 'O Senhor dos Anéis: A Sociedade do Anel', author: 'J.R.R. Tolkien', genres: ['Fantasia', 'Clássicos', 'Aventura'], publisher: 'HarperCollins Brasil', year: 2019, pages: 576, cover: '/covers/o-senhor-dos-aneis.jpg',
    synopsis: 'Frodo herda um anel de poder e parte com uma pequena comitiva para destruí-lo antes que o Senhor do Escuro o recupere.' },
  { slug: 'sapiens', title: 'Sapiens', author: 'Yuval Noah Harari', genres: ['Não-ficção', 'História'], publisher: 'L&PM', year: 2015, pages: 464, cover: '/covers/sapiens.jpg',
    synopsis: 'Uma visão panorâmica da história da humanidade, das primeiras comunidades de caçadores-coletores às revoluções agrícola, científica e industrial.' },
  { slug: 'habitos-atomicos', title: 'Hábitos Atômicos', author: 'James Clear', genres: ['Não-ficção', 'Desenvolvimento pessoal'], publisher: 'Alta Life', year: 2019, pages: 320, cover: '/covers/habitos-atomicos.jpg',
    synopsis: 'Um método prático para criar bons hábitos e abandonar os ruins, a partir de pequenas mudanças que se acumulam com o tempo.' },
  { slug: 'o-alquimista', title: 'O Alquimista', author: 'Paulo Coelho', genres: ['Romance', 'Clássicos'], publisher: 'Paralela', year: 2017, pages: 208, cover: '/covers/o-alquimista.jpg',
    synopsis: 'Santiago, um jovem pastor andaluz, atravessa o deserto em busca de um tesouro e aprende a ouvir o próprio coração pelo caminho.' },
  { slug: 'clean-code', title: 'Clean Code', author: 'Robert C. Martin', genres: ['Tecnologia', 'Não-ficção'], publisher: 'Alta Books', year: 2009, pages: 425, cover: '/covers/clean-code.jpg',
    synopsis: 'Princípios, padrões e práticas para escrever código legível e fácil de manter, com exemplos de refatoração passo a passo.' },
  { slug: 'fundacao', title: 'Fundação', author: 'Isaac Asimov', genres: ['Ficção científica', 'Clássicos'], publisher: 'Aleph', year: 2009, pages: 320, tone: 'marinho',
    synopsis: 'O matemático Hari Seldon prevê a queda do Império Galáctico e cria uma fundação para encurtar a era de barbárie que virá depois.' },
  { slug: 'neuromancer', title: 'Neuromancer', author: 'William Gibson', genres: ['Ficção científica'], publisher: 'Aleph', year: 2016, pages: 320, tone: 'ambar',
    synopsis: 'Case, um hacker em decadência, recebe uma última chance: participar de um golpe no ciberespaço contratado por um misterioso empregador.' },
  { slug: 'a-mao-esquerda-da-escuridao', title: 'A Mão Esquerda da Escuridão', author: 'Ursula K. Le Guin', genres: ['Ficção científica'], publisher: 'Aleph', year: 2019, pages: 304, tone: 'areia',
    synopsis: 'Genly Ai chega ao planeta gelado de Gethen como enviado de uma aliança interplanetária e precisa compreender um povo sem gênero fixo.' },
  { slug: 'fundacao-e-imperio', title: 'Fundação e Império', author: 'Isaac Asimov', genres: ['Ficção científica', 'Clássicos'], publisher: 'Aleph', year: 2009, pages: 256, tone: 'creme',
    synopsis: 'A Fundação cresce, mas enfrenta o que restou do Império e uma ameaça que nenhum cálculo previu.' },
  { slug: 'o-temor-do-sabio', title: 'O Temor do Sábio', author: 'Patrick Rothfuss', genres: ['Fantasia', 'Aventura'], publisher: 'Arqueiro', year: 2011, pages: 960, tone: 'marinho',
    synopsis: 'Kvothe continua sua história: deixa a Universidade, viaja pelo mundo e se aproxima dos segredos que procura há anos.' },
  { slug: 'dom-casmurro', title: 'Dom Casmurro', author: 'Machado de Assis', genres: ['Clássicos', 'Romance', 'Literatura brasileira'], publisher: 'Penguin-Companhia', year: 2016, pages: 256, tone: 'creme',
    synopsis: 'Bento Santiago revisita a juventude e o casamento com Capitu, tentando provar a si mesmo uma desconfiança que nunca o abandonou.' },
  { slug: 'orgulho-e-preconceito', title: 'Orgulho e Preconceito', author: 'Jane Austen', genres: ['Romance', 'Clássicos'], publisher: 'Martin Claret', year: 2018, pages: 424, tone: 'areia',
    synopsis: 'Elizabeth Bennet e o reservado Sr. Darcy precisam superar primeiras impressões e diferenças sociais na Inglaterra do século XIX.' },
  { slug: 'a-revolucao-dos-bichos', title: 'A Revolução dos Bichos', author: 'George Orwell', genres: ['Distopia', 'Clássicos'], publisher: 'Companhia das Letras', year: 2007, pages: 152, tone: 'ambar',
    synopsis: 'Os animais de uma granja expulsam o dono e prometem igualdade para todos, até que alguns passam a ser mais iguais que outros.' },
  { slug: 'admiravel-mundo-novo', title: 'Admirável Mundo Novo', author: 'Aldous Huxley', genres: ['Distopia', 'Ficção científica', 'Clássicos'], publisher: 'Biblioteca Azul', year: 2014, pages: 312, tone: 'marinho',
    synopsis: 'Numa sociedade planejada para a estabilidade, as pessoas são produzidas em laboratório e condicionadas a serem felizes com o próprio lugar.' },
  { slug: 'o-problema-dos-tres-corpos', title: 'O Problema dos Três Corpos', author: 'Cixin Liu', genres: ['Ficção científica'], publisher: 'Companhia das Letras', year: 2016, pages: 320, tone: 'areia',
    synopsis: 'Um experimento secreto na China dos anos 1960 tem consequências que, décadas depois, colocam a humanidade diante de um contato inesperado.' },
  { slug: 'torto-arado', title: 'Torto Arado', author: 'Itamar Vieira Junior', genres: ['Romance', 'Literatura brasileira'], publisher: 'Todavia', year: 2019, pages: 264, tone: 'ambar',
    synopsis: 'No sertão baiano, as irmãs Bibiana e Belonísia têm a vida marcada por um acidente na infância e pela luta de sua comunidade pela terra.' },
  { slug: 'garota-exemplar', title: 'Garota Exemplar', author: 'Gillian Flynn', genres: ['Suspense'], publisher: 'Intrínseca', year: 2013, pages: 448, tone: 'marinho',
    synopsis: 'No dia do quinto aniversário de casamento, Amy desaparece, e todas as suspeitas recaem sobre o marido, Nick.' },
  { slug: 'mistborn', title: 'Mistborn: O Império Final', author: 'Brandon Sanderson', genres: ['Fantasia'], publisher: 'LeYa', year: 2014, pages: 608, tone: 'creme',
    synopsis: 'Num mundo coberto de cinzas e governado por um imperador imortal, uma jovem de rua descobre poderes que podem derrubar o império.' },
]

const people = [
  { username: 'charmander', name: 'Anderson Ramalho', email: 'anderson@readex.com', bio: 'Fã de fantasia e ficção científica.', genres: ['Fantasia', 'Ficção científica'] },
  { username: 'marianacosta', name: 'Mariana Costa', email: 'mariana@readex.com', bio: 'Leio de tudo um pouco, mas fantasia é casa.', genres: ['Fantasia', 'Romance'] },
  { username: 'alexandrecabral', name: 'Alexandre Cabral', email: 'alexandre@readex.com', bio: 'Relendo os clássicos da ficção científica.', genres: ['Ficção científica'] },
  { username: 'jussandro', name: 'Jussandro Vítor', email: 'jussandro@readex.com', bio: 'Distopias e café.', genres: ['Distopia'] },
  { username: 'carlosm', name: 'Carlos Mendes', email: 'carlos@readex.com', bio: '', genres: ['Clássicos'] },
  { username: 'analima', name: 'Ana Lima', email: 'ana@readex.com', bio: 'Clube do livro às quintas.', genres: ['Ficção científica', 'Romance'] },
  { username: 'marias', name: 'Maria Souza', email: 'maria@readex.com', bio: '', genres: ['Fantasia'] },
  { username: 'joaop', name: 'João Pedro', email: 'joao@readex.com', bio: '', genres: ['Fantasia', 'Suspense'] },
]

async function main() {
  // Em produção o seed roda a cada deploy: só popula se o banco estiver vazio (ou com --force)
  if (!process.argv.includes('--force') && (await prisma.book.count()) > 0) {
    console.log('[seed] banco já tem dados; nada a fazer (use --force para recriar os dados de exemplo).')
    return
  }
  console.log('[seed] limpando dados...')
  await prisma.$transaction([
    prisma.notification.deleteMany(), prisma.comment.deleteMany(), prisma.postLike.deleteMany(), prisma.reviewLike.deleteMany(),
    prisma.post.deleteMany(), prisma.note.deleteMany(), prisma.review.deleteMany(), prisma.readingLog.deleteMany(),
    prisma.shelfItem.deleteMany(), prisma.goal.deleteMany(), prisma.follow.deleteMany(), prisma.verificationCode.deleteMany(),
    prisma.user.deleteMany(), prisma.book.deleteMany(),
  ])

  const B: Record<string, { id: string; pages: number }> = {}
  for (const b of books) {
    const row = await prisma.book.create({
      data: { slug: b.slug, title: b.title, author: b.author, genres: b.genres, publisher: b.publisher, year: b.year, pages: b.pages, synopsis: b.synopsis, coverUrl: b.cover ?? null, coverTone: b.tone ?? 'ambar', isbn: b.isbn ?? null },
    })
    B[b.slug] = { id: row.id, pages: row.pages }
  }

  const passwordHash = await bcrypt.hash('readex123', 10)
  const U: Record<string, string> = {}
  for (const p of people) {
    const u = await prisma.user.create({
      data: { username: p.username, name: p.name, email: p.email, bio: p.bio, passwordHash, emailVerified: true, onboarded: true, favoriteGenres: p.genres, termsAcceptedAt: daysAgo(200), createdAt: daysAgo(300) },
    })
    U[p.username] = u.id
  }
  const me = U.charmander

  // Estante do Anderson
  const shelf = async (user: string, slug: string, status: ShelfStatus, page: number, finishedAt?: Date, startedAt?: Date) =>
    prisma.shelfItem.create({ data: { userId: U[user], bookId: B[slug].id, status, currentPage: status === 'CONCLUIDO' ? B[slug].pages : page, finishedAt: finishedAt ?? null, startedAt: startedAt ?? (status === 'QUERO_LER' ? null : daysAgo(40)) } })

  // Lendo agora: O Nome do Vento na p. 456 (a demonstração atualiza para 481)
  // (criado por último para ficar como destaque "Lendo agora", que usa a atualização mais recente)
  await shelf('charmander', 'atelier-of-witch-hat', 'LENDO', 121, undefined, daysAgo(9))
  await shelf('charmander', 'o-nome-do-vento', 'LENDO', 456, undefined, daysAgo(52))
  // 5 livros concluídos neste mês (meta de 8)
  const monthFinished: [string, number][] = [['duna', 3], ['o-hobbit', 8], ['o-senhor-dos-aneis', 13], ['objetos-cortantes', 18], ['clean-code', 22]]
  for (const [slug, day] of monthFinished) await shelf('charmander', slug, 'CONCLUIDO', 0, thisMonth(day), thisMonth(day - 6))
  // Concluídos em meses anteriores deste ano
  const earlier: [string, number][] = [['1984', 1], ['sapiens', 1], ['o-alquimista', 2], ['habitos-atomicos', 3], ['dom-casmurro', 3], ['a-revolucao-dos-bichos', 4], ['admiravel-mundo-novo', 6], ['garota-exemplar', 7], ['torto-arado', 9]]
  for (const [slug, monthsBack] of earlier) {
    const d = new Date(now.getFullYear(), Math.max(0, now.getMonth() - monthsBack), 15, 21)
    await shelf('charmander', slug, 'CONCLUIDO', 0, d, new Date(d.getTime() - 12 * 86_400_000))
  }
  for (const slug of ['neuromancer', 'a-mao-esquerda-da-escuridao', 'o-temor-do-sabio', 'mistborn', 'o-problema-dos-tres-corpos']) await shelf('charmander', slug, 'QUERO_LER', 0)

  // Metas: 8 livros no mês; meta diária de 30 min
  await prisma.goal.create({ data: { userId: me, year: now.getFullYear(), month: now.getMonth() + 1, target: 8 } })
  for (let i = 1; i <= Math.min(now.getMonth(), 10); i++) await prisma.goal.create({ data: { userId: me, year: now.getFullYear(), month: i, target: 6 } })

  // Registros de leitura: 12 dias seguidos até ontem, hoje 18 min, e um recorde antigo de 19 dias
  const logs: { userId: string; bookId: string; fromPage: number; toPage: number; minutes: number; createdAt: Date }[] = []
  let page = 456
  for (let d = 1; d <= 12; d++) {
    const read = 10 + ((d * 7) % 9)
    logs.push({ userId: me, bookId: B['o-nome-do-vento'].id, fromPage: page - read, toPage: page, minutes: 32 + ((d * 5) % 20), createdAt: daysAgo(d, 21, 10) })
    page -= read
  }
  logs.push({ userId: me, bookId: B['atelier-of-witch-hat'].id, fromPage: 109, toPage: 121, minutes: 18, createdAt: hoursAgo(Math.min(3, now.getHours())) })
  for (let d = 40; d < 59; d++) logs.push({ userId: me, bookId: B['duna'].id, fromPage: 0, toPage: 18, minutes: 35, createdAt: daysAgo(d, 22) })
  // Leituras dos livros concluídos (para as estatísticas por mês)
  for (const [slug, day] of monthFinished) for (let k = 0; k < 4; k++) logs.push({ userId: me, bookId: B[slug].id, fromPage: 0, toPage: Math.round(B[slug].pages / 4), minutes: 50, createdAt: thisMonth(day - k, 20) })
  for (const [slug, monthsBack] of earlier) for (let k = 0; k < 6; k++) logs.push({ userId: me, bookId: B[slug].id, fromPage: 0, toPage: Math.round(B[slug].pages / 6), minutes: 45, createdAt: new Date(now.getFullYear(), Math.max(0, now.getMonth() - monthsBack), 3 + k * 2, 21) })
  await prisma.readingLog.createMany({ data: logs })

  // Estantes dos outros leitores
  await shelf('carlosm', '1984', 'LENDO', 210)
  await shelf('analima', 'duna', 'CONCLUIDO', 0, daysAgo(1))
  await shelf('marianacosta', 'o-nome-do-vento', 'LENDO', 300)
  await shelf('marianacosta', 'mistborn', 'CONCLUIDO', 0, daysAgo(20))
  await shelf('marianacosta', 'o-hobbit', 'CONCLUIDO', 0, daysAgo(60))
  await shelf('marianacosta', 'orgulho-e-preconceito', 'QUERO_LER', 0)
  await shelf('alexandrecabral', 'duna', 'CONCLUIDO', 0, hoursAgo(3))
  await shelf('alexandrecabral', 'o-senhor-dos-aneis', 'LENDO', 140)
  await shelf('alexandrecabral', 'fundacao', 'CONCLUIDO', 0, daysAgo(30))
  await shelf('alexandrecabral', 'neuromancer', 'CONCLUIDO', 0, daysAgo(70))
  await shelf('jussandro', '1984', 'LENDO', 120)
  await shelf('joaop', 'o-nome-do-vento', 'CONCLUIDO', 0, daysAgo(15))
  await shelf('marias', 'o-nome-do-vento', 'CONCLUIDO', 0, daysAgo(10))

  // Avaliações e resenhas
  const review = (user: string, slug: string, rating: number, text: string | null, createdAt: Date, spoiler = false, tags: string[] = []) =>
    prisma.review.create({ data: { userId: U[user], bookId: B[slug].id, rating, text, createdAt, spoiler, tags } })
  const rv = {
    anaDuna: await review('analima', 'duna', 5, 'Construção de mundo épica e envolvente!', hoursAgo(20)),
    carlos1984: await review('carlosm', '1984', 5, 'O Grande Irmão me perturbou profundamente.', hoursAgo(6)),
    mariaVento: await review('marias', 'o-nome-do-vento', 5, 'Leitura transformadora! A construção de mundo é impecável.', daysAgo(9)),
    joaoVento: await review('joaop', 'o-nome-do-vento', 4, 'O final da parte na Universidade muda tudo o que você achava sobre o Kvothe e o Ambrose.', daysAgo(14), true),
    meDuna: await review('charmander', 'duna', 5, 'Demorei para entrar no ritmo, mas a política de Arrakis é fascinante. Um dos melhores que li este ano.', thisMonth(3, 22), false, ['Ficção científica', 'Clássico']),
    meHobbit: await review('charmander', 'o-hobbit', 4, null, thisMonth(8, 22)),
  }
  await review('charmander', '1984', 5, 'Assustador como continua atual.', daysAgo(40))
  await review('charmander', 'sapiens', 4, 'Muitas ideias para pensar, especialmente sobre a revolução agrícola.', daysAgo(70))
  await review('charmander', 'o-alquimista', 3, null, daysAgo(80))
  await review('alexandrecabral', 'duna', 5, 'Releitura que valeu cada página.', hoursAgo(2))
  await review('alexandrecabral', 'fundacao', 4, 'Ideias enormes em poucas páginas.', daysAgo(30))
  await review('marianacosta', 'mistborn', 5, 'Sistema de magia mais criativo que já vi.', daysAgo(19))
  await review('marianacosta', 'o-hobbit', 4, null, daysAgo(59))
  await review('jussandro', 'a-revolucao-dos-bichos', 5, 'Curto e certeiro.', daysAgo(25))
  await review('analima', 'o-alquimista', 4, 'Releio sempre que preciso de um empurrão.', daysAgo(33))
  await review('carlosm', 'sapiens', 5, null, daysAgo(12))
  await review('joaop', 'garota-exemplar', 4, 'Reviravolta no meio do livro que eu não vi chegando.', daysAgo(45))
  await review('marias', 'o-senhor-dos-aneis', 5, 'Clássico absoluto.', daysAgo(50))
  await review('marianacosta', 'fundacao', 4, null, daysAgo(48))
  await review('analima', 'neuromancer', 4, 'Denso, mas inventou o futuro.', daysAgo(65))
  await review('carlosm', 'dom-casmurro', 5, 'Capitu traiu ou não traiu? Discuto até hoje.', daysAgo(90))
  await review('jussandro', 'admiravel-mundo-novo', 4, null, daysAgo(52))
  await review('alexandrecabral', 'o-problema-dos-tres-corpos', 5, 'Ficção científica dura do melhor tipo.', daysAgo(75))
  await review('analima', 'torto-arado', 5, 'Bonito e doloroso.', daysAgo(22))
  await review('joaop', 'mistborn', 4, null, daysAgo(28))
  await review('marias', 'habitos-atomicos', 4, 'Prático e direto.', daysAgo(31))

  // Médias recalculadas a partir das avaliações
  for (const b of Object.values(B)) {
    const agg = await prisma.review.aggregate({ where: { bookId: b.id }, _avg: { rating: true }, _count: true })
    await prisma.book.update({ where: { id: b.id }, data: { avgRating: agg._avg.rating ?? 0, ratingsCount: agg._count } })
  }
  for (const [user, r] of [['marianacosta', rv.meDuna], ['alexandrecabral', rv.meDuna], ['charmander', rv.anaDuna], ['charmander', rv.carlos1984], ['joaop', rv.mariaVento]] as const) {
    await prisma.reviewLike.create({ data: { userId: U[user], reviewId: r.id } })
  }

  // Anotações (começam privadas; algumas públicas no perfil)
  const note = (slug: string, kind: 'CITACAO' | 'NOTA', p: number, text: string, isPublic: boolean, createdAt: Date, comment?: string, user = 'charmander') =>
    prisma.note.create({ data: { userId: U[user], bookId: B[slug].id, kind, page: p, text, isPublic, createdAt, comment: comment ?? null } })
  await note('o-nome-do-vento', 'CITACAO', 340, 'Palavras são pálidas sombras de nomes esquecidos.', true, daysAgo(2), 'Releitura: comparar com o prólogo.')
  await note('o-nome-do-vento', 'CITACAO', 212, 'É a pergunta que importa, não a resposta.', false, daysAgo(6))
  await note('o-nome-do-vento', 'NOTA', 401, 'A relação com o Mestre Kilvin lembra muito a de um orientador de verdade.', false, daysAgo(4))
  await note('o-nome-do-vento', 'NOTA', 455, 'Prestar atenção em quem conta a história e em quem ouve.', false, daysAgo(1))
  await note('sapiens', 'NOTA', 88, 'Comparar com o capítulo sobre a revolução agrícola.', true, daysAgo(21))
  await note('o-hobbit', 'NOTA', 45, 'A descrição da toca me lembrou a casa da minha avó.', true, daysAgo(32))
  await note('duna', 'CITACAO', 12, 'O medo é o assassino da mente.', true, daysAgo(40), undefined, 'alexandrecabral')
  await note('o-nome-do-vento', 'NOTA', 120, 'Quero muito ler o próximo depois deste.', true, daysAgo(8), undefined, 'marianacosta')

  // Discussões da comunidade
  const post = (user: string, slug: string, text: string, createdAt: Date, spoilerPage: number | null = null) =>
    prisma.post.create({ data: { userId: U[user], bookId: B[slug].id, text, createdAt, spoilerPage, hashtags: [...text.matchAll(/#([\p{L}\d_]+)/gu)].map((m) => m[1]) } })
  const pDuna = await post('alexandrecabral', 'duna', 'Acabei de terminar Duna e não consigo parar de pensar nisso. A construção do mundo é incrível! #Duna', hoursAgo(2))
  const p1984 = await post('jussandro', '1984', 'Alguém mais acha que 1984 é mais relevante hoje do que quando foi escrito? Estou relendo pela terceira vez. #Distopia', hoursAgo(5))
  const pVento = await post('charmander', 'o-nome-do-vento', 'O capítulo em que o Kvothe chega à Universidade é o meu favorito até agora. Quem mais está lendo? #Fantasia', daysAgo(1, 19))
  const pSpoiler = await post('marianacosta', 'o-nome-do-vento', 'Não acredito no que aconteceu com a Denna perto do fim. Precisava comentar com alguém!', daysAgo(2, 15), 600)
  await post('analima', 'o-alquimista', 'Releitura de O Alquimista para o clube do livro. Ainda funciona muito bem. #PauloCoelho', daysAgo(3, 12))
  await post('alexandrecabral', 'neuromancer', 'Recomendação para quem gostou de Duna e quer algo mais sombrio: Neuromancer. #FiccaoCientifica #Duna', daysAgo(4, 18))
  await post('jussandro', 'admiravel-mundo-novo', 'Admirável Mundo Novo ou 1984: qual distopia chegou mais perto? #Distopia', daysAgo(6, 10))

  const comment = (p: { id: string }, user: string, text: string, createdAt: Date) => prisma.comment.create({ data: { postId: p.id, userId: U[user], text, createdAt } })
  await comment(pDuna, 'marianacosta', 'A parte do deserto é a minha favorita.', hoursAgo(1.5))
  await comment(pDuna, 'charmander', 'Terminei este mês também. Os capítulos finais são uma montanha-russa.', hoursAgo(1))
  await comment(pDuna, 'analima', 'Já viu os filmes? Achei bem fiéis.', hoursAgo(0.5))
  await comment(p1984, 'carlosm', 'Concordo. Estou lendo agora e é assustador.', hoursAgo(4))
  await comment(pVento, 'alexandrecabral', 'Também! A cena do teste de admissão é ótima.', daysAgo(1, 21))
  await comment(pVento, 'marianacosta', 'Estou na metade. Sem spoilers, por favor!', daysAgo(0, 9))
  await comment(pSpoiler, 'joaop', 'Eu também fiquei sem palavras.', daysAgo(2, 18))
  const likers = ['marianacosta', 'alexandrecabral', 'jussandro', 'carlosm', 'analima', 'marias', 'joaop', 'charmander']
  for (const [p, n] of [[pDuna, 6], [p1984, 4], [pVento, 5], [pSpoiler, 3]] as const) {
    for (const u of likers.slice(0, n)) if (!(p.userId === U[u])) await prisma.postLike.create({ data: { postId: p.id, userId: U[u] } })
  }

  // Quem o Anderson segue (e quem o segue)
  for (const u of ['marianacosta', 'alexandrecabral', 'carlosm', 'analima']) await prisma.follow.create({ data: { followerId: me, followingId: U[u] } })
  for (const u of ['marianacosta', 'alexandrecabral', 'jussandro', 'carlosm', 'analima', 'joaop']) await prisma.follow.create({ data: { followerId: U[u], followingId: me } })
  await prisma.follow.create({ data: { followerId: U.marianacosta, followingId: U.alexandrecabral } })

  // Notificações do Anderson (3 não lidas)
  const n = (category: string, text: string, createdAt: Date, read: boolean, link?: string, actor?: string) =>
    prisma.notification.create({ data: { userId: me, actorId: actor ? U[actor] : null, category, text, link: link ?? null, createdAt, readAt: read ? createdAt : null } })
  await n('social', 'Mariana Costa curtiu sua resenha de Duna.', hoursAgo(0.3), false, '/livros/duna/resenhas', 'marianacosta')
  await n('social', 'Alexandre Cabral respondeu sua discussão sobre O Nome do Vento.', daysAgo(1, 21), false, `/comunidade/posts/${pVento.id}`, 'alexandrecabral')
  await n('reminder', 'Hora da leitura: faltam 12 minutos para sua meta de hoje.', hoursAgo(1), false, '/')
  await n('followers', 'João Pedro começou a seguir você.', daysAgo(2), true, '/leitores/joaop', 'joaop')
  await n('goals', 'Você está há 10 dias seguidos lendo. Continue assim!', daysAgo(2, 9), true, '/progresso')
  await n('recommendations', 'Fundação combina com o que você lê. Que tal adicionar à estante?', daysAgo(3, 10), true, '/livros/fundacao')
  await n('weekly', 'Seu resumo da semana: 214 páginas e 5 h 10 min de leitura.', daysAgo(5, 8), true, '/progresso/estatisticas')
  await n('goals', 'Você terminou Duna. Faltam 7 livros para a meta do mês.', thisMonth(3, 22), true, '/progresso')

  console.log(`[seed] ${books.length} livros, ${people.length} leitores. Entre com anderson@readex.com / readex123`)
}

main().finally(() => prisma.$disconnect())
