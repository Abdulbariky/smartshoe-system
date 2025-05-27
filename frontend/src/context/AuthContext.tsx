import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔄 Initializing authentication...');
      
      // Check for existing session
      const savedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      const savedUserStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      
      if (savedToken && savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          console.log('✅ Found existing session for user:', savedUser.username);
          
          setToken(savedToken);
          setUser(savedUser);
        } catch (parseError) {
          console.error('❌ Error parsing saved user data:', parseError);
          // Clear corrupted data
          clearAuthData();
        }
      } else {
        console.log('ℹ️ No existing session found');
      }
    } catch (error) {
      console.error('❌ Error initializing auth:', error);
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const login = async (username: string, password: string) => {
    try {
      console.log('🔄 Logging in user:', username);
      
      const response = await authService.login(username, password);
      console.log('✅ Login successful:', response.user);
      
      // Store authentication data
      const newToken = response.access_token;
      const newUser = response.user;
      
      // Store in localStorage by default (can be moved to sessionStorage in login page)  
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      console.error('❌ Login failed:', error);
      clearAuthData();
      throw error; // Re-throw for the login component to handle
    }
  };

  const logout = () => {
    try {
      console.log('🔄 Logging out user:', user?.username);
      
      authService.logout();
      clearAuthData();
      
      console.log('✅ Logout successful');
      navigate('/login');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Force logout even if there's an error
      clearAuthData();
      navigate('/login');
    }
  };

  const isAuthenticated = !!(token && user);

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};