import axios from 'axios';

// API URL configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

console.log('🔧 API Configuration:');
console.log('- REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('- Final API_BASE_URL:', API_BASE_URL);

// Create axios instance with better error handling
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000,
  withCredentials: false
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    let token;
    try {
      token = localStorage.getItem('token');
      console.log('🔒 Token status:', token ? 'found' : 'not found');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔑 Added token to request headers');
      }

      // For FormData requests, don't set Content-Type
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
        console.log('📦 FormData detected, removed Content-Type header');
      }
    } catch (error) {
      console.error('❌ Storage access error:', error);
    }

    console.log('📝 Request config:', {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      hasToken: !!token
    });

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle response with better error logging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });

    // Handle authentication errors
    if (error.response?.status === 401) {
      console.log('🚫 Authentication failed, clearing token...');
      localStorage.removeItem('token');
      // Redirect to login only if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API with better error handling
export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        console.log('Token saved after login');
      }
      return response;
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      throw error;
    }
  },
  register: (userData) => api.post('/auth/register', userData),
  logout: () => {
    localStorage.removeItem('token');
    return api.post('/auth/logout');
  },
  getProfile: () => api.get('/auth/me'),
};

// Post API
export const postAPI = {
  // Lấy tất cả posts
  getPosts: () => api.get('/posts'),
  
  // Lấy post theo ID
  getPostById: (id) => api.get(`/posts/${id}`),
  
  // Tạo post mới
  createPost: (formData) => api.post('/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // Cập nhật post
  updatePost: (id, formData) => api.put(`/posts/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // Xóa post
  deletePost: (id) => api.delete(`/posts/${id}`),
};

// Admin API
export const adminAPI = {
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard/stats'),

  // User management
  getUsers: (params) => api.get('/admin/users', { params }),
  banUser: (userId, data) => api.post(`/admin/users/${userId}/ban`, data),
  unbanUser: (userId) => api.post(`/admin/users/${userId}/unban`),

  // Event management
  getEvents: (params) => api.get('/admin/events', { params }),
  approveEvent: (eventId) => api.post(`/admin/events/${eventId}/approve`),
  rejectEvent: (eventId, data) => api.post(`/admin/events/${eventId}/reject`, data),

  // Complaint management
  getComplaints: (params) => api.get('/admin/complaints', { params }),
  resolveComplaint: (complaintId, data) => api.post(`/admin/complaints/${complaintId}/resolve`, data),

  // Post management
  getPosts: (params) => api.get('/admin/posts', { params }),
  moderatePost: (postId, data) => api.post(`/admin/posts/${postId}/moderate`, data),
  deletePost: (postId) => api.delete(`/admin/posts/${postId}`),

  // Violation reports
  getViolationReports: (params) => api.get('/admin/violation-reports', { params }),
  resolveViolationReport: (reportId, data) => api.post(`/admin/violation-reports/${reportId}/resolve`, data),

  // Revenue
  getRevenue: (params) => api.get('/admin/revenue', { params }),

  // Owner requests
  getOwnerRequests: (params) => api.get('/admin/owner-requests', { params }),
  approveOwnerRequest: (requestId) => api.post(`/admin/owner-requests/${requestId}/approve`),
  rejectOwnerRequest: (requestId, data) => api.post(`/admin/owner-requests/${requestId}/reject`, data),
};

export default api;