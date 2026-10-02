import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

// Create Axios Instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor: Attach JWT Token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Format error messages and handle 401 unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      message:
        error.response?.data?.message ||
        error.message ||
        'An unexpected network error occurred.',
      status: error.response?.status,
      data: error.response?.data,
    };

    if (error.response?.status === 401) {
      // Optional: Handle token expiration if needed
      // localStorage.removeItem('token');
      // localStorage.removeItem('user');
    }

    return Promise.reject(customError);
  }
);

export default api;
