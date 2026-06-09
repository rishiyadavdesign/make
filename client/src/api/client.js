import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bpsToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const endpoints = {
  users: '/users',
  events: '/events',
  tasks: '/tasks',
  equipment: '/equipment',
  responsibilities: '/responsibilities',
  checklist: '/checklist',
  notes: '/notes',
  notifications: '/notifications',
  submissions: '/submissions',
  dashboard: '/dashboard'
};
