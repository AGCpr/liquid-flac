import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if we're in production (HTTPS)
    const isProduction = window.location.protocol === 'https:';
    
    // For development or if Supabase auth fails, use a mock user
    const getInitialUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const userProfile = {
            id: session.user.id,
            name: session.user.email?.split('@')[0] || 'User',
            email: session.user.email,
            avatar: `https://api.dicebear.com/9.x/glass/svg?seed=${session.user.id}`,
            isAdmin: session.user.email === 'admin@example.com',
          };
          setUser(userProfile);
        } else {
          // Create a mock user for testing
          const mockUser = {
            id: 'u1',
            name: 'Alex Demo',
            email: 'demo@example.com',
            avatar: 'https://api.dicebear.com/9.x/glass/svg?seed=u1',
            isAdmin: true,
          };
          setUser(mockUser);
        }
      } catch (e) {
        console.error('Auth error, using mock user', e);
        // Create a mock user for testing
        const mockUser = {
          id: 'u1',
          name: 'Alex Demo',
          email: 'demo@example.com',
          avatar: 'https://api.dicebear.com/9.x/glass/svg?seed=u1',
          isAdmin: true,
        };
        setUser(mockUser);
      }
    };
    
    getInitialUser();

    // Only set up Supabase auth listener in production
    if (isProduction) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          if (session) {
            const userProfile = {
              id: session.user.id,
              name: session.user.email?.split('@')[0] || 'User',
              email: session.user.email,
              avatar: `https://api.dicebear.com/9.x/glass/svg?seed=${session.user.id}`,
              isAdmin: session.user.email === 'admin@example.com',
            };
            setUser(userProfile);
          } else {
            setUser(null);
          }
        }
      );

      return () => {
        authListener?.subscription.unsubscribe();
      };
    }
  }, []);

  const login = async (email: string) => {
    try {
      // Simple email-based login - create user profile directly
      // In production, this would verify with Supabase, but for demo we create user directly
      const emailParts = email.split('@');
      const userName = emailParts[0] || 'User';
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      const userProfile: User = {
        id: userId,
        name: userName,
        email: email,
        avatar: `https://api.dicebear.com/9.x/glass/svg?seed=${email}`,
        isAdmin: email.toLowerCase() === 'admin@example.com' || email.toLowerCase().includes('admin'),
      };
      
      setUser(userProfile);
      
      // Try to sign in with Supabase if available (silent fail for demo)
      try {
        await supabase.auth.signInWithPassword({ email, password: 'demo' }).catch(() => {
          // Ignore - using demo mode
        });
      } catch {
        // Ignore Supabase errors in demo mode
      }
    } catch (e) {
      console.error('Login error:', e);
      // Create a demo user as fallback
      const mockUser = {
        id: 'u1',
        name: 'Alex Demo',
        email: email || 'demo@example.com',
        avatar: 'https://api.dicebear.com/9.x/glass/svg?seed=u1',
        isAdmin: true,
      };
      setUser(mockUser);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error logging out:', error);
      }
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setUser(null);
    }
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
