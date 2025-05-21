import React, { createContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';
// import { useNavigate } from 'react-router-dom'; // Not currently used, but can be if context needs to navigate

// Create context
export const AuthContext = createContext(null);

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch (error) {
      localStorage.removeItem('user'); // Clear corrupted user data
      return null;
    }
  });
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Initially true to check auth status
  const [authError, setAuthError] = useState(null);
  // const navigate = useNavigate(); // See comment above

  // Function to set user and token in state and localStorage
  const setAuthData = useCallback((userData, userToken) => {
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(userToken);
    setUser(userData);
    apiService.setAuthHeader(userToken); // Update API service header
    setAuthError(null);
  }, []);

  // Logout function - defined early for use in verifyToken process
  const performLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    apiService.setAuthHeader(null); // Clear auth header in apiService
    setAuthError(null);
    // Navigation to /auth should be handled by components observing isAuthenticated state
  }, []);

  // Check authentication status on initial load
  useEffect(() => {
    const initialAuthCheck = async () => {
      setIsLoadingAuth(true);
      const storedToken = localStorage.getItem('token');

      if (storedToken) {
        apiService.setAuthHeader(storedToken); // Set header for verifyToken call
        try {
          const verifiedUser = await apiService.verifyToken();
          if (verifiedUser) {
            // Token is valid, user data is fresh
            setAuthData(verifiedUser, storedToken);
          } else {
            // Token invalid (e.g. 401/403 from verifyToken) or other issue
            performLogout();
          }
        } catch (error) {
          // API call failed (network error, server error during verification)
          console.error('Token verification failed on load:', error);
          performLogout(); 
        }
      } else {
        // No token, ensure user is logged out state
        performLogout(); // Ensures state is clean if no token
      }
      setIsLoadingAuth(false);
    };
    initialAuthCheck();
  }, [setAuthData, performLogout]); // Dependencies are correct

  const handleAuthOperation = async (apiCall, credentials) => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const response = await apiCall(credentials);
      if (response && response.token && response.user) {
        setAuthData(response.user, response.token);
        setIsLoadingAuth(false);
        return true; // Indicate success
      } else {
        // This case should ideally not be reached if API service throws structured errors
        throw new Error('Authentication failed: Invalid response from server');
      }
    } catch (error) {
      console.error('Auth operation error:', error.name, error.message);
      let displayMessage = 'An unexpected error occurred during authentication.'; // Default
      
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (errorData.msg) {
          displayMessage = errorData.msg;
        } else if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          const firstErrorObject = errorData.errors[0];
          displayMessage = Object.values(firstErrorObject)[0] || error.message; // Gets the message part
        } else if (typeof errorData === 'string') {
            displayMessage = errorData;
        }
      } else if (error.message) { // For network errors or other non-HTTP errors
        displayMessage = error.message;
      }
      
      setAuthError(displayMessage);
      setIsLoadingAuth(false);
      return false; // Indicate failure
    }
  };

  // Login function
  const login = async (username, password) => {
    return handleAuthOperation(apiService.login, { username, password });
  };

  // Signup function
  const signup = async (username, password) => {
    return handleAuthOperation(apiService.signup, { username, password });
  };

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
        logout: performLogout, // Use the correctly defined logout
        clearAuthError: () => setAuthError(null) // Function to manually clear auth errors
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
