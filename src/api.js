import { demoApi } from './demoApi';

const DEMO_MODE = String(import.meta.env.VITE_DEMO_MODE || '').toLowerCase() === 'true';
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
const LOGIN_URL = `${import.meta.env.BASE_URL}login`;

async function realApi(path, options = {}) {
  const token = localStorage.getItem('billar_token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'No se pudo completar la operación.');
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function api(path, options = {}) {
  try {
    return DEMO_MODE ? await demoApi(path, options) : await realApi(path, options);
  } catch (error) {
    if (error?.status === 401) {
      localStorage.removeItem('billar_token');
      if (!location.pathname.endsWith('/login')) location.assign(LOGIN_URL);
    }
    throw error;
  }
}

export const get = path => api(path);
export const post = (path, body = {}) => api(path, { method: 'POST', body: JSON.stringify(body) });
export const put = (path, body = {}) => api(path, { method: 'PUT', body: JSON.stringify(body) });
export const del = (path, body = {}) => api(path, { method: 'DELETE', body: JSON.stringify(body) });
export const isDemoMode = DEMO_MODE;
