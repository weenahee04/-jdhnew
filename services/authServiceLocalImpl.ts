// LocalStorage-based authentication service implementation
// This is the actual implementation that stores users in browser localStorage

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
  token?: string;
}

// Simple hash function for password (demo only - use bcrypt in production)
const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

// Generate unique user ID
const generateUserId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `user_${timestamp}_${random}`;
};

// Get all users from localStorage
const getUsers = (): Record<string, { password: string; user: User }> => {
  try {
    const stored = localStorage.getItem('jdh_users');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Save users to localStorage
const saveUsers = (users: Record<string, { password: string; user: User }>): void => {
  try {
    localStorage.setItem('jdh_users', JSON.stringify(users));
  } catch (error) {
    console.error('Failed to save users to localStorage:', error);
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

    const users = getUsers();
    const emailKey = email.toLowerCase();

    // Check if user already exists
    if (users[emailKey]) {
      return { success: false, error: 'อีเมลนี้ถูกใช้งานแล้ว' };
    }

    // Create new user
    const user: User = {
      id: generateUserId(),
      email: emailKey,
      createdAt: Date.now(),
      hasWallet: false,
    };

    // Hash password and save user
    const hashedPassword = hashPassword(password);
    users[emailKey] = {
      password: hashedPassword,
      user,
    };

    saveUsers(users);

    // Set current user in session
    setCurrentUser(user);

    return { success: true, user };
  } catch (error: any) {
    console.error('Registration error:', error);
    return { success: false, error: error.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก' };
  }
};

// Login user
export const loginUser = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const users = getUsers();
    const emailKey = email.toLowerCase();
    const userData = users[emailKey];

    if (!userData) {
      return { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
    }

    // Verify password
    const hashedPassword = hashPassword(password);
    if (userData.password !== hashedPassword) {
      return { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
    }

    // Set current user in session
    setCurrentUser(userData.user);

    return { success: true, user: userData.user };
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
export const setCurrentUser = (user: User | null): void => {
  try {
    if (user) {
      sessionStorage.setItem('jdh_current_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('jdh_current_user');
    }
  } catch (error) {
    console.error('Failed to set current user:', error);
  }
};

// Logout user
export const logoutUser = (): void => {
  setCurrentUser(null);
};

// Update user wallet address
export const updateUserWallet = async (email: string, walletAddress: string): Promise<boolean> => {
  try {
    const users = getUsers();
    const emailKey = email.toLowerCase();
    const userData = users[emailKey];

    if (!userData) {
      return false;
    }

    // Update user data
    userData.user.hasWallet = true;
    userData.user.walletAddress = walletAddress;

    // Update in localStorage
    users[emailKey] = userData;
    saveUsers(users);

    // Update current session if this is the logged-in user
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.email === emailKey) {
      setCurrentUser(userData.user);
    }

    return true;
  } catch (error) {
    console.error('Failed to update user wallet:', error);
    return false;
  }
};

// Check if user has wallet
export const userHasWallet = async (email: string): Promise<boolean> => {
  try {
    const users = getUsers();
    const emailKey = email.toLowerCase();
    const userData = users[emailKey];
    return userData?.user?.hasWallet || false;
  } catch {
    return false;
  }
};

// Update user display name
export const updateUserDisplayName = async (email: string, displayName: string): Promise<boolean> => {
  try {
    const users = getUsers();
    const emailKey = email.toLowerCase();
    const userData = users[emailKey];

    if (!userData) {
      return false;
    }

    // Update user data
    userData.user.displayName = displayName;

    // Update in localStorage
    users[emailKey] = userData;
    saveUsers(users);

    // Update current session if this is the logged-in user
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.email === emailKey) {
      setCurrentUser(userData.user);
    }

    return true;
  } catch (error) {
    console.error('Failed to update user display name:', error);
    return false;
  }
};

