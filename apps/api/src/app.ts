import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { ZodError } from 'zod'
import { env } from './config/env.js'
import { AppError } from './lib/errors.js'
import authPlugin from './plugins/auth.js'
import { authRoutes } from './modules/auth/auth.routes.js'
import { booksRoutes } from './modules/books/books.routes.js'
import { shelfRoutes } from './modules/shelf/shelf.routes.js'
import { reviewsRoutes } from './modules/reviews/reviews.routes.js'
import { goalsRoutes } from './modules/goals/goals.routes.js'
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js'
import { statsRoutes } from './modules/stats/stats.routes.js'
import { communityRoutes } from './modules/community/community.routes.js'
import { notesRoutes } from './modules/notes/notes.routes.js'
import { usersRoutes } from './modules/users/users.routes.js'
import { notificationsRoutes } from './modules/notifications/notifications.routes.js'
import { accountRoutes } from './modules/account/account.routes.js'

export async function buildApp() {
  const app = Fastify({ logger: { level: 'warn' }, bodyLimit: 1_000_000 })

  await app.register(cors, {
    origin: env.WEB_ORIGIN.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
  await app.register(rateLimit, { global: false })
  await app.register(authPlugin)

  // Erros padronizados: { message, field?, fields? } para a interface mostrar nos campos
  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ZodError) {
      const fields: Record<string, string> = {}
      err.issues.forEach((i) => { const k = i.path.join('.') || 'form'; fields[k] ??= i.message })
      return reply.code(400).send({ message: err.issues[0]?.message ?? 'Confira os campos.', fields })
    }
    if (err instanceof AppError) {
      return reply.code(err.statusCode).send({ message: err.message, field: err.field, ...((err as AppError & { extra?: object }).extra ?? {}) })
    }
    if ((err as { statusCode?: number }).statusCode === 429) return reply.code(429).send({ message: 'Muitas tentativas. Espere um pouco e tente de novo.' })
    app.log.error(err)
    return reply.code(500).send({ message: 'Algo deu errado do nosso lado. Tente de novo.' })
  })

  app.get('/health', async () => ({ ok: true }))

  for (const routes of [authRoutes, booksRoutes, shelfRoutes, reviewsRoutes, goalsRoutes, dashboardRoutes, statsRoutes, communityRoutes, notesRoutes, usersRoutes, notificationsRoutes, accountRoutes]) {
    await app.register(routes, { prefix: '/api' })
  }
  return app
}
