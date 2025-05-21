import axios from 'axios';

// The base URL for the API, configured via environment variable set by startup.sh
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create an axios instance with the base URL
const apiClient = axios.create({
  baseURL: API_URL,
});

/**
 * Sets the Authorization header for all subsequent requests made by this apiClient instance.
 * This function is typically called by AuthContext when the user logs in or token is loaded.
 * @param {string | null} token - The JWT token, or null to remove the header.
 */
const setAuthHeader = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

/**
 * Logs in a user.
 * @param {object} credentials - The user's credentials.
 * @param {string} credentials.username - The user's username.
 * @param {string} credentials.password - The user's password.
 * @returns {Promise<object>} The user data and token from the API.
 */
const login = async ({ username, password }) => {
  try {
    const response = await apiClient.post('/auth/login', { username, password });
    return response.data;
  } catch (error) {
    console.error('Login API error:', error.response ? error.response.data : error.message);
    throw error; // Propagate the original Axios error
  }
};

/**
 * Signs up a new user.
 * @param {object} credentials - The new user's credentials.
 * @param {string} credentials.username - The new user's username.
 * @param {string} credentials.password - The new user's password.
 * @returns {Promise<object>} The user data and token from the API.
 */
const signup = async ({ username, password }) => {
  try {
    const response = await apiClient.post('/auth/signup', { username, password });
    return response.data;
  } catch (error) {
    console.error('Signup API error:', error.response ? error.response.data : error.message);
    throw error; // Propagate the original Axios error
  }
};

/**
 * Verifies the current token and returns user data.
 * Assumes Authorization header is set via setAuthHeader.
 * @returns {Promise<object|null>} The user data from the API, or null if token is invalid (401/403).
 */
const verifyToken = async () => {
  try {
    const response = await apiClient.get('/auth/verify-token');
    return response.data;
  } catch (error) {
    console.error('Verify Token API error:', error.response ? error.response.data : error.message);
    // Do not throw if it's a 401 or 403, as this is an expected outcome for an invalid token
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      return null; 
    }
    throw error; // Propagate other errors (e.g., network, 500)
  }
};

/**
 * Logs a new workout entry.
 * Assumes Authorization header is set via setAuthHeader.
 * @param {object} workoutData - The workout entry data.
 * @returns {Promise<object>} The newly created workout entry and any PR info.
 */
const logWorkout = async (workoutData) => {
  try {
    const response = await apiClient.post('/workouts/', workoutData);
    return response.data;
  } catch (error) {
    console.error('Log Workout API error:', error.response ? error.response.data : error.message);
    throw error; // Propagate the original Axios error
  }
};

/**
 * Fetches the workout history for the authenticated user.
 * Assumes Authorization header is set via setAuthHeader.
 * @returns {Promise<Array<object>>} An array of workout entries.
 */
const getWorkoutHistory = async () => {
  try {
    const response = await apiClient.get('/workouts/history');
    return response.data;
  } catch (error) {
    console.error('Get Workout History API error:', error.response ? error.response.data : error.message);
    throw error; // Propagate the original Axios error
  }
};

/**
 * Fetches the personal records for the authenticated user.
 * Assumes Authorization header is set via setAuthHeader.
 * @returns {Promise<Array<object>>} An array of personal records.
 */
const getPersonalRecords = async () => {
  try {
    const response = await apiClient.get('/workouts/prs');
    return response.data;
  } catch (error) {
    console.error('Get Personal Records API error:', error.response ? error.response.data : error.message);
    throw error; // Propagate the original Axios error
  }
};

/**
 * Fetches progress data for a specific exercise for the authenticated user.
 * Assumes Authorization header is set via setAuthHeader.
 * @param {string} exerciseName - The name of the exercise to fetch progress for.
 * @returns {Promise<Array<object>>} An array of progress data points.
 */
const getExerciseProgress = async (exerciseName) => {
  try {
    const response = await apiClient.get(`/workouts/progress/${encodeURIComponent(exerciseName)}`);
    return response.data;
  } catch (error) {
    console.error('Get Exercise Progress API error:', error.response ? error.response.data : error.message);
    throw error; // Propagate the original Axios error
  }
};

const apiService = {
  setAuthHeader,
  login,
  signup,
  verifyToken,
  logWorkout,
  getWorkoutHistory,
  getPersonalRecords,
  getExerciseProgress,
};

export default apiService;
