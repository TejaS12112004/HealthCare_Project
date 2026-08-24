import axios from 'axios';

const ACCESS_TOKEN_KEY = 'hc_access_token';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
  // Ensure no trailing slash
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach Bearer token ──────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: handle 401 globally ────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hc_access_token');
      localStorage.removeItem('hc_refresh_token');
      localStorage.removeItem('hc_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default apiClient;
