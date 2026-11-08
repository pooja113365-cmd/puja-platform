import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const defaultHost = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
export const API_URL = process.env.EXPO_PUBLIC_API_URL || `${defaultHost}/api`;
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || defaultHost;
export const TOKEN_KEY = 'puja_token';

let memoryToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export const setAuthToken = async (token: string | null) => {
  memoryToken = token;
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
};
export const getAuthToken = () => memoryToken;
export const loadStoredToken = async () => {
  memoryToken = await AsyncStorage.getItem(TOKEN_KEY);
  return memoryToken;
};
export const onUnauthorized = (fn: (() => void) | null) => { unauthorizedHandler = fn; };

const api = axios.create({ baseURL: API_URL, timeout: 20000 });

api.interceptors.request.use((config) => {
  if (memoryToken) config.headers.Authorization = `Bearer ${memoryToken}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    if (error.response?.status === 401 && memoryToken) {
      await setAuthToken(null);
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  }
);

export function errorMessage(err: unknown): string {
  const e = err as AxiosError<{ message?: string }>;
  if (e?.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (e?.isAxiosError && !e.response) return 'Network error. Check your connection and try again.';
  if (e?.response) return e.response.data?.message || 'Something went wrong. Please try again.';
  return (err as Error)?.message || 'Something went wrong. Please try again.';
}

export default api;

