// Inicia um PostgreSQL embutido (binários via npm) para rodar o projeto sem instalar nada.
import './ensure-env.js'
import EmbeddedPostgres from 'embedded-postgres'
import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import 'dotenv/config'

export const PORT = Number(process.env.EMBEDDED_DB_PORT ?? 5433)
// Pasta fora do projeto: evita acentos no caminho e a sincronização do OneDrive
export const DATA_DIR = process.env.PG_DATA_DIR ?? path.join(os.homedir(), '.readex', 'pgdata')

export function createServer() {
  return new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: 'postgres',
    password: 'readex',
    port: PORT,
    persistent: true,
    onLog: () => {},
  })
}

export async function startEmbedded() {
  const pg = createServer()
  const fresh = !existsSync(path.join(DATA_DIR, 'PG_VERSION'))
  if (fresh) await pg.initialise()
  await pg.start()
  if (fresh) await pg.createDatabase('readex')
  return pg
}
