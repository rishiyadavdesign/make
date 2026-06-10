import axios from 'axios';

const defaultBaseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5001/api' : '/api');
export const api = axios.create({
  baseURL: defaultBaseURL,
  timeout: 45000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bpsToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. The server may still be waking up.';
    }
    return Promise.reject(error);
  }
);

export const endpoints = {
  users: '/users',
  events: '/events',
  appNotes: '/app-notes',
  calendarPlans: '/calendar-plans',
  tasks: '/tasks',
  equipment: '/equipment',
  responsibilities: '/responsibilities',
  checklist: '/checklist',
  notes: '/notes',
  notifications: '/notifications',
  submissions: '/submissions',
  messages: '/messages',
  dashboard: '/dashboard'
};
