import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import * as service from './auth.service.js'
import { prisma } from '../../lib/prisma.js'

export const passwordRule = z.string()
  .min(8, 'Use 8 ou mais caracteres, com letras e números.')
  .regex(/[a-zA-Z]/, 'Use 8 ou mais caracteres, com letras e números.')
  .regex(/\d/, 'Use 8 ou mais caracteres, com letras e números.')
const email = z.string().trim().email('Digite um e-mail válido.')
const code = z.string().regex(/^\d{6}$/, 'O código tem 6 números.')

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (req, reply) => {
    const body = z.object({
      name: z.string().trim().min(2, 'Digite seu nome.'),
      username: z.string().trim().regex(/^[a-zA-Z0-9_.]{3,20}$/, 'Use de 3 a 20 letras, números, ponto ou _.'),
      email,
      password: passwordRule,
      acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Aceite os termos de uso para continuar.' }) }),
    }).parse(req.body)
    reply.code(201).send(await service.register(body))
  })

  app.post('/auth/verify-email', async (req) => {
    const body = z.object({ email, code }).parse(req.body)
    await service.verifyEmail(body.email, body.code)
    return { ok: true }
  })

  app.post('/auth/resend-code', async (req) => {
    const body = z.object({ email, purpose: z.enum(['VERIFY_EMAIL', 'RESET_PASSWORD']) }).parse(req.body)
    return service.resendCode(body.email, body.purpose)
  })

  app.post('/auth/login', { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, async (req) => {
    const body = z.object({
      identifier: z.string().trim().min(1, 'Digite seu e-mail ou nome de usuário.'),
      password: z.string().min(1, 'Digite sua senha.'),
      remember: z.boolean().default(false),
    }).parse(req.body)
    const user = await service.login(body.identifier, body.password)
    // "Manter conectado": token de 30 dias; sem marcar, 1 dia
    const token = app.jwt.sign({ sub: user.id }, { expiresIn: body.remember ? '30d' : '1d' })
    return { token, user: service.publicUser(user) }
  })

  app.post('/auth/forgot-password', async (req) => {
    const body = z.object({ email }).parse(req.body)
    return service.resendCode(body.email, 'RESET_PASSWORD')
  })

  app.post('/auth/verify-reset-code', async (req) => {
    const body = z.object({ email, code }).parse(req.body)
    await service.verifyResetCode(body.email, body.code)
    return { ok: true }
  })

  app.post('/auth/reset-password', async (req) => {
    const body = z.object({ email, code, password: passwordRule }).parse(req.body)
    await service.resetPassword(body.email, body.code, body.password)
    return { ok: true }
  })

  app.get('/auth/me', { preHandler: app.authenticate }, async (req) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } })
    return { user: service.publicUser(user) }
  })
}
