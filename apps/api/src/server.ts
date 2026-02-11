import 'dotenv/config'
import { buildApp } from '../src/app.js'

// Validate MASTER_KEY at startup
if (!process.env.MASTER_KEY) {
  console.error('FATAL: MASTER_KEY environment variable is not defined');
  process.exit(1);
}

let app: any

export default async function handler(req: any, res: any) {
  if (!app) {
    app = await buildApp()
    await app.ready()
  }

  app.server.emit('request', req, res)
}
