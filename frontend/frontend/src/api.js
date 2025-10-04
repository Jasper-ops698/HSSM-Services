import axios from 'axios';
import { API_BASE_URL } from './config';

// Central axios instance for the frontend. Import this instead of using
// process.env.REACT_APP_API_URL directly. This keeps baseURL centralized
// and easier to change for different environments.
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // You can add timeout, interceptors, etc. here if needed.
});

// Request interceptor to attach Authorization header from localStorage token
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore localStorage errors in some environments
  }
  return config;
}, (error) => Promise.reject(error));

export default api;
