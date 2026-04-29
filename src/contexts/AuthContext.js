import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        } else {
          // Si guardamos el usuario en login, lo recuperamos
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          } else {
            setUser({ username: decoded.username || 'Usuario', id: decoded.user_id, loggedIn: true });
          }
        }
      } catch (err) {
        console.error("Invalid token", err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/users/login/', { username, password });
      
      // Axios no tiene response.success por defecto a menos que lo devuelva el backend explícitamente en JSON
      // Por defecto tirará error 400/401 si falla
      
      // Si el backend devuelve success en su cuerpo:
      const access_token = response.data.data?.access || response.data.access;
      const user_data = response.data.data?.user || response.data.user || { username };

      if (access_token) {
        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(user_data));
        setUser(user_data);
        return { success: true };
      }
      return { success: false, error: response.data.message || 'Error en login' };
    } catch (err) {
      console.error('Login error:', err);
      const errMsg = err.response?.data?.detail || err.response?.data?.message || 'Error de conexión con el servidor';
      return { success: false, error: errMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);