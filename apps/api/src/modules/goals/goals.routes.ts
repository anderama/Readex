import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { monthlyGoal, streak, yearlyGoal } from './goals.service.js'

const target = z.number({ invalid_type_error: 'Digite um número de livros.' }).int().min(1, 'A meta precisa ser de pelo menos 1 livro.').max(365, 'Escolha um número menor.')

export async function goalsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.get('/goals/current', async (req) => {
    const [goal, year, s] = await Promise.all([monthlyGoal(req.userId), yearlyGoal(req.userId), streak(req.userId)])
    return { goal, year, streak: s }
  })

  // Define a meta mensal de livros do mês atual
  app.put('/goals/current', async (req) => {
    const body = z.object({ target }).parse(req.body)
    const now = new Date()
    const key = { userId: req.userId, year: now.getFullYear(), month: now.getMonth() + 1 }
    await prisma.goal.upsert({ where: { userId_year_month: key }, create: { ...key, target: body.target }, update: { target: body.target } })
    return { goal: await monthlyGoal(req.userId) }
  })

  app.put('/goals/year', async (req) => {
    const body = z.object({ target: target.nullable() }).parse(req.body)
    const key = { userId: req.userId, year: new Date().getFullYear(), month: 0 }
    if (body.target === null) await prisma.goal.deleteMany({ where: key })
    else await prisma.goal.upsert({ where: { userId_year_month: key }, create: { ...key, target: body.target }, update: { target: body.target } })
    return { year: await yearlyGoal(req.userId) }
  })

  app.put('/goals/daily', async (req) => {
    const { minutes } = z.object({ minutes: z.number().int().min(5, 'Escolha pelo menos 5 minutos.').max(600, 'Escolha até 600 minutos.') }).parse(req.body)
    await prisma.user.update({ where: { id: req.userId }, data: { dailyGoalMinutes: minutes } })
    return { streak: await streak(req.userId) }
  })
}
