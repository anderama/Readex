import type { ShelfStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { notFound } from '../../lib/errors.js'
import { bookSummary, progressOf, userSelect, userSummary } from '../../lib/serializers.js'

// Normaliza texto para busca sem acento e sem diferenciar maiúsculas
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

async function statusMap(userId: string) {
  const items = await prisma.shelfItem.findMany({ where: { userId }, select: { bookId: true, status: true } })
  return new Map<string, ShelfStatus>(items.map((i) => [i.bookId, i.status]))
}

export async function search(userId: string, opts: { q?: string; genres?: string[]; maxPages?: number }) {
  const [books, statuses] = await Promise.all([prisma.book.findMany({ orderBy: { title: 'asc' } }), statusMap(userId)])
  const q = opts.q ? norm(opts.q) : ''
  const digits = q.replace(/\D/g, '')
  const genres = (opts.genres ?? []).map(norm)
  const results = books.filter((b) => {
    const byIsbn = digits.length >= 10 && !!b.isbn && b.isbn === digits
    const matchQ = !q || norm(b.title).includes(q) || norm(b.author).includes(q) || b.genres.some((g) => norm(g).includes(q)) || byIsbn
    const matchG = genres.length === 0 || b.genres.some((g) => genres.includes(norm(g)))
    const matchP = !opts.maxPages || b.pages <= opts.maxPages
    return matchQ && matchG && matchP
  })
  return results.map((b) => ({ ...bookSummary(b), myStatus: statuses.get(b.id) ?? null }))
}

export async function genres() {
  const books = await prisma.book.findMany({ select: { genres: true } })
  const count = new Map<string, number>()
  books.forEach((b) => b.genres.forEach((g) => count.set(g, (count.get(g) ?? 0) + 1)))
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g)
}

// "Sugerido para você": livros fora da estante, priorizando os gêneros favoritos e a nota média
export async function suggestions(userId: string, limit = 4) {
  const [user, shelf, books] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { favoriteGenres: true } }),
    prisma.shelfItem.findMany({ where: { userId }, include: { book: { select: { genres: true } } } }),
    prisma.book.findMany(),
  ])
  const owned = new Set(shelf.map((s) => s.bookId))
  const taste = new Map<string, number>()
  user.favoriteGenres.forEach((g) => taste.set(g, (taste.get(g) ?? 0) + 3))
  shelf.forEach((s) => s.book.genres.forEach((g) => taste.set(g, (taste.get(g) ?? 0) + 1)))
  return books
    .filter((b) => !owned.has(b.id))
    .map((b) => {
      const match = b.genres.find((g) => taste.has(g))
      return { b, score: b.genres.reduce((acc, g) => acc + (taste.get(g) ?? 0), 0) + b.avgRating, reason: match }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ b, reason }) => ({ ...bookSummary(b), myStatus: null, reason: reason ? `Porque você lê ${reason.toLowerCase()}` : 'Bem avaliado pela comunidade' }))
}

function reviewOut(r: { id: string; rating: number; text: string | null; spoiler: boolean; tags: string[]; createdAt: Date; user: { id: string; name: string; username: string; avatarUrl: string | null }; _count?: { likes: number }; likes?: { userId: string }[] }) {
  return {
    id: r.id, rating: r.rating, text: r.text, spoiler: r.spoiler, tags: r.tags, createdAt: r.createdAt,
    user: userSummary(r.user), likes: r._count?.likes ?? 0, likedByMe: (r.likes?.length ?? 0) > 0,
  }
}

export async function reviewsOf(bookId: string, userId: string, take = 20, skip = 0) {
  const rows = await prisma.review.findMany({
    where: { bookId }, orderBy: { createdAt: 'desc' }, take, skip,
    include: { user: { select: userSelect }, _count: { select: { likes: true } }, likes: { where: { userId }, select: { userId: true } } },
  })
  return rows.map(reviewOut)
}

export async function details(idOrSlug: string, userId: string) {
  const book = await prisma.book.findFirst({ where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] } })
  if (!book) throw notFound('Livro')
  const [shelf, myReview, reviews, notesCount, postsCount, readers] = await Promise.all([
    prisma.shelfItem.findUnique({ where: { userId_bookId: { userId, bookId: book.id } } }),
    prisma.review.findUnique({ where: { userId_bookId: { userId, bookId: book.id } }, include: { user: { select: userSelect } } }),
    reviewsOf(book.id, userId, 5),
    prisma.note.count({ where: { bookId: book.id, userId } }),
    prisma.post.count({ where: { bookId: book.id } }),
    prisma.shelfItem.count({ where: { bookId: book.id, status: 'LENDO' } }),
  ])
  return {
    ...bookSummary(book),
    publisher: book.publisher,
    year: book.year,
    isbn: book.isbn,
    synopsis: book.synopsis,
    readersNow: readers,
    shelf: shelf && {
      status: shelf.status, startedAt: shelf.startedAt, finishedAt: shelf.finishedAt, updatedAt: shelf.updatedAt,
      progress: progressOf(shelf.currentPage, book.pages),
    },
    myReview: myReview && reviewOut(myReview),
    reviews,
    counts: { notes: notesCount, posts: postsCount, reviews: book.ratingsCount },
  }
}
