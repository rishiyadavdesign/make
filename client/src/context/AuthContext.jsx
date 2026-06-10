import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bpsToken');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('bpsToken'))
      .finally(() => setLoading(false));
  }, []);

  async function login(payload) {
    const { data } = await api.post('/auth/login', payload);
    localStorage.setItem('bpsToken', data.token);
    setUser(data.user);
    return data.user;
  }

  async function accessCodeLogin(payload) {
    const { data } = await api.post('/auth/access-code-login', payload);
    localStorage.setItem('bpsToken', data.token);
    setUser(data.user);
    return data.user;
  }

  async function completeFirstLogin(payload) {
    const { data } = await api.post('/auth/first-login', payload);
    localStorage.setItem('bpsToken', data.token);
    setUser(data.user);
    return data.user;
  }

  async function updateProfile(payload) {
    const { data } = await api.put('/auth/profile', payload);
    setUser(data);
    return data;
  }

  async function changePassword(payload) {
    const { data } = await api.put('/auth/password', payload);
    return data;
  }

  function logout() {
    localStorage.removeItem('bpsToken');
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, login, accessCodeLogin, logout, completeFirstLogin, updateProfile, changePassword }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
