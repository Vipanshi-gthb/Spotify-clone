import axios from 'axios';

// Base API instance configured with credentials for cookie and token auth
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization header if token exists in localStorage
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('spotify_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling 401 unauth
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and on protected operation, clear token
      // Note: Do not automatically redirect on page load to allow guest mode
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  logout: () => API.post('/auth/logout'),
  getMe: () => API.get('/auth/me'),
};

export const musicAPI = {
  getAllMusics: (params) => API.get('/music', { params }),
  getAllAlbums: () => API.get('/music/albums'),
  getAlbumById: (id) => API.get(`/music/albums/${id}`),
  uploadMusic: (formData) =>
    API.post('/music/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  createAlbum: (data) => API.post('/music/album', data),
};

export default API;
