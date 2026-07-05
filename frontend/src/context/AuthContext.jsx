import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Function to decode JWT token
const decodeToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const res = await axios.get('/api/users/permissions/');
      setPermissions(res.data.permissions || []);
    } catch (err) {
      console.error('Error fetching user permissions:', err);
      setPermissions([]);
    } finally {
      setPermissionsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
    } else {
      setPermissionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPermissions();
    } else {
      setPermissions([]);
      setPermissionsLoading(false);
    }
  }, [isAuthenticated, user]);

  const login = (accessToken, userData) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  const hasPermission = (featureKey) => {
    if (user?.role === 'Admin') return true;
    return permissions.includes(featureKey);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, permissions, permissionsLoading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};
