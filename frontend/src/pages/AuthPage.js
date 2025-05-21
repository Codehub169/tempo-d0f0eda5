import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import useAuth from '../hooks/useAuth';
import { Icon } from '@iconify/react';

const AuthPage = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth, authError, clearAuthError } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoadingAuth) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoadingAuth, navigate]);

  // Clear previous auth errors when view changes or component mounts
  useEffect(() => {
    clearAuthError();
  }, [isLoginView, clearAuthError]);

  const handleAuthSuccess = () => {
    navigate('/dashboard');
  };

  const toggleFormType = () => {
    setIsLoginView(prev => !prev);
  };

  if (isLoadingAuth) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }
  
  // If already authenticated and not loading, this page shouldn't be visible (due to redirect)
  // but as a fallback or if navigation is slow:
  if (isAuthenticated) {
    return null; 
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.logoContainer}>
        <Icon icon="ion:fitness-outline" style={styles.logoIcon} />
        <h1 style={styles.appName}>FitTrack Pro</h1>
      </div>
      <AuthForm 
        isLogin={isLoginView} 
        onAuthSuccess={handleAuthSuccess} 
        toggleFormType={toggleFormType} 
      />
       {authError && <p style={styles.globalError} className="error-message">{authError}</p>}
      <p style={styles.footerText}>
        Track your progress, achieve your goals.
      </p>
    </div>
  );
};

const styles = {
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 70px)', // Assuming navbar height is approx 70px
    padding: '20px',
    background: 'linear-gradient(135deg, var(--background-color) 0%, #e0e0e0 100%)', // Subtle gradient
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '30px',
    color: 'var(--primary-color)',
  },
  logoIcon: {
    fontSize: '48px',
    marginRight: '15px',
  },
  appName: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    fontFamily: 'var(--font-family-headings)',
  },
  footerText: {
    marginTop: '30px',
    color: 'var(--text-color-secondary)',
    fontSize: '0.9rem',
  },
  globalError: {
    marginTop: '15px',
    textAlign: 'center',
    width: '100%',
    maxWidth: '400px'
  }
};

export default AuthPage;
