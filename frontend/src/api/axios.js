import axios from 'axios';

// In Docker/production VITE_API_BASE_URL is set to '/' at build time so all
// requests go through the nginx reverse proxy on the same origin.
// In local dev it falls back to the Django dev server address.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/',
});

// Add request interceptor for authentication if needed
api.interceptors.request.use(
  (config) => {
    // Always use access_token for JWT
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Only set Content-Type to application/json if it's not FormData
    // and if the Content-Type hasn't been set already
    if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      // Optionally redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;