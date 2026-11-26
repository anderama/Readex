import bcrypt from 'bcryptjs'
import { randomInt } from 'node:crypto'
import type { CodePurpose, User } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../lib/errors.js'
import { env } from '../../config/env.js'

const CODE_TTL_MIN = 10
const RESEND_AFTER_S = 45

export function publicUser(u: User) {
  return {
    id: u.id, name: u.name, username: u.username, email: u.email, bio: u.bio, avatarUrl: u.avatarUrl,
    onboarded: u.onboarded, favoriteGenres: u.favoriteGenres, dailyGoalMinutes: u.dailyGoalMinutes, createdAt: u.createdAt,
  }
}

// Gera um código de 6 dígitos, guarda só o hash e "envia" (modo demonstração: aparece no terminal)
async function issueCode(userId: string, email: string, purpose: CodePurpose) {
  const last = await prisma.verificationCode.findFirst({ where: { userId, purpose }, orderBy: { createdAt: 'desc' } })
  if (last && Date.now() - last.createdAt.getTime() < RESEND_AFTER_S * 1000) {
    throw new AppError(429, `Aguarde ${RESEND_AFTER_S} segundos para pedir outro código.`)
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  await prisma.verificationCode.create({
    data: { userId, purpose, codeHash: await bcrypt.hash(code, 8), expiresAt: new Date(Date.now() + CODE_TTL_MIN * 60_000) },
  })
  const label = purpose === 'VERIFY_EMAIL' ? 'de confirmação' : 'de redefinição'
  console.log(`\n[e-mail simulado] Para: ${email} · Código ${label}: ${code}\n`)
  return env.DEMO_CODES ? { demoCode: code } : {}
}

async function checkCode(userId: string, purpose: CodePurpose, code: string, consume: boolean) {
  const rec = await prisma.verificationCode.findFirst({
    where: { userId, purpose, usedAt: null }, orderBy: { createdAt: 'desc' },
  })
  if (!rec || rec.expiresAt < new Date()) throw new AppError(400, 'Esse código expirou. Peça um novo.', 'code')
  if (rec.attempts >= 5) throw new AppError(400, 'Muitas tentativas. Peça um novo código.', 'code')
  const ok = await bcrypt.compare(code, rec.codeHash)
  if (!ok) {
    await prisma.verificationCode.update({ where: { id: rec.id }, data: { attempts: { increment: 1 } } })
    throw new AppError(400, 'Código incorreto. Confira o e-mail e tente de novo.', 'code')
  }
  if (consume) await prisma.verificationCode.update({ where: { id: rec.id }, data: { usedAt: new Date() } })
}

export async function register(input: { name: string; username: string; email: string; password: string }) {
  const email = input.email.toLowerCase().trim()
  const username = input.username.toLowerCase().trim()
  if (await prisma.user.findUnique({ where: { email } })) throw new AppError(409, 'Já existe uma conta com esse e-mail.', 'email')
  if (await prisma.user.findUnique({ where: { username } })) throw new AppError(409, 'Esse nome de usuário já está em uso.', 'username')
  const user = await prisma.user.create({
    data: {
      name: input.name.trim(), username, email,
      passwordHash: await bcrypt.hash(input.password, 10),
      termsAcceptedAt: new Date(),
    },
  })
  const demo = await issueCode(user.id, email, 'VERIFY_EMAIL')
  return { email, ...demo }
}

export async function resendCode(emailRaw: string, purpose: CodePurpose) {
  const email = emailRaw.toLowerCase().trim()
  const user = await prisma.user.findUnique({ where: { email } })
  // Não revela se o e-mail existe
  if (!user) return {}
  if (purpose === 'VERIFY_EMAIL' && user.emailVerified) return {}
  return issueCode(user.id, email, purpose)
}

export async function verifyEmail(emailRaw: string, code: string) {
  const user = await prisma.user.findUnique({ where: { email: emailRaw.toLowerCase().trim() } })
  if (!user) throw new AppError(400, 'Código incorreto. Confira o e-mail e tente de novo.', 'code')
  await checkCode(user.id, 'VERIFY_EMAIL', code, true)
  await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } })
}

export async function login(identifier: string, password: string) {
  const id = identifier.toLowerCase().trim()
  const user = await prisma.user.findFirst({ where: { OR: [{ email: id }, { username: id }] } })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, 'E-mail ou senha incorretos.')
  }
  if (!user.emailVerified) {
    const demo = await issueCode(user.id, user.email, 'VERIFY_EMAIL').catch(() => ({}))
    const err = new AppError(403, 'Confirme seu e-mail para entrar.')
    Object.assign(err, { extra: { needsVerification: true, email: user.email, ...demo } })
    throw err
  }
  return user
}

export async function verifyResetCode(emailRaw: string, code: string) {
  const user = await prisma.user.findUnique({ where: { email: emailRaw.toLowerCase().trim() } })
  if (!user) throw new AppError(400, 'Código incorreto. Confira o e-mail e tente de novo.', 'code')
  await checkCode(user.id, 'RESET_PASSWORD', code, false)
}

export async function resetPassword(emailRaw: string, code: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: emailRaw.toLowerCase().trim() } })
  if (!user) throw new AppError(400, 'Código incorreto.', 'code')
  await checkCode(user.id, 'RESET_PASSWORD', code, true)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 10) } })
}
