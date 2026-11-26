import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { AppError, notFound } from '../../lib/errors.js'

const noteBody = z.object({
  kind: z.enum(['CITACAO', 'NOTA']).default('NOTA'),
  page: z.number().int().positive().nullable().optional(),
  text: z.string().trim().min(1, 'Escreva a anotação.').max(2000, 'Use até 2.000 caracteres.'),
  comment: z.string().trim().max(500).nullable().optional(),
  isPublic: z.boolean().default(false),
})

const noteOut = (n: any) => ({ id: n.id, kind: n.kind, page: n.page, text: n.text, comment: n.comment, isPublic: n.isPublic, createdAt: n.createdAt })

// Anotações: começam privadas; "Mostrar no meu perfil" torna pública
export async function notesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.get('/books/:bookId/notes', async (req) => {
    const { bookId } = z.object({ bookId: z.string() }).parse(req.params)
    const book = await prisma.book.findFirst({ where: { OR: [{ id: bookId }, { slug: bookId }] } })
    if (!book) throw notFound('Livro')
    const notes = await prisma.note.findMany({ where: { bookId: book.id, userId: req.userId }, orderBy: { createdAt: 'desc' } })
    return { results: notes.map(noteOut) }
  })

  app.post('/books/:bookId/notes', async (req, reply) => {
    const { bookId } = z.object({ bookId: z.string() }).parse(req.params)
    const body = noteBody.parse(req.body)
    const book = await prisma.book.findFirst({ where: { OR: [{ id: bookId }, { slug: bookId }] } })
    if (!book) throw notFound('Livro')
    if (body.page && body.page > book.pages) throw new AppError(400, `O livro tem ${book.pages} páginas.`, 'page')
    const note = await prisma.note.create({ data: { ...body, page: body.page ?? null, comment: body.comment || null, userId: req.userId, bookId: book.id } })
    reply.code(201).send({ note: noteOut(note) })
  })

  app.patch('/notes/:id', async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    const body = noteBody.partial().parse(req.body)
    const note = await prisma.note.findUnique({ where: { id } })
    if (!note || note.userId !== req.userId) throw notFound('Anotação')
    return { note: noteOut(await prisma.note.update({ where: { id }, data: body })) }
  })

  app.delete('/notes/:id', async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    const note = await prisma.note.findUnique({ where: { id } })
    if (!note || note.userId !== req.userId) throw notFound('Anotação')
    await prisma.note.delete({ where: { id } })
    return { removed: noteOut(note) }
  })
}
