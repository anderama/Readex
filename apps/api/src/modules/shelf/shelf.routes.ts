import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import * as service from './shelf.service.js'

const params = z.object({ bookId: z.string() })

export async function shelfRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.get('/shelf', async (req) => service.list(req.userId))

  app.put('/shelf/:bookId', async (req) => {
    const { bookId } = params.parse(req.params)
    const body = z.object({
      status: z.enum(['QUERO_LER', 'LENDO', 'CONCLUIDO']),
      currentPage: z.number().int().min(0).optional(),
    }).parse(req.body)
    return { item: await service.setStatus(req.userId, bookId, body.status, body.currentPage) }
  })

  app.delete('/shelf/:bookId', async (req) => {
    const { bookId } = params.parse(req.params)
    return { removed: await service.remove(req.userId, bookId) }
  })

  app.post('/shelf/:bookId/progress', async (req) => {
    const { bookId } = params.parse(req.params)
    const body = z.object({
      page: z.number({ invalid_type_error: 'Digite a página em que você parou.' }).int('Digite um número inteiro.').min(0).optional(),
      percent: z.number().min(0).max(100, 'Digite um valor entre 0 e 100.').optional(),
      minutes: z.number().int().min(0).max(1440).optional(),
      comment: z.string().max(280, 'Use até 280 caracteres.').optional(),
    }).refine((b) => b.page !== undefined || b.percent !== undefined, { message: 'Digite a página em que você parou.', path: ['page'] })
      .parse(req.body)
    return service.updateProgress(req.userId, bookId, body)
  })
}
