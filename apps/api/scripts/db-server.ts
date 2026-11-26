// Mantém o PostgreSQL embutido rodando enquanto o `npm run dev` estiver aberto.
import net from 'node:net'
import { startEmbedded, PORT } from './embedded.js'

const idle = () => setInterval(() => {}, 1 << 30)
const portInUse = () => new Promise<boolean>((resolve) => {
  const s = net.connect(PORT, '127.0.0.1')
  s.once('connect', () => { s.destroy(); resolve(true) })
  s.once('error', () => resolve(false))
})

if (process.env.EMBEDDED_DB !== 'true') {
  console.log('[db] EMBEDDED_DB=false: usando o banco da DATABASE_URL.')
  idle()
} else if (await portInUse()) {
  console.log(`[db] Já existe um PostgreSQL na porta ${PORT}; usando esse.`)
  idle()
} else {
  const pg = await startEmbedded()
  console.log(`[db] PostgreSQL embutido rodando na porta ${PORT}`)
  const stop = async () => { await pg.stop().catch(() => {}); process.exit(0) }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
  process.on('SIGHUP', stop)
}
