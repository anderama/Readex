import 'dotenv/config'
import { z } from 'zod'

// Validação das variáveis de ambiente na subida do servidor
const schema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3333),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  DEMO_CODES: z.string().default('true').transform((v) => v === 'true'),
})

export const env = schema.parse(process.env)
