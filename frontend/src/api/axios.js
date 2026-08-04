import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/',
  // baseURL: 'http://3.108.121.188/',
  // baseURL: 'http://169.58.124.215/',
  // Remove the default Content-Type header
  // Let each request set its own Content-Type
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