// Configuration file - Switch between localStorage and backend API

// Set to true to use backend API (Supabase), false to use localStorage
// Default to true in production (Vercel will set VITE_USE_BACKEND_API=true)
export const USE_BACKEND_API = 
  import.meta.env.VITE_USE_BACKEND_API === 'true' || 
  import.meta.env.VITE_USE_BACKEND_API === true ||
  import.meta.env.MODE === 'production';

// API base URL (defaults to relative path for Vercel)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Wallet API base URL (for the new backend API server)
// Defaults to localhost:3001 in development, or can be set via env var
export const WALLET_API_URL = import.meta.env.VITE_WALLET_API_URL || 
  (import.meta.env.MODE === 'production' ? 'https://your-api-domain.com' : 'http://localhost:3001');

// Use Wallet API (new backend) instead of direct RPC calls
export const USE_WALLET_API = import.meta.env.VITE_USE_WALLET_API === 'true' || false;

