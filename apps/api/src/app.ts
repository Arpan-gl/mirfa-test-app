import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerTxRoutes } from './routes/tx.js';

export async function buildApp(){
    const fastify = Fastify({
        logger: true
    });

    // Register CORS
    await fastify.register(cors, {
        origin: true // Allow all origins in development
    });

    // Register routes
    await registerTxRoutes(fastify);

    return fastify;
}