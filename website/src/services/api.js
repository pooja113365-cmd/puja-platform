import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
export const TOKEN_KEY = 'puja_token';

const api = axios.create({ baseURL: API_URL, timeout: 20000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Expired / invalid session: clear it and let AuthContext redirect to login.
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

export function errorMessage(err) {
  if (err?.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (!err?.response) return 'Network error. Please check your connection and try again.';
  return err.response.data?.message || 'Something went wrong. Please try again.';
}

export default api;

