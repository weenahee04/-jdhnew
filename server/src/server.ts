import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { loadEnv, redactEnv } from './config/env.js';
import { logger } from './modules/common/logger.js';
import { walletRoutes } from './routes/wallet.js';
import { closeRedis } from './modules/cache/redis.js';

async function buildServer() {
  const env = loadEnv();
  logger.info('Starting server', { env: redactEnv(env) });

  const fastify = Fastify({
    logger: env.NODE_ENV === 'development',
    requestIdLogLabel: 'reqId',
    genReqId: () => {
      return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },
  });

  // CORS
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Request ID middleware
  fastify.addHook('onRequest', async (request) => {
    const reqId = request.id;
    logger.setRequestId(reqId);
    request.log = { ...request.log, reqId };
  });

  // API key authentication (optional)
  fastify.addHook('onRequest', async (request, reply) => {
    if (env.API_KEY && request.url.startsWith('/v1/')) {
      const apiKey = request.headers['x-api-key'];
      if (apiKey !== env.API_KEY) {
        return reply.code(401).send({
          code: 'UNAUTHORIZED',
          message: 'Invalid API key',
        });
      }
    }
  });

  // Register routes
  await fastify.register(walletRoutes);

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    logger.error('Request error', error, { url: request.url });
    reply.code(error.statusCode || 500).send({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    });
  });

  return fastify;
}

async function start() {
  try {
    const env = loadEnv();
    const server = await buildServer();

    await server.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info(`Server listening on port ${env.PORT}`);
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await closeRedis();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await closeRedis();
  process.exit(0);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}

export { buildServer };

