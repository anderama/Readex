import { buildApp } from './app.js'
import { env } from './config/env.js'

const app = await buildApp()
await app.listen({ port: env.PORT, host: '0.0.0.0' })
console.log(`[api] Readex API em http://localhost:${env.PORT}/api`)
