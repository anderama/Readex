import type { ShelfStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { AppError, notFound } from '../../lib/errors.js'
import { bookSummary, progressOf } from '../../lib/serializers.js'
import { notify } from '../../lib/notify.js'
import { monthlyGoal } from '../goals/goals.service.js'

async function getBook(bookId: string) {
  const book = await prisma.book.findFirst({ where: { OR: [{ id: bookId }, { slug: bookId }] } })
  if (!book) throw notFound('Livro')
  return book
}

export function itemOut(i: { status: ShelfStatus; currentPage: number; startedAt: Date | null; finishedAt: Date | null; updatedAt: Date; book: Parameters<typeof bookSummary>[0] }) {
  return {
    status: i.status, startedAt: i.startedAt, finishedAt: i.finishedAt, updatedAt: i.updatedAt,
    progress: progressOf(i.currentPage, i.book.pages), book: bookSummary(i.book),
  }
}

export async function list(userId: string) {
  const items = await prisma.shelfItem.findMany({ where: { userId }, include: { book: true }, orderBy: { updatedAt: 'desc' } })
  const out = items.map(itemOut)
  return {
    total: out.length,
    LENDO: out.filter((i) => i.status === 'LENDO'),
    QUERO_LER: out.filter((i) => i.status === 'QUERO_LER'),
    CONCLUIDO: out.filter((i) => i.status === 'CONCLUIDO').sort((a, b) => +new Date(b.finishedAt ?? 0) - +new Date(a.finishedAt ?? 0)),
  }
}

// Adiciona ou muda o status. Um livro só fica em um status por vez (upsert pela chave usuário+livro).
export async function setStatus(userId: string, bookId: string, status: ShelfStatus, currentPage?: number) {
  const book = await getBook(bookId)
  const existing = await prisma.shelfItem.findUnique({ where: { userId_bookId: { userId, bookId: book.id } } })
  const now = new Date()
  const data: { status: ShelfStatus; currentPage?: number; startedAt?: Date | null; finishedAt?: Date | null } = { status }
  if (currentPage !== undefined) data.currentPage = Math.min(Math.max(0, currentPage), book.pages)
  if (status === 'LENDO') {
    data.startedAt = existing?.startedAt ?? now
    data.finishedAt = null
    if (existing?.status === 'CONCLUIDO' && currentPage === undefined) data.currentPage = 0
  }
  if (status === 'CONCLUIDO') {
    data.currentPage = book.pages
    data.finishedAt = existing?.status === 'CONCLUIDO' ? existing.finishedAt : now
    data.startedAt = existing?.startedAt ?? now
  }
  if (status === 'QUERO_LER') data.finishedAt = null
  const item = await prisma.shelfItem.upsert({
    where: { userId_bookId: { userId, bookId: book.id } },
    create: { userId, bookId: book.id, ...data },
    update: data,
    include: { book: true },
  })
  if (status === 'CONCLUIDO' && existing?.status !== 'CONCLUIDO') await afterCompletion(userId)
  return itemOut(item)
}

export async function remove(userId: string, bookId: string) {
  const book = await getBook(bookId)
  const existing = await prisma.shelfItem.findUnique({ where: { userId_bookId: { userId, bookId: book.id } } })
  if (!existing) throw notFound('Livro na estante')
  await prisma.shelfItem.delete({ where: { id: existing.id } })
  // Devolve o estado anterior para o "Desfazer"
  return { status: existing.status, currentPage: existing.currentPage }
}

async function afterCompletion(userId: string) {
  const goal = await monthlyGoal(userId)
  if (goal.target && goal.done === goal.target) {
    await notify({ userId, category: 'goals', text: `Meta atingida! Você leu ${goal.target} ${goal.target === 1 ? 'livro' : 'livros'} este mês.`, link: '/progresso' })
  }
}

// Registra páginas lidas. Ao chegar em 100%, o livro vai sozinho para "Concluído".
export async function updateProgress(userId: string, bookId: string, input: { page?: number; percent?: number; minutes?: number; comment?: string }) {
  const book = await getBook(bookId)
  const item = await prisma.shelfItem.findUnique({ where: { userId_bookId: { userId, bookId: book.id } } })
  let page = input.page ?? Math.round(((input.percent ?? 0) / 100) * book.pages)
  if (page > book.pages) throw new AppError(400, `O livro tem ${book.pages} páginas. Digite um número até ${book.pages}.`, 'page')
  if (page < 0) throw new AppError(400, 'Digite um número de página válido.', 'page')
  const from = item?.currentPage ?? 0
  if (item?.status === 'CONCLUIDO') page = book.pages
  const read = Math.max(0, page - from)
  const completed = page >= book.pages
  const now = new Date()
  const updated = await prisma.shelfItem.upsert({
    where: { userId_bookId: { userId, bookId: book.id } },
    create: { userId, bookId: book.id, status: completed ? 'CONCLUIDO' : 'LENDO', currentPage: page, startedAt: now, finishedAt: completed ? now : null },
    update: {
      currentPage: page,
      status: completed ? 'CONCLUIDO' : 'LENDO',
      startedAt: item?.startedAt ?? now,
      finishedAt: completed ? (item?.finishedAt ?? now) : null,
    },
    include: { book: true },
  })
  if (read > 0 || input.minutes) {
    await prisma.readingLog.create({
      data: { userId, bookId: book.id, fromPage: from, toPage: page, minutes: input.minutes ?? Math.max(1, Math.round(read * 1.5)), comment: input.comment || null },
    })
  }
  const wasCompleted = item?.status === 'CONCLUIDO'
  if (completed && !wasCompleted) await afterCompletion(userId)
  return { item: itemOut(updated), pagesRead: read, completed: completed && !wasCompleted, goal: await monthlyGoal(userId) }
}
