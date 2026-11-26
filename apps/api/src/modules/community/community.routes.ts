import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import * as service from './community.service.js'

export async function communityRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.get('/feed', async (req) => {
    const { filter } = z.object({ filter: z.enum(['all', 'following', 'reviews', 'posts']).default('all') }).parse(req.query)
    const [items, trending] = await Promise.all([service.feed(req.userId, filter), service.trending()])
    return { items, trending }
  })

  app.get('/books/:bookId/posts', async (req) => {
    const { bookId } = z.object({ bookId: z.string() }).parse(req.params)
    return { results: await service.postsOfBook(bookId, req.userId) }
  })

  // Nova discussão: livro obrigatório; hashtags extraídas do texto; spoiler "até a página X"
  app.post('/posts', async (req, reply) => {
    const body = z.object({
      bookId: z.string({ required_error: 'Escolha o livro da discussão.' }).min(1, 'Escolha o livro da discussão.'),
      text: z.string().trim().min(1, 'Escreva alguma coisa para publicar.').max(5000),
      spoilerPage: z.number().int().positive().nullable().optional(),
    }).parse(req.body)
    reply.code(201).send({ post: await service.createPost(req.userId, body) })
  })

  app.get('/posts/:id', async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    const { sort } = z.object({ sort: z.enum(['likes', 'recent']).default('recent') }).parse(req.query)
    return { post: await service.getPost(id, req.userId, sort) }
  })

  app.post('/posts/:id/comments', async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    const { text } = z.object({ text: z.string().trim().min(1, 'Escreva sua resposta.').max(2000) }).parse(req.body)
    reply.code(201).send({ reply: await service.addComment(id, req.userId, text) })
  })

  app.post('/posts/:id/like', async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    return service.toggleLike(id, req.userId)
  })

  app.delete('/posts/:id', async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    await service.deletePost(id, req.userId)
    return { ok: true }
  })
}
