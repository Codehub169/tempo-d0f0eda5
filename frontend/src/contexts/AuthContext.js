import React, { createContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';
import { useNavigate } from 'react-router-dom';

// Create context
export const AuthContext = createContext(null);

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Initially true to check auth status
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  // Function to set user and token in state and localStorage
  const setAuthData = useCallback((userData, userToken) => {
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(userToken);
    setUser(userData);
    apiService.setAuthHeader(userToken); // Update API service header
    setAuthError(null);
  }, []);

  // Check authentication status on initial load
  useEffect(() => {
    const verifyToken = async () => {
      setIsLoadingAuth(true);
      const storedToken = localStorage.getItem('token');
      const storedUser = JSON.parse(localStorage.getItem('user'));

      if (storedToken && storedUser) {
        // Optionally, you could add a call to a backend endpoint 
        // to verify the token is still valid and get fresh user data.
        // For now, we assume if token and user are in localStorage, it's valid.
        setToken(storedToken);
        setUser(storedUser);
        apiService.setAuthHeader(storedToken);
      } else {
        // No token, ensure user is logged out
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        apiService.setAuthHeader(null);
      }
      setIsLoadingAuth(false);
    };
    verifyToken();
  }, []);

  // Login function
  const login = async (username, password) => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const response = await apiService.login({ username, password });
      if (response && response.token && response.user) {
        setAuthData(response.user, response.token);
        setIsLoadingAuth(false);
        return true; // Indicate success
      } else {
        throw new Error(response.message || 'Login failed: Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred during login.';
      setAuthError(errorMessage);
      setIsLoadingAuth(false);
      return false; // Indicate failure
    }
  };

  // Signup function
  const signup = async (username, password) => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const response = await apiService.signup({ username, password });
      if (response && response.token && response.user) {
        setAuthData(response.user, response.token);
        setIsLoadingAuth(false);
        return true; // Indicate success
      } else {
        throw new Error(response.message || 'Signup failed: Invalid response from server');
      }
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred during signup.';
      setAuthError(errorMessage);
      setIsLoadingAuth(false);
      return false; // Indicate failure
    }
  };

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    apiService.setAuthHeader(null); // Clear auth header in apiService
    setAuthError(null);
    // Navigate to auth page after logout is handled by Navbar or calling component
  }, []);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        isLoadingAuth,
        authError,
        login,
        signup,
        logout,
        clearAuthError: () => setAuthError(null) // Function to manually clear auth errors
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
