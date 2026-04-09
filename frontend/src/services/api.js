import axios from 'axios';

// Centralized API Configuration
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request Interceptor: Attach Auth Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response Interceptor: Global Error Handling & Retries
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Retry once if it's a network error or 5xx server error
    if (error.code === 'ECONNABORTED' || !error.response) {
       if (!originalRequest._retry) {
          originalRequest._retry = true;
          console.log('[API] Retrying initial connection...');
          return api(originalRequest);
       }
    }

    // Handle 401 Unauthorized or 403 Forbidden (Session Expired/Invalid)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn("Session expired or invalid - clearing session");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if we are not already on the login page
      if (!window.location.hash.includes('/login')) {
         window.location.hash = '#/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
