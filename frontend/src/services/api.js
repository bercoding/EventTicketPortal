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
  timeout: 30000,
  withCredentials: false
});

// Request interceptor để log các request và thêm token
api.interceptors.request.use(
  (config) => {
    const url = config.url || '';
    const fullUrl = `${config.baseURL || API_BASE_URL}${url}`;
    
    // Log all API requests with full details
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${fullUrl}`);
    
    // CRITICAL: Check for invalid eventId in URL with comprehensive patterns
    const invalidPatterns = ['/null', '/undefined', '/null/', '/undefined/', '=null', '=undefined'];
    const hasInvalidPattern = invalidPatterns.some(pattern => url.includes(pattern));
    
    if (hasInvalidPattern) {
      console.error('🚨 BLOCKED: Request contains invalid eventId pattern!');
      console.error('Full URL:', fullUrl);
      console.error('Config:', config);
      console.error('User agent:', navigator.userAgent);
      console.error('Current location:', window.location.href);
      console.trace('Request stack trace:');
      
      // Alert user for debugging
      alert('🚨 API CALL BLOCKED!\n\nURL: ' + fullUrl + '\n\nThis invalid API call was prevented. You will be redirected to the events page.\n\nThis alert helps developers trace the bug source.');
      
      // Force redirect and block the request
      window.location.replace('/events');
      return Promise.reject(new Error(`Invalid eventId detected in request URL: ${fullUrl}`));
    }
    
    // Thêm token vào header nếu có
    const token = localStorage.getItem('token');
    if (token) {
      console.log('🔑 Adding token to request headers');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('⚠️ No token found for request');
    }

    return config;
  },
  (error) => {
    console.error('🔴 Request Error:', error);
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
      url: error.config?.url,
      method: error.config?.method
    });

    // Debug authentication headers for upload routes
    if (error.response?.status === 401 && error.config?.url?.includes('upload')) {
      console.error('🔐 Debug Auth Header:', {
        header: error.config?.headers?.Authorization ? 'Present (first 10 chars): ' + error.config.headers.Authorization.substring(0, 10) + '...' : 'Missing',
        token: localStorage.getItem('token') ? 'Present in localStorage (first 10 chars): ' + localStorage.getItem('token').substring(0, 10) + '...' : 'Missing from localStorage',
        contentType: error.config?.headers['Content-Type'] || 'Not specified'
      });
    }

    // Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('🚫 Authentication/Authorization failed');
      
      // Check if token exists but is invalid
      const token = localStorage.getItem('token');
      if (token) {
        console.log('🗑️ Removing invalid token');
        localStorage.removeItem('token');
      }
      
      // Don't redirect if on profile page or login page or create event page
      const currentPath = window.location.pathname;
      const isProfilePage = currentPath.includes('/profile') || currentPath.includes('/user-profile');
      const isLoginPage = currentPath.includes('/login');
      const isCreateEventPage = currentPath.includes('/create-event');
      
      // Redirect to login only if not already on login page or profile page or create event page
      if (!isLoginPage && !isProfilePage && !isCreateEventPage) {
        console.log('🔄 Redirecting to login page');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API with better error handling
const authAPI = {
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      console.log('Register response:', response.data);
      return {
        success: response.data.success,
        message: response.data.message,
        email: response.data.email,
        error: response.data.error
      };
    } catch (error) {
      console.error('Register failed:', error.response?.data || error.message);
      throw error;
    }
  },

  verifyOTP: async (otpData) => {
    try {
      console.log('Verifying OTP for:', otpData.email);
      const response = await api.post('/auth/verify-otp', otpData);
      console.log('OTP verification response:', response.data);
      
      if (response.data.success) {
        console.log('OTP verification successful, saving token');
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('OTP verification failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  resendOTP: async (email) => {
    try {
      const response = await api.post('/auth/resend-otp', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.success) {
        console.log('Token saved after login');
        localStorage.setItem('token', response.data.token);
        return response.data;
      }
      return response.data;
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  googleLogin: async (token) => {
    try {
      const response = await api.post('/auth/google', { token });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Google login failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  getMe: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get user info failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Forgot password failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  // Xác thực OTP cho reset password (alias cho tương thích)
  verifyOtp: async ({ email, otp }) => {
    try {
      const response = await api.post('/auth/verify-reset-otp', { email, otp });
      return response.data;
    } catch (error) {
      console.error('Verify OTP failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  // Xác thực OTP reset password
  verifyResetOTP: async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-reset-otp', { email, otp });
      return response.data;
    } catch (error) {
      console.error('Verify reset OTP failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  // Đặt lại mật khẩu với OTP
  resetPasswordWithOTP: async (email, otp, password) => {
    try {
      const response = await api.post('/auth/reset-password-with-otp', { email, otp, password });
      return response.data;
    } catch (error) {
      console.error('Reset password with OTP failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  resetPassword: async (token, password) => {
    try {
      const response = await api.post('/auth/reset-password', { token, password });
      return response.data;
    } catch (error) {
      console.error('Reset password failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    return api.post('/auth/logout');
  },
};

export { authAPI };

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

  // Like/Unlike post
  likePost: (id) => api.post(`/posts/${id}/like`),
  // Get users who liked post
  getPostLikes: (id) => api.get(`/posts/${id}/likes`),
};

// Comment API
export const commentAPI = {
  likeComment: (id) => api.post(`/comments/${id}/like`),
  getCommentLikes: (id) => api.get(`/comments/${id}/likes`),
};

// Event API
export const eventAPI = {
  // Get all events
  getEvents: async () => {
    try {
      const response = await api.get('/events');
      return response.data;
    } catch (error) {
      console.error('Get events failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
  
  // Get event by ID
  getEventById: async (id) => {
    try {
      const response = await api.get(`/events/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get event by ID failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
  
  // Create new event
  createEvent: async (eventData) => {
    try {
      const response = await api.post('/events', eventData);
      return response.data;
    } catch (error) {
      console.error('Create event failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
  
  // Create event with seating
  createEventWithSeating: (eventData) => api.post('/events/create-with-seating', eventData),
  
  // Update event
  updateEvent: async (id, eventData) => {
    try {
      const response = await api.put(`/events/${id}`, eventData);
      return response.data;
    } catch (error) {
      console.error('Update event failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
  
  // Delete event
  deleteEvent: async (id) => {
    try {
      const response = await api.delete(`/events/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete event failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
  
  // Update seating map
  updateSeatingMap: (id, seatingData) => api.post(`/events/${id}/update-seating-map`, seatingData),
  
  // Get seating map
  getSeatingMap: (id) => api.get(`/events/${id}/seating-map`),

  // Get my events
  getMyEvents: async () => {
    try {
      const response = await api.get('/events/my-events');
      return response.data;
    } catch (error) {
      console.error('Get my events failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  // Upload event image
  uploadEventImage: async (id, formData) => {
    try {
      const response = await api.post(`/events/${id}/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Upload event image failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }
};

// User Profile API
export const userProfileAPI = {
  // Get current user profile
  getCurrentUserProfile: async () => {
    try {
      const response = await api.get('/users/profile/me');
      return response.data;
    } catch (error) {
      console.error('Get profile failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
  
  // Update user profile
  updateUserProfile: async (userData) => {
    try {
      const response = await api.put('/users/profile/me', userData);
      return response.data;
    } catch (error) {
      console.error('Update profile failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
  
  // Update avatar
  updateUserAvatar: async (formData) => {
    try {
      const response = await api.put('/users/profile/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Update avatar failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
  
  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/users/profile/me/change-password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Change password failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
  
  // Get owner request status
  getOwnerRequestStatus: async () => {
    try {
      const response = await api.get('/users/owner-request/status');
      return response.data;
    } catch (error) {
      console.error('Get owner request status failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
  
  // Submit owner request
  requestOwnerRole: async (requestData) => {
    try {
      const response = await api.post('/users/request-owner', requestData);
      return response.data;
    } catch (error) {
      console.error('Request owner role failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
};

// Booking API
export const bookingAPI = {
  // Create booking
  createBooking: (bookingData) => api.post('/bookings', bookingData),
  
  // Get user bookings
  getUserBookings: () => api.get('/bookings/user'),
  
  // Get booking by ID
  getBookingById: (id) => api.get(`/bookings/${id}`),
  
  // Cancel booking
  cancelBooking: (id) => api.put(`/bookings/${id}/cancel`),
};

// Search Users API
export const searchUsersAPI = (searchTerm) => api.get(`/users/search?q=${encodeURIComponent(searchTerm)}`);

// POS Payment APIs
export const confirmPOSPayment = (paymentId) => api.put(`/payments/pos/${paymentId}/confirm`);
export const cancelPOSPayment = (paymentId) => api.put(`/payments/pos/${paymentId}/cancel`);

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

// Tickets API
export const ticketAPI = {
  // Create ticket
  createTicket: async (eventId, ticketData) => {
    try {
      const response = await api.post(`/events/${eventId}/tickets`, ticketData);
      return response.data;
    } catch (error) {
      console.error('Create ticket failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  // Get event tickets
  getEventTickets: async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}/tickets`);
      return response.data;
    } catch (error) {
      console.error('Get event tickets failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  // Update ticket
  updateTicket: async (eventId, ticketId, ticketData) => {
    try {
      const response = await api.put(`/events/${eventId}/tickets/${ticketId}`, ticketData);
      return response.data;
    } catch (error) {
      console.error('Update ticket failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  // Delete ticket
  deleteTicket: async (eventId, ticketId) => {
    try {
      const response = await api.delete(`/events/${eventId}/tickets/${ticketId}`);
      return response.data;
    } catch (error) {
      console.error('Delete ticket failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  // Purchase ticket
  purchaseTicket: async (eventId, ticketId, quantity) => {
    try {
      const response = await api.post(`/events/${eventId}/tickets/${ticketId}/purchase`, { quantity });
      return response.data;
    } catch (error) {
      console.error('Purchase ticket failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }
};

// Orders API
export const orderAPI = {
  // Get my orders
  getMyOrders: async () => {
    try {
      const response = await api.get('/orders/my-orders');
      return response.data;
    } catch (error) {
      console.error('Get my orders failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  // Get order
  getOrder: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Get order failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  // Cancel order
  cancelOrder: async (orderId) => {
    try {
      const response = await api.post(`/orders/${orderId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Cancel order failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }
};

// Review API
export const reviewAPI = {
  // Get all reviews for an event
  getReviews: async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}/reviews`);
      return response.data;
    } catch (error) {
      console.error('Get reviews failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  // Get a single review by ID for an event
  getReviewById: async (eventId, reviewId) => {
    try {
      const response = await api.get(`/events/${eventId}/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      console.error('Get review by ID failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  // Create a new review for an event
  createReview: async (eventId, reviewData) => {
    try {
      const response = await api.post(`/events/${eventId}/reviews`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Create review failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  // Update a review by ID for an event
  updateReview: async (eventId, reviewId, reviewData) => {
    try {
      const response = await api.put(`/events/${eventId}/reviews/${reviewId}`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Update review failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  // Delete a review by ID for an event
  deleteReview: async (eventId, reviewId) => {
    try {
      const response = await api.delete(`/events/${eventId}/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      console.error('Delete review failed:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
};

// Helper functions for common operations
export const uploadImage = async (file, type) => {
  try {
    const formData = new FormData();
    formData.append(type, file);

    // Lấy token trực tiếp từ localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Không tìm thấy token xác thực');
    }

    console.log(`🔒 Uploading ${type} with token: ${token.substring(0, 10)}...`);

    // Tạo request riêng thay vì dùng qua interceptor
    const response = await axios.post(
      `${API_BASE_URL}/events/upload-images`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      }
    );

    if (response.data.success) {
      return {
        success: true,
        url: `http://localhost:5001${response.data.data[type]}`
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'Upload thất bại'
      };
    }
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message
    };
  }
};

export default api;