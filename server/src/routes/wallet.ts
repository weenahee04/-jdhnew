import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { logger } from '../modules/common/logger.js';
import {
  getPortfolio,
  getTokenBalances,
  getHistory,
  getTokenMeta,
  getPricesData,
  getSwapQuoteData,
  buildSwapTx,
  subscribeAddress,
  handleWebhook,
} from '../modules/walletData/index.js';
import type { Chain } from '../types/index.js';

// Validation schemas
const addressSchema = z.string().min(32).max(44);
const chainSchema = z.enum(['solana', 'ethereum', 'polygon', 'bsc']).default('solana');
const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(1000).optional(),
  cursor: z.string().optional(),
});

const portfolioQuerySchema = z.object({
  chain: chainSchema,
  address: addressSchema,
});

const historyQuerySchema = portfolioQuerySchema.merge(paginationSchema);

const tokenMetaQuerySchema = z.object({
  chain: chainSchema,
  id: z.string(),
});

const pricesQuerySchema = z.object({
  chain: chainSchema,
  ids: z.string(),
  fiat: z.string().default('usd'),
});

const swapQuoteSchema = z.object({
  inputMint: z.string(),
  outputMint: z.string(),
  amount: z.string(),
  chain: chainSchema,
  slippageBps: z.coerce.number().min(0).max(10000).default(50),
});

const swapBuildSchema = z.object({
  userPublicKey: z.string(),
  inputMint: z.string(),
  outputMint: z.string(),
  inputAmount: z.string(),
  slippageBps: z.coerce.number().min(0).max(10000).default(50),
  quoteResponse: z.any(),
});

const subscribeSchema = z.object({
  address: addressSchema,
  chain: chainSchema,
});

export async function walletRoutes(fastify: FastifyInstance) {
  // GET /v1/portfolio
  fastify.get('/v1/portfolio', async (request, reply) => {
    try {
      const query = portfolioQuerySchema.parse(request.query);
      const portfolio = await getPortfolio(query.address, query.chain);
      return portfolio;
    } catch (error) {
      logger.error('Portfolio fetch error', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: error.errors,
        });
      }
      return reply.code(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch portfolio',
      });
    }
  });

  // GET /v1/history
  fastify.get('/v1/history', async (request, reply) => {
    try {
      const query = historyQuerySchema.parse(request.query);
      const history = await getHistory(query.address, query.chain, {
        limit: query.limit,
        cursor: query.cursor,
      });
      return history;
    } catch (error) {
      logger.error('History fetch error', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: error.errors,
        });
      }
      return reply.code(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch history',
      });
    }
  });

  // GET /v1/token/meta
  fastify.get('/v1/token/meta', async (request, reply) => {
    try {
      const query = tokenMetaQuerySchema.parse(request.query);
      const metadata = await getTokenMeta(query.id, query.chain);
      if (!metadata) {
        return reply.code(404).send({
          code: 'NOT_FOUND',
          message: 'Token metadata not found',
        });
      }
      return metadata;
    } catch (error) {
      logger.error('Token metadata fetch error', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: error.errors,
        });
      }
      return reply.code(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch token metadata',
      });
    }
  });

  // GET /v1/prices
  fastify.get('/v1/prices', async (request, reply) => {
    try {
      const query = pricesQuerySchema.parse(request.query);
      const ids = query.ids.split(',').filter(Boolean);
      const prices = await getPricesData(ids, query.chain, query.fiat);
      return prices;
    } catch (error) {
      logger.error('Prices fetch error', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: error.errors,
        });
      }
      return reply.code(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch prices',
      });
    }
  });

  // POST /v1/swap/quote
  fastify.post('/v1/swap/quote', async (request, reply) => {
    try {
      const body = swapQuoteSchema.parse(request.body);
      const quote = await getSwapQuoteData(
        body.inputMint,
        body.outputMint,
        body.amount,
        body.chain,
        body.slippageBps
      );
      return quote;
    } catch (error) {
      logger.error('Swap quote error', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: error.errors,
        });
      }
      return reply.code(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Failed to get swap quote',
      });
    }
  });

  // POST /v1/swap/build
  fastify.post('/v1/swap/build', async (request, reply) => {
    try {
      const body = swapBuildSchema.parse(request.body);
      const tx = await buildSwapTx(body, body.chain || 'solana');
      return tx;
    } catch (error) {
      logger.error('Swap build error', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: error.errors,
        });
      }
      return reply.code(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Failed to build swap transaction',
      });
    }
  });

  // POST /v1/notify/webhook/:provider
  fastify.post('/v1/notify/webhook/:provider', async (request, reply) => {
    try {
      const provider = (request.params as { provider: string }).provider;
      await handleWebhook(provider, request.body);
      return { success: true };
    } catch (error) {
      logger.error('Webhook error', error);
      return reply.code(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Failed to handle webhook',
      });
    }
  });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: Date.now() };
  });
}

