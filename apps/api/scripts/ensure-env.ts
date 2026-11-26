// Cria apps/api/.env a partir do .env.example na primeira execução (facilita rodar o projeto)
import { copyFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = path.join(root, '.env')
if (!existsSync(env)) {
  copyFileSync(path.join(root, '.env.example'), env)
  console.log('[setup] Criei apps/api/.env a partir do .env.example')
}
