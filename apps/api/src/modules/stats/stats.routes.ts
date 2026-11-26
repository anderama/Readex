import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { addDays, dayKey, startOfDay } from '../../lib/dates.js'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MONTHS_FULL = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Estatísticas: Semana (minutos por dia), Mês (livros por mês no ano) e Ano (páginas por mês)
export async function statsRoutes(app: FastifyInstance) {
  app.get('/stats', { preHandler: app.authenticate }, async (req) => {
    const { period } = z.object({ period: z.enum(['week', 'month', 'year']).default('month') }).parse(req.query)
    const userId = req.userId
    const now = new Date()
    const year = now.getFullYear()

    let from: Date
    let to = addDays(startOfDay(now), 1)
    let title: string
    if (period === 'week') { from = addDays(startOfDay(now), -6); title = 'Últimos 7 dias' }
    else if (period === 'month') { from = new Date(year, now.getMonth(), 1); title = `${MONTHS_FULL[now.getMonth()][0].toUpperCase()}${MONTHS_FULL[now.getMonth()].slice(1)} de ${year}` }
    else { from = new Date(year, 0, 1); to = new Date(year + 1, 0, 1); title = String(year) }

    const [logs, finished, notes, yearFinished, yearLogs] = await Promise.all([
      prisma.readingLog.findMany({ where: { userId, createdAt: { gte: from, lt: to } } }),
      prisma.shelfItem.count({ where: { userId, status: 'CONCLUIDO', finishedAt: { gte: from, lt: to } } }),
      prisma.note.count({ where: { userId, createdAt: { gte: from, lt: to } } }),
      prisma.shelfItem.findMany({ where: { userId, status: 'CONCLUIDO', finishedAt: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } }, select: { finishedAt: true } }),
      period === 'year' ? prisma.readingLog.findMany({ where: { userId, createdAt: { gte: new Date(year, 0, 1) } } }) : Promise.resolve([]),
    ])
    const pages = logs.reduce((a, l) => a + Math.max(0, l.toPage - l.fromPage), 0)
    const minutes = logs.reduce((a, l) => a + l.minutes, 0)

    let chart: { title: string; unit: string; bars: { label: string; value: number | null; current: boolean; detail: string }[] }
    if (period === 'week') {
      const byDay = new Map<string, number>()
      logs.forEach((l) => byDay.set(dayKey(l.createdAt), (byDay.get(dayKey(l.createdAt)) ?? 0) + l.minutes))
      chart = {
        title: 'Minutos de leitura por dia', unit: 'min',
        bars: Array.from({ length: 7 }, (_, i) => {
          const d = addDays(startOfDay(now), i - 6)
          const v = byDay.get(dayKey(d)) ?? 0
          return { label: i === 6 ? 'Hoje' : WEEK[d.getDay()], value: v, current: i === 6, detail: `${v} min em ${d.toLocaleDateString('pt-BR')}` }
        }),
      }
    } else if (period === 'month') {
      chart = {
        title: 'Livros terminados por mês', unit: 'livros',
        bars: MONTHS.slice(0, now.getMonth() + 1).map((m, i) => {
          const v = yearFinished.filter((f) => f.finishedAt!.getMonth() === i).length
          return { label: m, value: v, current: i === now.getMonth(), detail: `${v} ${v === 1 ? 'livro terminado' : 'livros terminados'} em ${MONTHS_FULL[i]}` }
        }),
      }
    } else {
      chart = {
        title: 'Páginas lidas por mês', unit: 'páginas',
        bars: MONTHS.map((m, i) => {
          const future = i > now.getMonth()
          const v = yearLogs.filter((l) => l.createdAt.getMonth() === i).reduce((a, l) => a + Math.max(0, l.toPage - l.fromPage), 0)
          return { label: m, value: future ? null : v, current: i === now.getMonth(), detail: future ? `${MONTHS_FULL[i]} ainda não chegou` : `${v.toLocaleString('pt-BR')} páginas em ${MONTHS_FULL[i]}` }
        }),
      }
    }
    return { period, title, totals: { finished, pages, minutes, notes }, chart, yearFinished: yearFinished.length }
  })
}
