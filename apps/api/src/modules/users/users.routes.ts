import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { AppError, notFound } from '../../lib/errors.js'
import { bookSummary, progressOf, userSelect, userSummary } from '../../lib/serializers.js'
import { notify } from '../../lib/notify.js'
import { monthlyGoal } from '../goals/goals.service.js'
import { publicUser } from '../auth/auth.service.js'

async function byUsername(username: string) {
  const user = await prisma.user.findUnique({ where: { username: username.toLowerCase() } })
  if (!user) throw notFound('Leitor')
  return user
}

export async function usersRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // Perfil com estatísticas: livros lidos, avaliações feitas e meta atual
  app.get('/users/:username', async (req) => {
    const { username } = z.object({ username: z.string() }).parse(req.params)
    const user = await byUsername(username)
    const isMe = user.id === req.userId
    const [read, reading, reviews, publicNotes, following, followers, isFollowing, goal] = await Promise.all([
      prisma.shelfItem.count({ where: { userId: user.id, status: 'CONCLUIDO' } }),
      prisma.shelfItem.count({ where: { userId: user.id, status: 'LENDO' } }),
      prisma.review.count({ where: { userId: user.id } }),
      prisma.note.count({ where: { userId: user.id, ...(isMe ? {} : { isPublic: true }) } }),
      prisma.follow.count({ where: { followerId: user.id } }),
      prisma.follow.count({ where: { followingId: user.id } }),
      isMe ? false : prisma.follow.findUnique({ where: { followerId_followingId: { followerId: req.userId, followingId: user.id } } }).then(Boolean),
      monthlyGoal(user.id),
    ])
    const readThisYear = await prisma.shelfItem.count({ where: { userId: user.id, status: 'CONCLUIDO', finishedAt: { gte: new Date(new Date().getFullYear(), 0, 1) } } })
    return {
      user: { ...userSummary(user), bio: user.bio, createdAt: user.createdAt },
      isMe, isFollowing,
      stats: { read, reading, reviews, notes: publicNotes, following, followers, readThisYear, goal: { done: goal.done, target: goal.target, percent: goal.percent } },
    }
  })

  app.get('/users/:username/books', async (req) => {
    const { username } = z.object({ username: z.string() }).parse(req.params)
    const { status } = z.object({ status: z.enum(['LENDO', 'CONCLUIDO', 'QUERO_LER']).default('LENDO') }).parse(req.query)
    const user = await byUsername(username)
    const [items, mine, ratings] = await Promise.all([
      prisma.shelfItem.findMany({ where: { userId: user.id, status }, include: { book: true }, orderBy: status === 'CONCLUIDO' ? { finishedAt: 'desc' } : { updatedAt: 'desc' } }),
      prisma.shelfItem.findMany({ where: { userId: req.userId }, select: { bookId: true, status: true } }),
      prisma.review.findMany({ where: { userId: user.id }, select: { bookId: true, rating: true } }),
    ])
    const myStatus = new Map(mine.map((m) => [m.bookId, m.status]))
    const ratingOf = new Map(ratings.map((r) => [r.bookId, r.rating]))
    return {
      results: items.map((i) => ({
        book: bookSummary(i.book), progress: progressOf(i.currentPage, i.book.pages), finishedAt: i.finishedAt,
        rating: ratingOf.get(i.bookId) ?? null, myStatus: myStatus.get(i.bookId) ?? null,
      })),
    }
  })

  app.get('/users/:username/reviews', async (req) => {
    const { username } = z.object({ username: z.string() }).parse(req.params)
    const user = await byUsername(username)
    const reviews = await prisma.review.findMany({ where: { userId: user.id }, include: { book: true, _count: { select: { likes: true } } }, orderBy: { createdAt: 'desc' } })
    return { results: reviews.map((r) => ({ id: r.id, rating: r.rating, text: r.text, spoiler: r.spoiler, createdAt: r.createdAt, likes: r._count.likes, book: bookSummary(r.book) })) }
  })

  app.get('/users/:username/notes', async (req) => {
    const { username } = z.object({ username: z.string() }).parse(req.params)
    const user = await byUsername(username)
    const isMe = user.id === req.userId
    const notes = await prisma.note.findMany({ where: { userId: user.id, ...(isMe ? {} : { isPublic: true }) }, include: { book: true }, orderBy: { createdAt: 'desc' } })
    return { results: notes.map((n) => ({ id: n.id, kind: n.kind, page: n.page, text: n.text, comment: n.comment, isPublic: n.isPublic, createdAt: n.createdAt, book: bookSummary(n.book) })) }
  })

  app.get('/users/:username/following', async (req) => {
    const { username } = z.object({ username: z.string() }).parse(req.params)
    const user = await byUsername(username)
    const rows = await prisma.follow.findMany({ where: { followerId: user.id }, include: { following: { select: { ...userSelect, bio: true } } } })
    return { results: rows.map((r) => ({ ...userSummary(r.following), bio: r.following.bio })) }
  })

  // Seguir / deixar de seguir (com "Desfazer" na interface)
  app.post('/users/:username/follow', async (req) => {
    const { username } = z.object({ username: z.string() }).parse(req.params)
    const user = await byUsername(username)
    if (user.id === req.userId) throw new AppError(400, 'Você não pode seguir a si mesmo.')
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: req.userId, followingId: user.id } },
      create: { followerId: req.userId, followingId: user.id }, update: {},
    })
    const me = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } })
    await notify({ userId: user.id, actorId: req.userId, category: 'followers', text: `${me.name} começou a seguir você.`, link: `/leitores/${me.username}` })
    return { following: true }
  })

  app.delete('/users/:username/follow', async (req) => {
    const { username } = z.object({ username: z.string() }).parse(req.params)
    const user = await byUsername(username)
    await prisma.follow.deleteMany({ where: { followerId: req.userId, followingId: user.id } })
    return { following: false }
  })

  // Editar perfil: nome, nome de usuário, bio (até 160) e avatar (imagem reduzida no navegador)
  app.patch('/me', async (req) => {
    const body = z.object({
      name: z.string().trim().min(2, 'Digite seu nome.').max(60).optional(),
      username: z.string().trim().regex(/^[a-zA-Z0-9_.]{3,20}$/, 'Use de 3 a 20 letras, números, ponto ou _.').optional(),
      bio: z.string().trim().max(160, 'A bio pode ter até 160 caracteres.').optional(),
      avatarUrl: z.string().max(400_000, 'Escolha uma imagem menor.').regex(/^data:image\/(png|jpeg|webp);base64,/, 'Formato de imagem inválido.').nullable().optional(),
    }).parse(req.body)
    if (body.username) {
      const taken = await prisma.user.findFirst({ where: { username: body.username.toLowerCase(), NOT: { id: req.userId } } })
      if (taken) throw new AppError(409, 'Esse nome de usuário já está em uso.', 'username')
      body.username = body.username.toLowerCase()
    }
    const user = await prisma.user.update({ where: { id: req.userId }, data: body })
    return { user: publicUser(user) }
  })

  // Onboarding: gêneros favoritos (usados no "Sugerido para você")
  app.put('/me/onboarding', async (req) => {
    const body = z.object({ favoriteGenres: z.array(z.string()).max(12).default([]) }).parse(req.body)
    const user = await prisma.user.update({ where: { id: req.userId }, data: { favoriteGenres: body.favoriteGenres, onboarded: true } })
    return { user: publicUser(user) }
  })
}
