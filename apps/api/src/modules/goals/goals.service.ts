import { prisma } from '../../lib/prisma.js'
import { addDays, dayKey, endOfMonth, startOfDay, startOfMonth } from '../../lib/dates.js'
import { bookSummary } from '../../lib/serializers.js'

const WEEK_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

// Meta mensal: livros concluídos no mês / meta, com percentual e ritmo
export async function monthlyGoal(userId: string, ref = new Date()) {
  const year = ref.getFullYear()
  const month = ref.getMonth() + 1
  const [goal, finished] = await Promise.all([
    prisma.goal.findUnique({ where: { userId_year_month: { userId, year, month } } }),
    prisma.shelfItem.findMany({
      where: { userId, status: 'CONCLUIDO', finishedAt: { gte: startOfMonth(ref), lt: endOfMonth(ref) } },
      include: { book: true }, orderBy: { finishedAt: 'asc' },
    }),
  ])
  const done = finished.length
  const target = goal?.target ?? null
  const daysInMonth = new Date(year, month, 0).getDate()
  const daysLeft = daysInMonth - ref.getDate()
  let pace: string | null = null
  if (target) {
    const left = Math.max(0, target - done)
    if (left === 0) pace = 'Você bateu a meta deste mês.'
    else {
      const expected = (target * ref.getDate()) / daysInMonth
      const rhythm = done >= expected ? 'Você está no ritmo.' : 'Um pouco abaixo do ritmo, mas dá tempo.'
      pace = `Faltam ${left} ${left === 1 ? 'livro' : 'livros'} em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}. ${rhythm}`
    }
  }
  return {
    year, month, target, done,
    percent: target ? Math.min(100, Math.round((done / target) * 100)) : 0,
    achieved: !!target && done >= target,
    daysLeft, pace,
    books: finished.map((f) => ({ ...bookSummary(f.book), finishedAt: f.finishedAt })),
  }
}

// Meta do ano (opcional): guardada como meta do "mês 0"
export async function yearlyGoal(userId: string, ref = new Date()) {
  const year = ref.getFullYear()
  const [goal, done] = await Promise.all([
    prisma.goal.findUnique({ where: { userId_year_month: { userId, year, month: 0 } } }),
    prisma.shelfItem.count({ where: { userId, status: 'CONCLUIDO', finishedAt: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } } }),
  ])
  const target = goal?.target ?? null
  return { year, target, done, percent: target ? Math.min(100, Math.round((done / target) * 100)) : 0 }
}

// Sequência de dias com leitura registrada e meta diária em minutos
export async function streak(userId: string) {
  const [user, logs] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { dailyGoalMinutes: true } }),
    prisma.readingLog.findMany({ where: { userId }, select: { createdAt: true, minutes: true }, orderBy: { createdAt: 'asc' } }),
  ])
  const minutesByDay = new Map<string, number>()
  logs.forEach((l) => { const k = dayKey(l.createdAt); minutesByDay.set(k, (minutesByDay.get(k) ?? 0) + l.minutes) })
  // Um dia conta na sequência quando a meta diária de minutos foi cumprida
  const has = (d: Date) => (minutesByDay.get(dayKey(d)) ?? 0) >= user.dailyGoalMinutes

  const today = startOfDay()
  let cursor = has(today) ? today : addDays(today, -1)
  let current = 0
  while (has(cursor)) { current++; cursor = addDays(cursor, -1) }

  // Recorde: maior sequência no histórico
  let record = 0
  let run = 0
  let prev: Date | null = null
  for (const k of [...minutesByDay.keys()].filter((k) => minutesByDay.get(k)! >= user.dailyGoalMinutes).sort()) {
    const d = new Date(`${k}T00:00:00`)
    run = prev && dayKey(addDays(prev, 1)) === k ? run + 1 : 1
    record = Math.max(record, run)
    prev = d
  }

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i - 6)
    return { date: dayKey(d), label: i === 6 ? 'Hoje' : WEEK_LETTERS[d.getDay()], done: has(d), today: i === 6 }
  })
  return {
    current, record: Math.max(record, current), week,
    daily: { goalMinutes: user.dailyGoalMinutes, todayMinutes: minutesByDay.get(dayKey(today)) ?? 0 },
  }
}
