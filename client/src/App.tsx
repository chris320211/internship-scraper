import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Landing from './components/Landing';
import Login from './components/Login';
import Signup from './components/Signup';
import Onboarding from './components/Onboarding';
import InternshipSearch from './components/InternshipSearch';

type AuthView = 'landing' | 'login' | 'signup';

function AppContent() {
  const { user, isAuthenticated, hasCompletedOnboarding, login, completeOnboarding } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('landing');

  const handleLogin = (userId: number, email: string, hasCompletedOnboarding?: boolean) => {
    login(userId, email, hasCompletedOnboarding);
  };

  const handleSignup = (userId: number, email: string) => {
    // New signups haven't completed onboarding yet
    login(userId, email, false);
  };

  const handleOnboardingComplete = () => {
    completeOnboarding();
  };

  // Show login/signup flow
  if (!isAuthenticated) {
    if (authView === 'landing') {
      return (
        <Landing
          onShowLogin={() => setAuthView('login')}
          onShowSignup={() => setAuthView('signup')}
        />
      );
    } else if (authView === 'login') {
      return (
        <Login
          onLogin={handleLogin}
          onSwitchToSignup={() => setAuthView('signup')}
        />
      );
    } else {
      return (
        <Signup
          onSignup={handleSignup}
          onSwitchToLogin={() => setAuthView('login')}
        />
      );
    }
  }

  // Show onboarding after signup
  if (isAuthenticated && !hasCompletedOnboarding && user) {
    return (
      <Onboarding
        userId={user.id}
        email={user.email}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // Show main internship search app
  return <InternshipSearch />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
