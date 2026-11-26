import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import * as service from './books.service.js'
import { prisma } from '../../lib/prisma.js'
import { notFound } from '../../lib/errors.js'

export async function booksRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // Busca por título, autor, gênero ou ISBN, com filtro por gênero e páginas
  app.get('/books', async (req) => {
    const q = z.object({
      q: z.string().optional(),
      genre: z.union([z.string(), z.array(z.string())]).optional(),
      maxPages: z.coerce.number().int().positive().optional(),
    }).parse(req.query)
    const genres = q.genre ? (Array.isArray(q.genre) ? q.genre : [q.genre]) : []
    return { results: await service.search(req.userId, { q: q.q, genres, maxPages: q.maxPages }) }
  })

  app.get('/books/genres', async () => ({ genres: await service.genres() }))

  app.get('/books/suggestions', async (req) => ({ results: await service.suggestions(req.userId) }))

  app.get('/books/:id', async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    return service.details(id, req.userId)
  })

  app.get('/books/:id/reviews', async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    const { page } = z.object({ page: z.coerce.number().int().min(1).default(1) }).parse(req.query)
    const book = await prisma.book.findFirst({ where: { OR: [{ id }, { slug: id }] }, select: { id: true, ratingsCount: true } })
    if (!book) throw notFound('Livro')
    return { total: book.ratingsCount, results: await service.reviewsOf(book.id, req.userId, 20, (page - 1) * 20) }
  })
}
