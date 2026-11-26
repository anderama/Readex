import { prisma } from './prisma.js'

// Categorias de notificação (as mesmas 6 das preferências no design)
export const CATEGORIES = ['social', 'followers', 'reminder', 'goals', 'recommendations', 'weekly'] as const
export type Category = (typeof CATEGORIES)[number]

export type Prefs = Record<Category, { inApp: boolean; push: boolean }>

export const defaultPrefs = (): Prefs =>
  Object.fromEntries(CATEGORIES.map((c) => [c, { inApp: true, push: c !== 'recommendations' }])) as Prefs

export function readPrefs(raw: unknown): Prefs {
  return { ...defaultPrefs(), ...((raw as Partial<Prefs>) ?? {}) }
}

// Cria uma notificação no app se o destinatário não desligou a categoria
export async function notify(input: { userId: string; actorId?: string; category: Category; text: string; link?: string }) {
  if (input.actorId && input.actorId === input.userId) return
  const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { notificationPrefs: true } })
  if (!user) return
  if (!readPrefs(user.notificationPrefs)[input.category].inApp) return
  await prisma.notification.create({ data: input })
}
