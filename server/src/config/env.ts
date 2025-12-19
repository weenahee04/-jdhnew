import { z } from 'zod';

const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_KEY: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Solana
  HELIUS_RPC_URL: z.string().url().optional(),
  HELIUS_API_KEY: z.string().optional(),
  SOLANA_RPC_URL: z.string().url().optional(),
  SOLANA_CLUSTER: z.enum(['mainnet-beta', 'devnet', 'testnet']).default('mainnet-beta'),

  // EVM (Optional)
  ALCHEMY_API_KEY: z.string().optional(),
  INFURA_API_KEY: z.string().optional(),
  ETHEREUM_RPC_URL: z.string().url().optional(),

  // Pricing
  COINGECKO_API_KEY: z.string().optional(),
  COINMARKETCAP_API_KEY: z.string().optional(),

  // FX
  EXCHANGERATE_API_KEY: z.string().optional(),

  // Swap
  JUPITER_API_URL: z.string().url().default('https://quote-api.jup.ag/v6'),
  ZEROX_API_KEY: z.string().optional(),
  ONEINCH_API_KEY: z.string().optional(),

  // Redis
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // Feature Flags
  ENABLE_EVM: z.coerce.boolean().default(false),
  ENABLE_SWAP: z.coerce.boolean().default(true),
  ENABLE_NOTIFICATIONS: z.coerce.boolean().default(true),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

export function loadEnv(): Env {
  if (env) return env;

  try {
    env = envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }

  return env;
}

export function getEnv(): Env {
  return loadEnv();
}

// Redact sensitive values for logging
export function redactEnv(env: Env): Record<string, string | number | boolean> {
  const redacted = { ...env };
  const sensitiveKeys = ['API_KEY', 'HELIUS_API_KEY', 'ALCHEMY_API_KEY', 'INFURA_API_KEY', 'COINGECKO_API_KEY', 'COINMARKETCAP_API_KEY', 'EXCHANGERATE_API_KEY', 'ZEROX_API_KEY', 'ONEINCH_API_KEY', 'REDIS_PASSWORD'];
  
  sensitiveKeys.forEach((key) => {
    if (key in redacted && redacted[key as keyof Env]) {
      const value = String(redacted[key as keyof Env]);
      redacted[key as keyof Env] = value.length > 8 
        ? `${value.slice(0, 4)}...${value.slice(-4)}` 
        : '***' as any;
    }
  });

  return redacted as Record<string, string | number | boolean>;
}

