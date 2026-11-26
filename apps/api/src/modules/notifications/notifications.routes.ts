import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { CATEGORIES, readPrefs } from '../../lib/notify.js'
import { userSummary, userSelect } from '../../lib/serializers.js'

export async function notificationsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.get('/notifications', async (req) => {
    const { filter, limit } = z.object({ filter: z.enum(['all', 'unread']).default('all'), limit: z.coerce.number().int().max(100).default(50) }).parse(req.query)
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.userId, ...(filter === 'unread' ? { readAt: null } : {}) },
        include: { actor: { select: userSelect } }, orderBy: { createdAt: 'desc' }, take: limit,
      }),
      prisma.notification.count({ where: { userId: req.userId, readAt: null } }),
    ])
    return {
      unread,
      items: items.map((n) => ({ id: n.id, category: n.category, text: n.text, link: n.link, read: !!n.readAt, createdAt: n.createdAt, actor: n.actor && userSummary(n.actor) })),
    }
  })

  app.get('/notifications/unread-count', async (req) => ({ unread: await prisma.notification.count({ where: { userId: req.userId, readAt: null } }) }))

  // "Marcar todas como lidas" devolve os ids para o Desfazer
  app.post('/notifications/read-all', async (req) => {
    const ids = (await prisma.notification.findMany({ where: { userId: req.userId, readAt: null }, select: { id: true } })).map((n) => n.id)
    await prisma.notification.updateMany({ where: { id: { in: ids } }, data: { readAt: new Date() } })
    return { ids }
  })

  app.post('/notifications/mark-unread', async (req) => {
    const { ids } = z.object({ ids: z.array(z.string()) }).parse(req.body)
    await prisma.notification.updateMany({ where: { id: { in: ids }, userId: req.userId }, data: { readAt: null } })
    return { ok: true }
  })

  app.post('/notifications/:id/read', async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    await prisma.notification.updateMany({ where: { id, userId: req.userId }, data: { readAt: new Date() } })
    return { ok: true }
  })

  app.get('/me/notification-prefs', async (req) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId }, select: { notificationPrefs: true } })
    return { prefs: readPrefs(user.notificationPrefs) }
  })

  app.put('/me/notification-prefs', async (req) => {
    const channel = z.object({ inApp: z.boolean(), push: z.boolean() })
    const prefs = z.object(Object.fromEntries(CATEGORIES.map((c) => [c, channel])) as Record<(typeof CATEGORIES)[number], typeof channel>).parse(req.body)
    await prisma.user.update({ where: { id: req.userId }, data: { notificationPrefs: prefs } })
    return { prefs }
  })
}
