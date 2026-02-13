import { buildApp } from '../dist/app.js'

let app: any

export default async function handler(req: any, res: any) {
  try {
    if (!app) {
      app = await buildApp()
      await app.ready()
    }

    // Convert Vercel request to Fastify inject format
    const response = await app.inject({
      method: req.method,
      url: req.url,
      headers: req.headers,
      payload: req.body
    })

    res.status(response.statusCode)
    res.headers(response.headers)
    res.send(response.payload)
  } catch (error) {
    console.error('Handler error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
