import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerTxRoutes } from './routes/tx.js';

// Validate MASTER_KEY at startup
if (!process.env.MASTER_KEY) {
  console.error('FATAL: MASTER_KEY environment variable is not defined');
  process.exit(1);
}

const PORT = parseInt(process.env.PORT || '3001', 10);

const fastify = Fastify({
  logger: true
});

// Register CORS
await fastify.register(cors, {
  origin: true // Allow all origins in development
});

// Register routes
await registerTxRoutes(fastify);

// Start server
try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`✅ API server running on http://localhost:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
