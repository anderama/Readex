import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { notFound } from '../../lib/errors.js'
import { notify } from '../../lib/notify.js'

// Recalcula a nota média do livro a cada avaliação nova, editada ou removida
async function recomputeAverage(bookId: string) {
  const agg = await prisma.review.aggregate({ where: { bookId }, _avg: { rating: true }, _count: true })
  await prisma.book.update({ where: { id: bookId }, data: { avgRating: agg._avg.rating ?? 0, ratingsCount: agg._count } })
}

export async function reviewsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // Avaliar (1 a 5 estrelas) com resenha opcional. Sem texto, a interface mostra "Sem comentário".
  app.put('/books/:bookId/review', async (req) => {
    const { bookId } = z.object({ bookId: z.string() }).parse(req.params)
    const body = z.object({
      rating: z.number({ required_error: 'Escolha uma nota de 1 a 5 estrelas.' }).int().min(1, 'Escolha uma nota de 1 a 5 estrelas.').max(5, 'Escolha uma nota de 1 a 5 estrelas.'),
      text: z.string().trim().max(1000, 'A resenha pode ter até 1.000 caracteres.').optional().nullable(),
      spoiler: z.boolean().default(false),
      tags: z.array(z.string().trim().min(1).max(24)).max(5).default([]),
    }).parse(req.body)
    const book = await prisma.book.findFirst({ where: { OR: [{ id: bookId }, { slug: bookId }] } })
    if (!book) throw notFound('Livro')
    const data = { rating: body.rating, text: body.text || null, spoiler: body.text ? body.spoiler : false, tags: body.tags }
    const review = await prisma.review.upsert({
      where: { userId_bookId: { userId: req.userId, bookId: book.id } },
      create: { userId: req.userId, bookId: book.id, ...data },
      update: data,
    })
    await recomputeAverage(book.id)
    const updated = await prisma.book.findUniqueOrThrow({ where: { id: book.id } })
    return { review, avgRating: Math.round(updated.avgRating * 10) / 10, ratingsCount: updated.ratingsCount }
  })

  app.delete('/books/:bookId/review', async (req) => {
    const { bookId } = z.object({ bookId: z.string() }).parse(req.params)
    const book = await prisma.book.findFirst({ where: { OR: [{ id: bookId }, { slug: bookId }] } })
    if (!book) throw notFound('Livro')
    await prisma.review.deleteMany({ where: { userId: req.userId, bookId: book.id } })
    await recomputeAverage(book.id)
    return { ok: true }
  })

  // Curtir / descurtir uma resenha da comunidade
  app.post('/reviews/:id/like', async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    const review = await prisma.review.findUnique({ where: { id }, include: { book: true } })
    if (!review) throw notFound('Resenha')
    const key = { userId_reviewId: { userId: req.userId, reviewId: id } }
    const existing = await prisma.reviewLike.findUnique({ where: key })
    if (existing) await prisma.reviewLike.delete({ where: key })
    else {
      await prisma.reviewLike.create({ data: { userId: req.userId, reviewId: id } })
      const me = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } })
      await notify({ userId: review.userId, actorId: req.userId, category: 'social', text: `${me.name} curtiu sua resenha de ${review.book.title}.`, link: `/livros/${review.book.slug}/resenhas` })
    }
    const likes = await prisma.reviewLike.count({ where: { reviewId: id } })
    return { liked: !existing, likes }
  })
}
