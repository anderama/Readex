import type { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { itemOut } from '../shelf/shelf.service.js'
import { monthlyGoal, streak } from '../goals/goals.service.js'
import { suggestions } from '../books/books.service.js'
import { feed } from '../community/community.service.js'

// Painel inicial: Lendo agora, Também lendo, Meta do mês, sequência, Sugerido para você e Da comunidade
export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/dashboard', { preHandler: app.authenticate }, async (req) => {
    const userId = req.userId
    const [reading, goal, s, suggested, community] = await Promise.all([
      prisma.shelfItem.findMany({ where: { userId, status: 'LENDO' }, include: { book: true }, orderBy: { updatedAt: 'desc' } }),
      monthlyGoal(userId),
      streak(userId),
      suggestions(userId, 3),
      feed(userId, 'all', 3),
    ])
    const [current, ...others] = reading.map(itemOut)
    // Última leitura do livro em destaque ("Última leitura ontem")
    const last = current
      ? await prisma.readingLog.findFirst({ where: { userId, bookId: current.book.id }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } })
      : null
    return {
      readingNow: current ?? null,
      lastReadAt: last?.createdAt ?? null,
      alsoReading: others,
      goal,
      streak: s,
      suggestions: suggested,
      community,
    }
  })
}
