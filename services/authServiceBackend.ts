// Backend API-based authentication service
// This replaces the localStorage-based authService.ts for production

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface User {
  id: string;
  email: string;
  createdAt: number;
  walletAddress?: string;
  hasWallet: boolean;
  displayName?: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  token?: string; // JWT token for authentication
}

// Store JWT token
const setAuthToken = (token: string) => {
  try {
    sessionStorage.setItem('jdh_auth_token', token);
  } catch (error) {
    console.error('Failed to store auth token:', error);
  }
};

// Get JWT token
const getAuthToken = (): string | null => {
  try {
    return sessionStorage.getItem('jdh_auth_token');
  } catch {
    return null;
  }
};

// Clear auth token
const clearAuthToken = () => {
  try {
    sessionStorage.removeItem('jdh_auth_token');
  } catch (error) {
    console.error('Failed to clear auth token:', error);
  }
};

// API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        console.error('API Error:', errorData);
      } catch (e) {
        // If response is not JSON, try to get text
        try {
          const text = await response.text();
          console.error('API Error (text):', text);
          errorMessage = text || errorMessage;
        } catch (e2) {
          console.error('API Error (no body):', response.status, response.statusText);
        }
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: any) {
    // Network error or other fetch errors
    if (error.message && !error.message.startsWith('HTTP')) {
      console.error('Network error:', error);
      throw new Error(`ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์: ${error.message}`);
    }
    throw error;
  }
};

// Register new user
export const registerUser = async (email: string, password: string): Promise<AuthResult> => {
  try {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'รูปแบบอีเมลไม่ถูกต้อง' };
    }

    // Validate password
    if (!password || password.length < 6) {
      return { success: false, error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' };
    }

    const result = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.success && result.user) {
      // Store token if provided
      if (result.token) {
        setAuthToken(result.token);
      }

      // Convert backend user format to frontend format
      const user: User = {
        id: result.user.id,
        email: result.user.email,
        createdAt: new Date(result.user.created_at).getTime(),
        hasWallet: result.user.has_wallet || false,
        walletAddress: result.user.wallet_address,
        displayName: result.user.display_name,
      };

      return { success: true, user, token: result.token };
    }

    return { success: false, error: result.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก' };
  } catch (error: any) {
    console.error('Registration error:', error);
    return { success: false, error: error.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก' };
  }
};

// Login user
export const loginUser = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.success && result.user) {
      // Store token
      if (result.token) {
        setAuthToken(result.token);
      }

      // Convert backend user format to frontend format
      const user: User = {
        id: result.user.id,
        email: result.user.email,
        createdAt: new Date(result.user.created_at).getTime(),
        hasWallet: result.user.has_wallet || false,
        walletAddress: result.user.wallet_address,
        displayName: result.user.display_name,
      };

      return { success: true, user, token: result.token };
    }

    return { success: false, error: result.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, error: error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' };
  }
};

// Get current user from session
export const getCurrentUser = (): User | null => {
  try {
    const stored = sessionStorage.getItem('jdh_current_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// Set current user in session
export const setCurrentUser = (user: User) => {
  try {
    sessionStorage.setItem('jdh_current_user', JSON.stringify(user));
  } catch (error) {
    console.error('Failed to set current user:', error);
  }
};

// Logout user
export const logoutUser = () => {
  try {
    sessionStorage.removeItem('jdh_current_user');
    clearAuthToken();
  } catch (error) {
    console.error('Failed to logout:', error);
  }
};

// Update user wallet address
export const updateUserWallet = async (email: string, walletAddress: string): Promise<boolean> => {
  try {
    const result = await apiRequest('/user/wallet', {
      method: 'PUT',
      body: JSON.stringify({ walletAddress }),
    });

    if (result.success) {
      // Update current session
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.email === email.toLowerCase()) {
        setCurrentUser({
          ...currentUser,
          walletAddress,
          hasWallet: true,
        });
      }
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to update user wallet:', error);
    return false;
  }
};

// Check if user has wallet
export const userHasWallet = async (email: string): Promise<boolean> => {
  try {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.email === email.toLowerCase()) {
      return currentUser.hasWallet || false;
    }
    return false;
  } catch {
    return false;
  }
};

// Update user display name
export const updateUserDisplayName = async (email: string, displayName: string): Promise<boolean> => {
  try {
    // Validate display name
    if (!displayName || displayName.trim().length === 0) {
      return false;
    }

    if (displayName.trim().length > 50) {
      return false; // Max 50 characters
    }

    const result = await apiRequest('/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ displayName: displayName.trim() }),
    });

    if (result.success) {
      // Update current session
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.email === email.toLowerCase()) {
        setCurrentUser({
          ...currentUser,
          displayName: displayName.trim(),
        });
      }
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to update user display name:', error);
    return false;
  }
};

// Save wallet (encrypted mnemonic)
export const saveWallet = async (userId: string, mnemonic: string, publicKey: string): Promise<boolean> => {
  try {
    const result = await apiRequest('/wallet/save', {
      method: 'POST',
      body: JSON.stringify({ userId, mnemonic, publicKey }),
    });

    return result.success || false;
  } catch (error) {
    console.error('Failed to save wallet:', error);
    return false;
  }
};

// Get wallet (decrypted mnemonic)
export const getWallet = async (userId: string): Promise<string | null> => {
  try {
    const result = await apiRequest(`/wallet/get?userId=${userId}`, {
      method: 'GET',
    });

    if (result.success && result.wallet) {
      return result.wallet.mnemonic;
    }

    return null;
  } catch (error) {
    console.error('Failed to get wallet:', error);
    return null;
  }
};

