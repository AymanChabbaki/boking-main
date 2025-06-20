// ===== userService.js =====
import api from './api';

export const userService = {
  // Get all users (admin)
  getAllUsers: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);
      if (params.role) queryParams.append('role', params.role);
      
      const response = await api.get(`/admin/users?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get user by ID (admin)
  getUserById: async (id) => {
    try {
      const response = await api.get(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  // Create new user (admin)
  createUser: async (userData) => {
    try {
      const response = await api.post('/admin/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user (admin)
  updateUser: async (id, updateData) => {
    try {
      const response = await api.put(`/admin/users/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Delete user (admin)
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Change user password (admin)
  changeUserPassword: async (id, newPassword) => {
    try {
      const response = await api.patch(`/admin/users/${id}/password`, {
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  // Get user statistics (admin)
  getUserStats: async () => {
    try {
      const response = await api.get('/admin/users/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      throw error;
    }
  },

  // Utility functions
  getRoleLabel: (role) => {
    const roleMap = {
      'client': 'Client',
      'admin': 'Administrator'
    };
    return roleMap[role] || role;
  },

  getRoleColor: (role) => {
    const colorMap = {
      'client': 'primary',
      'admin': 'error'
    };
    return colorMap[role] || 'default';
  },

  // Validate user data
  validateUserData: (userData) => {
    const errors = {};

    if (!userData.name || userData.name.trim().length < 2) {
      errors.name = 'Name must contain at least 2 characters';
    }

    if (!userData.email || !isValidEmail(userData.email)) {
      errors.email = 'Invalid email';
    }

    if (userData.password && userData.password.length < 6) {
      errors.password = 'Password must contain at least 6 characters';
    }

    if (userData.phone && !isValidPhone(userData.phone)) {
      errors.phone = 'Invalid phone format';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Format creation date
  formatCreatedAt: (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Calculate time since creation
  getTimeSince: (date) => {
    const now = new Date();
    const created = new Date(date);
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }
};

// Validation functions
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9+\-\s\(\)]+$/;
  return phoneRegex.test(phone);
};
