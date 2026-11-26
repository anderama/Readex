import { prisma } from '../../lib/prisma.js'
import { AppError, notFound } from '../../lib/errors.js'
import { bookSummary, userSelect, userSummary } from '../../lib/serializers.js'
import { notify } from '../../lib/notify.js'

export type FeedFilter = 'all' | 'following' | 'reviews' | 'posts'

const hashtagsOf = (text: string) => [...new Set([...text.matchAll(/#([\p{L}\d_]+)/gu)].map((m) => m[1]))].slice(0, 10)

function postOut(p: any, userId: string) {
  return {
    type: 'post' as const,
    id: p.id, text: p.text, spoilerPage: p.spoilerPage, hashtags: p.hashtags, createdAt: p.createdAt,
    user: userSummary(p.user), book: bookSummary(p.book),
    likes: p._count.likes, comments: p._count.comments,
    likedByMe: p.likes.length > 0, mine: p.userId === userId,
  }
}

function reviewActivity(r: any) {
  return {
    type: 'review' as const,
    id: r.id, rating: r.rating, text: r.text, spoiler: r.spoiler, createdAt: r.createdAt,
    activity: r.text ? 'resenhou' : 'avaliou',
    user: userSummary(r.user), book: bookSummary(r.book),
    likes: r._count.likes, likedByMe: r.likes.length > 0,
  }
}

// Feed: resenhas, avaliações e discussões de outros leitores, do mais recente para o mais antigo
export async function feed(userId: string, filter: FeedFilter = 'all', take = 30) {
  let authorFilter: { userId: { in: string[] } } | { userId: { not: string } } = { userId: { not: userId } }
  if (filter === 'following') {
    const follows = await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } })
    authorFilter = { userId: { in: follows.map((f) => f.followingId) } }
  }
  const [reviews, posts] = await Promise.all([
    filter === 'posts' ? [] : prisma.review.findMany({
      where: authorFilter, orderBy: { createdAt: 'desc' }, take,
      include: { user: { select: userSelect }, book: true, _count: { select: { likes: true } }, likes: { where: { userId }, select: { userId: true } } },
    }),
    filter === 'reviews' ? [] : prisma.post.findMany({
      where: filter === 'following' ? authorFilter : {}, orderBy: { createdAt: 'desc' }, take,
      include: { user: { select: userSelect }, book: true, _count: { select: { likes: true, comments: true } }, likes: { where: { userId }, select: { userId: true } } },
    }),
  ])
  return [...reviews.map(reviewActivity), ...posts.map((p) => postOut(p, userId))]
    .sort((a, b) => +b.createdAt - +a.createdAt)
    .slice(0, take)
}

export async function trending() {
  const posts = await prisma.post.findMany({ select: { hashtags: true } })
  const count = new Map<string, number>()
  posts.forEach((p) => p.hashtags.forEach((h) => count.set(h, (count.get(h) ?? 0) + 1)))
  return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag, posts]) => ({ tag, posts }))
}

export async function postsOfBook(bookId: string, userId: string) {
  const book = await prisma.book.findFirst({ where: { OR: [{ id: bookId }, { slug: bookId }] } })
  if (!book) throw notFound('Livro')
  const posts = await prisma.post.findMany({
    where: { bookId: book.id }, orderBy: { createdAt: 'desc' },
    include: { user: { select: userSelect }, book: true, _count: { select: { likes: true, comments: true } }, likes: { where: { userId }, select: { userId: true } } },
  })
  return posts.map((p) => postOut(p, userId))
}

export async function createPost(userId: string, input: { bookId: string; text: string; spoilerPage?: number | null }) {
  const book = await prisma.book.findFirst({ where: { OR: [{ id: input.bookId }, { slug: input.bookId }] } })
  if (!book) throw new AppError(400, 'Escolha o livro da discussão.', 'bookId')
  if (input.spoilerPage && input.spoilerPage > book.pages) throw new AppError(400, `O livro tem ${book.pages} páginas.`, 'spoilerPage')
  const post = await prisma.post.create({
    data: { userId, bookId: book.id, text: input.text.trim(), spoilerPage: input.spoilerPage ?? null, hashtags: hashtagsOf(input.text) },
    include: { user: { select: userSelect }, book: true, _count: { select: { likes: true, comments: true } }, likes: { where: { userId }, select: { userId: true } } },
  })
  return postOut(post, userId)
}

export async function getPost(id: string, userId: string, sort: 'likes' | 'recent' = 'recent') {
  const post = await prisma.post.findUnique({
    where: { id },
    include: { user: { select: userSelect }, book: true, _count: { select: { likes: true, comments: true } }, likes: { where: { userId }, select: { userId: true } } },
  })
  if (!post) throw notFound('Discussão')
  const comments = await prisma.comment.findMany({ where: { postId: id }, include: { user: { select: userSelect } }, orderBy: { createdAt: sort === 'recent' ? 'desc' : 'asc' } })
  return { ...postOut(post, userId), replies: comments.map((c) => ({ id: c.id, text: c.text, createdAt: c.createdAt, user: userSummary(c.user), mine: c.userId === userId })) }
}

export async function addComment(postId: string, userId: string, text: string) {
  const post = await prisma.post.findUnique({ where: { id: postId }, include: { book: true } })
  if (!post) throw notFound('Discussão')
  const c = await prisma.comment.create({ data: { postId, userId, text: text.trim() }, include: { user: { select: userSelect } } })
  await notify({ userId: post.userId, actorId: userId, category: 'social', text: `${c.user.name} respondeu sua discussão sobre ${post.book.title}.`, link: `/comunidade/posts/${post.id}` })
  return { id: c.id, text: c.text, createdAt: c.createdAt, user: userSummary(c.user), mine: true }
}

export async function toggleLike(postId: string, userId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId }, include: { book: true } })
  if (!post) throw notFound('Discussão')
  const key = { userId_postId: { userId, postId } }
  const existing = await prisma.postLike.findUnique({ where: key })
  if (existing) await prisma.postLike.delete({ where: key })
  else {
    await prisma.postLike.create({ data: { userId, postId } })
    const me = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    await notify({ userId: post.userId, actorId: userId, category: 'social', text: `${me.name} curtiu sua discussão sobre ${post.book.title}.`, link: `/comunidade/posts/${post.id}` })
  }
  return { liked: !existing, likes: await prisma.postLike.count({ where: { postId } }) }
}

export async function deletePost(postId: string, userId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) throw notFound('Discussão')
  if (post.userId !== userId) throw new AppError(403, 'Você só pode excluir as suas discussões.')
  await prisma.post.delete({ where: { id: postId } })
}
