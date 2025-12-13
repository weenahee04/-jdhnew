// Configuration file - Switch between localStorage and backend API

// Set to true to use backend API (Supabase), false to use localStorage
export const USE_BACKEND_API = import.meta.env.VITE_USE_BACKEND_API === 'true' || false;

// API base URL (defaults to relative path for Vercel)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

