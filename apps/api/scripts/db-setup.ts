// Cria as tabelas (prisma db push) e carrega os dados de exemplo.
import { execSync } from 'node:child_process'
import { startEmbedded } from './embedded.js'

const reset = process.argv.includes('--reset')
let pg: Awaited<ReturnType<typeof startEmbedded>> | undefined
if (process.env.EMBEDDED_DB === 'true') {
  try { pg = await startEmbedded() } catch (e) {
    console.log('[db] O banco embutido parece já estar rodando; seguindo com ele.')
  }
}
try {
  execSync(`npx prisma db push --skip-generate ${reset ? '--force-reset' : ''}`, { stdio: 'inherit' })
  execSync('npx prisma generate', { stdio: 'inherit' })
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' })
} finally {
  await pg?.stop()
}
