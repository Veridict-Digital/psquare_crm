import { createContext, useContext, useState, useEffect } from 'react';

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

  useEffect(() => {
  const token = localStorage.getItem('access_token');
  const userData = localStorage.getItem('user');
  if (token && userData) {
    setUser(JSON.parse(userData));
    setIsAuthenticated(true);
  }
}, []);

const login = (accessToken, userData) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('user', JSON.stringify(userData));
  setUser(userData);
  setIsAuthenticated(true);
};



  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
