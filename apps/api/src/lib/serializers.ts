// Formatos de resposta compartilhados entre os módulos
import type { Book, User } from '@prisma/client'

export function bookSummary(b: Book) {
  return {
    id: b.id,
    slug: b.slug,
    title: b.title,
    author: b.author,
    genres: b.genres,
    pages: b.pages,
    coverUrl: b.coverUrl,
    coverTone: b.coverTone,
    avgRating: Math.round(b.avgRating * 10) / 10,
    ratingsCount: b.ratingsCount,
  }
}

export function userSummary(u: Pick<User, 'id' | 'name' | 'username' | 'avatarUrl'>) {
  return { id: u.id, name: u.name, username: u.username, avatarUrl: u.avatarUrl }
}

export const userSelect = { id: true, name: true, username: true, avatarUrl: true } as const

// Progresso: páginas lidas / total, restantes e percentual
export function progressOf(currentPage: number, pages: number) {
  const percent = pages > 0 ? Math.min(100, Math.round((currentPage / pages) * 100)) : 0
  return { currentPage, pages, remaining: Math.max(0, pages - currentPage), percent }
}
