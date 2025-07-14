import api from './api';

const friendService = {
  // Get friends list
  getFriendsList: async (userId) => {
    try {
      const response = await api.get(`/friends/list/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get friend requests received
  getFriendRequests: async (userId) => {
    try {
      const response = await api.get(`/friends/requests/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get pending requests sent
  getPendingRequests: async (userId) => {
    try {
      const response = await api.get(`/friends/pending/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Search users
  searchUsers: async (userId, query) => {
    try {
      const response = await api.get(`/friends/search/${userId}?query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Send friend request
  sendFriendRequest: async (senderId, receiverId) => {
    try {
      const response = await api.post('/friends/add', {
        senderId,
        receiverId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Accept friend request
  acceptFriendRequest: async (userId, requesterId) => {
    try {
      const response = await api.post('/friends/accept-request', {
        userId,
        requesterId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Reject friend request
  rejectFriendRequest: async (userId, requesterId) => {
    try {
      const response = await api.post('/friends/reject-request', {
        userId,
        requesterId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Cancel friend request
  cancelFriendRequest: async (senderId, receiverId) => {
    try {
      const response = await api.post('/friends/cancel-request', {
        senderId,
        receiverId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Unfriend
  unfriend: async (userId, friendId) => {
    try {
      const response = await api.post('/friends/unfriend', {
        userId,
        friendId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Block user
  blockUser: async (userId, friendId) => {
    try {
      const response = await api.post('/friends/block', {
        userId,
        friendId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Unblock user
  unblockUser: async (userId, friendId) => {
    try {
      const response = await api.post('/friends/unblock', {
        userId,
        friendId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get blocked users
  getBlockedUsers: async (userId) => {
    try {
      const response = await api.get(`/friends/blocked/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user profile
  getUserProfile: async (userId, targetUserId) => {
    try {
      const response = await api.get(`/friends/profile/${userId}/${targetUserId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get recommended friends
  getRecommendedFriends: async (userId) => {
    try {
      const response = await api.get(`/friends/recommended/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default friendService;
