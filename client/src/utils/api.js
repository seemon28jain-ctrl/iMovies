/**
 * api.js - Axios instance with auth interceptors
 * Automatically attaches user and admin auth tokens from localStorage
 */
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor to attach auth tokens
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('imovies-token');
  const adminToken = localStorage.getItem('imovies-admin-token');
  if (token) config.headers['auth-token'] = token;
  if (adminToken) config.headers['admin-auth-token'] = adminToken;
  return config;
}, (error) => Promise.reject(error));

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401, clear tokens and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('imovies-token');
      localStorage.removeItem('imovies-admin-token');
    }
    return Promise.reject(error);
  }
);

export default api;
