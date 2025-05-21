import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Custom hook to access authentication context.
 * Provides an easy way for components to get auth state and functions.
 * @returns {object} The authentication context value (token, user, isAuthenticated, isLoadingAuth, authError, login, signup, logout, clearAuthError).
 * @throws {Error} If used outside of an AuthProvider.
 */
const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined || context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
