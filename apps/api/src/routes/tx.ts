import { encryptPayload, decryptPayload, TxSecureRecord } from '@mirfa/crypto';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// In-memory storage
const storage = new Map<string, TxSecureRecord>();

interface EncryptRequestBody {
  partyId: string;
  payload: unknown;
}

interface TxParams {
  id: string;
}

export async function registerTxRoutes(fastify: FastifyInstance) {
  // POST /tx/encrypt
  fastify.post<{ Body: EncryptRequestBody }>(
    '/tx/encrypt',
    async (request: FastifyRequest<{ Body: EncryptRequestBody }>, reply: FastifyReply) => {
      const { partyId, payload } = request.body;

      // Validate input
      if (!partyId || typeof partyId !== 'string') {
        return reply.code(400).send({ error: 'partyId must be a string' });
      }

      if (payload === undefined || payload === null) {
        return reply.code(400).send({ error: 'payload is required' });
      }

      try {
        const record = encryptPayload(partyId, payload);
        storage.set(record.id, record);

        return reply.code(201).send(record);
      } catch (error) {
        request.log.error(error, 'Encryption failed');
        return reply.code(500).send({ error: 'Encryption failed' });
      }
    }
  );

  // GET /tx/:id
  fastify.get<{ Params: TxParams }>(
    '/tx/:id',
    async (request: FastifyRequest<{ Params: TxParams }>, reply: FastifyReply) => {
      const { id } = request.params;

      const record = storage.get(id);

      if (!record) {
        return reply.code(404).send({ error: 'Record not found' });
      }

      return reply.send(record);
    }
  );

  // POST /tx/:id/decrypt
  fastify.post<{ Params: TxParams }>(
    '/tx/:id/decrypt',
    async (request: FastifyRequest<{ Params: TxParams }>, reply: FastifyReply) => {
      const { id } = request.params;

      const record = storage.get(id);

      if (!record) {
        return reply.code(404).send({ error: 'Record not found' });
      }

      try {
        const decryptedPayload = decryptPayload(record);
        return reply.send({ payload: decryptedPayload });
      } catch (error) {
        request.log.error(error, 'Decryption failed');
        return reply.code(400).send({ error: 'Decryption failed' });
      }
    }
  );
}
