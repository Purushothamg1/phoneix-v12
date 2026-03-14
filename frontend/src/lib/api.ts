import axios, { AxiosInstance, AxiosError } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

// ── Request interceptor: attach JWT + request correlation ID ─
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('phoneix_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  // Generate a client-side correlation ID for every request
  config.headers['X-Request-ID'] = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  return config;
});

// ── Response interceptor: handle 401 globally ─────────────────
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Clear stale credentials only if not already on login page
      if (!window.location.pathname.startsWith('/login')) {
        localStorage.removeItem('phoneix_token');
        localStorage.removeItem('phoneix_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
