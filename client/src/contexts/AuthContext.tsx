import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  hasCompletedOnboarding?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  login: (userId: number, email: string, hasCompletedOnboarding?: boolean) => void;
  logout: () => void;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    // Load user from localStorage on mount
    const savedUser = localStorage.getItem('user');

    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      // Set onboarding status from user object
      if (parsedUser.hasCompletedOnboarding !== undefined) {
        setHasCompletedOnboarding(parsedUser.hasCompletedOnboarding);
      }
    }
  }, []);

  const login = (userId: number, email: string, hasCompletedOnboarding = false) => {
    const newUser = { id: userId, email, hasCompletedOnboarding };
    setUser(newUser);
    setHasCompletedOnboarding(hasCompletedOnboarding);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setHasCompletedOnboarding(false);
    localStorage.removeItem('user');
  };

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
    // Update user object in localStorage with onboarding status
    if (user) {
      const updatedUser = { ...user, hasCompletedOnboarding: true };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        hasCompletedOnboarding,
        login,
        logout,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
