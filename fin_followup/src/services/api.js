import axios from 'axios';

// Use environment-aware URL - production on Vercel, local for development
const API_URL = import.meta.env.PROD
    ? '/api'  // Use relative path in production (same domain)
    : 'http://localhost:5000/api';  // Local development

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to attach the Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`; // We'll add server verification later
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle Token Expiry/Invalidation
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token is invalid or expired
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
