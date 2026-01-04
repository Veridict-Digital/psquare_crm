import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/',
  // baseURL: 'http://3.108.121.188/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication if needed
api.interceptors.request.use(
  (config) => {
    // Always use access_token for JWT
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
