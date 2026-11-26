import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../lib/errors.js'
import { passwordRule } from '../auth/auth.routes.js'

export async function accountRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // Senha e segurança: pede a senha atual
  app.put('/me/password', async (req) => {
    const body = z.object({ current: z.string().min(1, 'Digite sua senha atual.'), password: passwordRule }).parse(req.body)
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } })
    if (!(await bcrypt.compare(body.current, user.passwordHash))) throw new AppError(400, 'Senha atual incorreta.', 'current')
    await prisma.user.update({ where: { id: req.userId }, data: { passwordHash: await bcrypt.hash(body.password, 10) } })
    return { ok: true }
  })

  // Baixar meus dados: arquivo JSON com tudo o que é do usuário
  app.get('/me/export', async (req, reply) => {
    const data = await prisma.user.findUniqueOrThrow({
      where: { id: req.userId },
      select: {
        name: true, username: true, email: true, bio: true, createdAt: true, favoriteGenres: true, dailyGoalMinutes: true,
        shelf: { select: { status: true, currentPage: true, startedAt: true, finishedAt: true, book: { select: { title: true, author: true } } } },
        reviews: { select: { rating: true, text: true, createdAt: true, book: { select: { title: true } } } },
        notes: { select: { kind: true, page: true, text: true, isPublic: true, createdAt: true, book: { select: { title: true } } } },
        goals: { select: { year: true, month: true, target: true } },
        posts: { select: { text: true, createdAt: true, book: { select: { title: true } } } },
        logs: { select: { fromPage: true, toPage: true, minutes: true, createdAt: true, book: { select: { title: true } } } },
      },
    })
    reply.header('Content-Disposition', 'attachment; filename="readex-meus-dados.json"')
    return { exportedAt: new Date(), ...data }
  })

  // Excluir conta: imediata e permanente, só com o texto EXCLUIR
  app.delete('/me', async (req) => {
    const { confirm } = z.object({ confirm: z.string() }).parse(req.body)
    if (confirm !== 'EXCLUIR') throw new AppError(400, 'Digite EXCLUIR, em letras maiúsculas, para confirmar.', 'confirm')
    const reviewed = await prisma.review.findMany({ where: { userId: req.userId }, select: { bookId: true } })
    await prisma.user.delete({ where: { id: req.userId } })
    // Mantém as médias dos livros corretas depois de apagar as avaliações
    for (const { bookId } of reviewed) {
      const agg = await prisma.review.aggregate({ where: { bookId }, _avg: { rating: true }, _count: true })
      await prisma.book.update({ where: { id: bookId }, data: { avgRating: agg._avg.rating ?? 0, ratingsCount: agg._count } })
    }
    return { ok: true }
  })
}
