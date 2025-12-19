import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        strictPort: false,
      },
      plugins: [
        react(),
        nodePolyfills({
          include: ['buffer', 'stream', 'util', 'crypto', 'process'],
          globals: {
            Buffer: true,
            global: true,
            process: true,
          },
          protocolImports: true,
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.HELIUS_RPC_URL': JSON.stringify(env.HELIUS_RPC_URL),
        'process.env.SOLANA_CLUSTER': JSON.stringify(env.SOLANA_CLUSTER),
        'process.env.JUPITER_BASE_URL': JSON.stringify(env.JUPITER_BASE_URL),
        'global': 'globalThis',
        'process.env.NODE_ENV': JSON.stringify(mode),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          'stream': 'readable-stream',
          'crypto': 'crypto-browserify',
          'util': 'util',
        },
        dedupe: ['eventemitter3', 'bn.js', 'jayson', 'readable-stream'],
      },
      optimizeDeps: {
        include: [
          'buffer',
          'readable-stream',
          'util', 
          'crypto-browserify', 
          'eventemitter3', 
          'bn.js',
          '@solana/web3.js',
          '@solana/spl-token',
          'ed25519-hd-key',
          'bs58',
          '@scure/bip39',
        ],
        esbuildOptions: {
          target: 'esnext',
        },
      },
      build: {
        sourcemap: mode === 'development',
        minify: 'esbuild',
        rollupOptions: {
          output: {
            format: 'es',
            // Remove manual chunks completely to ensure single bundle
            manualChunks: undefined,
          },
          // Ensure proper module ordering
          preserveEntrySignatures: 'strict',
        },
        chunkSizeWarningLimit: 2000,
        // Ensure all modules are bundled together
        commonjsOptions: {
          include: [/node_modules/],
          transformMixedEsModules: true,
        },
      },
    };
});
