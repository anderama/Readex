import fp from 'fastify-plugin'
import jwt from '@fastify/jwt'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string }
    user: { sub: string }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
  interface FastifyRequest {
    userId: string
  }
}

// Middleware de autenticação: valida o JWT do header Authorization
export default fp(async (app) => {
  await app.register(jwt, { secret: env.JWT_SECRET, sign: { expiresIn: env.JWT_EXPIRES_IN } })
  app.decorateRequest('userId', '')
  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify()
    } catch {
      const message = req.headers.authorization ? 'Sua sessão expirou. Entre de novo.' : 'Entre na sua conta para continuar.'
      return reply.code(401).send({ message })
    }
    const exists = await prisma.user.findUnique({ where: { id: req.user.sub }, select: { id: true } })
    if (!exists) return reply.code(401).send({ message: 'Conta não encontrada.' })
    req.userId = req.user.sub
  })
})
