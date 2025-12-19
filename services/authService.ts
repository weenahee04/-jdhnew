// Authentication service - Auto-switch between localStorage and backend API
import { USE_BACKEND_API } from '../config';

// Import both implementations
import * as localStorageAuth from './authServiceLocalImpl';
import * as backendAuth from './authServiceBackend';

// Re-export based on configuration
export const registerUser = USE_BACKEND_API 
  ? backendAuth.registerUser 
  : localStorageAuth.registerUser;

export const loginUser = USE_BACKEND_API 
  ? backendAuth.loginUser 
  : localStorageAuth.loginUser;

export const getCurrentUser = USE_BACKEND_API 
  ? backendAuth.getCurrentUser 
  : localStorageAuth.getCurrentUser;

export const setCurrentUser = USE_BACKEND_API 
  ? backendAuth.setCurrentUser 
  : localStorageAuth.setCurrentUser;

export const logoutUser = USE_BACKEND_API 
  ? backendAuth.logoutUser 
  : localStorageAuth.logoutUser;

export const updateUserWallet = USE_BACKEND_API 
  ? backendAuth.updateUserWallet 
  : localStorageAuth.updateUserWallet;

export const userHasWallet = USE_BACKEND_API 
  ? backendAuth.userHasWallet 
  : localStorageAuth.userHasWallet;

export const updateUserDisplayName = USE_BACKEND_API 
  ? backendAuth.updateUserDisplayName 
  : localStorageAuth.updateUserDisplayName;

// Export types
export type { User, AuthResult } from './authServiceLocalImpl';

// Backend-only functions (only available when USE_BACKEND_API = true)
export const saveWallet = USE_BACKEND_API && backendAuth.saveWallet 
  ? backendAuth.saveWallet 
  : async () => false;

export const getWallet = USE_BACKEND_API && backendAuth.getWallet 
  ? backendAuth.getWallet 
  : async () => null;
