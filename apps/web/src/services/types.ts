// Tipos das respostas da API
export type ShelfStatus = 'QUERO_LER' | 'LENDO' | 'CONCLUIDO'

export interface User {
  id: string; name: string; username: string; email: string; bio: string; avatarUrl: string | null
  onboarded: boolean; favoriteGenres: string[]; dailyGoalMinutes: number; createdAt: string
}
export interface UserSummary { id: string; name: string; username: string; avatarUrl: string | null }

export interface Book {
  id: string; slug: string; title: string; author: string; genres: string[]; pages: number
  coverUrl: string | null; coverTone: string; avgRating: number; ratingsCount: number
  myStatus?: ShelfStatus | null; reason?: string
}
export interface Progress { currentPage: number; pages: number; remaining: number; percent: number }
export interface ShelfItem { status: ShelfStatus; startedAt: string | null; finishedAt: string | null; updatedAt: string; progress: Progress; book: Book }

export interface Review {
  id: string; rating: number; text: string | null; spoiler: boolean; tags: string[]; createdAt: string
  user: UserSummary; likes: number; likedByMe: boolean
}
export interface BookDetails extends Book {
  publisher: string; year: number; isbn: string | null; synopsis: string; readersNow: number
  shelf: { status: ShelfStatus; startedAt: string | null; finishedAt: string | null; updatedAt: string; progress: Progress } | null
  myReview: Review | null; reviews: Review[]
  counts: { notes: number; posts: number; reviews: number }
}

export interface Goal {
  year: number; month: number; target: number | null; done: number; percent: number; achieved: boolean
  daysLeft: number; pace: string | null; books: (Book & { finishedAt: string })[]
}
export interface YearGoal { year: number; target: number | null; done: number; percent: number }
export interface Streak {
  current: number; record: number
  week: { date: string; label: string; done: boolean; today: boolean }[]
  daily: { goalMinutes: number; todayMinutes: number }
}

export interface ReviewActivity { type: 'review'; id: string; rating: number; text: string | null; spoiler: boolean; createdAt: string; activity: string; user: UserSummary; book: Book; likes: number; likedByMe: boolean }
export interface Post { type: 'post'; id: string; text: string; spoilerPage: number | null; hashtags: string[]; createdAt: string; user: UserSummary; book: Book; likes: number; comments: number; likedByMe: boolean; mine: boolean }
export interface Reply { id: string; text: string; createdAt: string; user: UserSummary; mine: boolean }
export type FeedItem = ReviewActivity | Post

export interface Dashboard {
  readingNow: ShelfItem | null; lastReadAt: string | null; alsoReading: ShelfItem[]
  goal: Goal; streak: Streak; suggestions: Book[]; community: FeedItem[]
}

export interface Note { id: string; kind: 'CITACAO' | 'NOTA'; page: number | null; text: string; comment: string | null; isPublic: boolean; createdAt: string; book?: Book }

export interface Profile {
  user: UserSummary & { bio: string; createdAt: string }
  isMe: boolean; isFollowing: boolean
  stats: { read: number; reading: number; reviews: number; notes: number; following: number; followers: number; readThisYear: number; goal: { done: number; target: number | null; percent: number } }
}

export interface Notification { id: string; category: string; text: string; link: string | null; read: boolean; createdAt: string; actor: UserSummary | null }
export type NotificationPrefs = Record<string, { inApp: boolean; push: boolean }>

export interface Stats {
  period: 'week' | 'month' | 'year'; title: string
  totals: { finished: number; pages: number; minutes: number; notes: number }
  chart: { title: string; unit: string; bars: { label: string; value: number | null; current: boolean; detail: string }[] }
  yearFinished: number
}
