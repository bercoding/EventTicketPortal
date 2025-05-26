import axios from 'axios';

// Hardcode API URL để debug
const API_BASE_URL = 'http://localhost:5001/api';

console.log('🔧 API Configuration:');
console.log('- REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('- Final API_BASE_URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
    });
    
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

// Handle response errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown'
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.response?.status === 403 && error.response?.data?.banned) {
      // User is banned, don't redirect automatically
      // Let the component handle this case
      console.log('🚫 User is banned:', error.response.data);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
};

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