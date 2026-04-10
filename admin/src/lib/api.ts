/**
 * Axios instance for the ALiN admin API.
 * Reads the admin JWT from localStorage (set after Supabase login).
 */
import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('alin_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('alin_admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);
