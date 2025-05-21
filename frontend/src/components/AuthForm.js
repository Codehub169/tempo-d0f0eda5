import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Icon } from '@iconify/react';
import userIcon from '@iconify-icons/lucide/user';
import lockIcon from '@iconify-icons/lucide/lock';
import mailIcon from '@iconify-icons/lucide/mail'; // Or use a username icon if preferred for signup

const AuthForm = ({ isLogin, onAuthSuccess, toggleFormType }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { login, signup, isLoadingAuth, authError } = useAuth();

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // Clear form and error when switching between login/signup
  useEffect(() => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  }, [isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      let success = false;
      if (isLogin) {
        success = await login(username, password);
      } else {
        success = await signup(username, password);
      }
      if (success && onAuthSuccess) {
        onAuthSuccess(); // Callback, likely to navigate or update UI
      }
    } catch (err) {
      // Error is handled by authError effect, but can set local error too
      setError(err.message || 'Authentication failed. Please try again.');
    }
  };

  return (
    <div className=\"auth-form-container card\">
      <h2>{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
      <p className=\"auth-form-subtitle\">{isLogin ? 'Login to continue your fitness journey.' : 'Join FitTrack Pro today.'}</p>
      <form onSubmit={handleSubmit} className=\"auth-form\">
        {error && <p className=\"error-message\">{error}</p>}
        
        <div className=\"form-group input-with-icon\">
          <label htmlFor=\"username\"><Icon icon={userIcon} /> Username</label>
          <input
            type=\"text\"
            id=\"username\"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder=\"Enter your username\"
            required
            className={error.toLowerCase().includes('username') ? 'input-error' : ''}
          />
        </div>

        <div className=\"form-group input-with-icon\">
          <label htmlFor=\"password\"><Icon icon={lockIcon} /> Password</label>
          <input
            type=\"password\"
            id=\"password\"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isLogin ? 'Enter your password' : 'Create a strong password'}
            required
            className={error.toLowerCase().includes('password') ? 'input-error' : ''}
          />
        </div>

        {!isLogin && (
          <div className=\"form-group input-with-icon\">
            <label htmlFor=\"confirmPassword\"><Icon icon={lockIcon} /> Confirm Password</label>
            <input
              type=\"password\"
              id=\"confirmPassword\"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder=\"Confirm your password\"
              required
              className={error.toLowerCase().includes('match') ? 'input-error' : ''}
            />
          </div>
        )}

        <button type=\"submit\" className=\"btn btn-primary btn-block\" disabled={isLoadingAuth}>
          {isLoadingAuth ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
        </button>
      </form>
      <p className=\"toggle-form-text mt-2\">
        {isLogin ? "Don't have an account? " : 'Already have an account? '}
        <button onClick={toggleFormType} className=\"toggle-form-button\">
          {isLogin ? 'Sign Up' : 'Login'}
        </button>
      </p>
      <style jsx>{`
        .auth-form-container {
          max-width: 400px;
          margin: 2rem auto;
          padding: 2rem;
          background-color: var(--surface-color);
          box-shadow: var(--box-shadow);
          border-radius: var(--border-radius);
        }
        .auth-form-subtitle {
          color: #666;
          margin-bottom: 1.5rem;
          font-size: 0.95rem;
        }
        .auth-form h2 {
          text-align: center;
          margin-bottom: 0.5rem;
          color: var(--primary-color-dark);
        }
        .input-with-icon label {
          display: flex;
          align-items: center;
          gap: 8px; /* Spacing between icon and text */
        }
        .input-with-icon .iconify {
          font-size: 1.2em;
          color: var(--primary-color);
        }
        .btn-block {
          width: 100%;
          padding: 0.8rem;
          font-size: 1.1rem;
        }
        .toggle-form-text {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.9rem;
        }
        .toggle-form-button {
          background: none;
          border: none;
          color: var(--primary-color);
          font-weight: bold;
          cursor: pointer;
          padding: 0;
          font-size: 0.9rem;
        }
        .toggle-form-button:hover {
          text-decoration: underline;
          color: var(--primary-color-dark);
        }
      `}</style>
    </div>
  );
};

export default AuthForm;
