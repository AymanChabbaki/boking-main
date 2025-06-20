// ===== bookingService.js =====
import api from './api';

export const bookingService = {
  // Create new booking
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      console.error('Booking creation error:', error);
      throw error;
    }
  },

  // Get logged in user's bookings
  getUserBookings: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      
      const response = await api.get(`/bookings/my-bookings?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }
  },

  // Accept booking (Admin)
  acceptBooking: async (id) => {
    try {
      const response = await api.patch(`/bookings/${id}/accept`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error accepting booking ${id}:`, error);
      throw error.response?.data || { message: 'Network error during acceptance' };
    }
  },

  // ✅ Reject booking (Admin)
  rejectBooking: async (id, reason = '') => {
    try {
      const response = await api.patch(`/bookings/${id}/reject`, { reason });
      return response.data;
    } catch (error) {
      console.error(`❌ Error rejecting booking ${id}:`, error);
      throw error.response?.data || { message: 'Network error during rejection' };
    }
  },

  // Get all bookings (admin)
  getAllBookings: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      if (params.photographer) queryParams.append('photographer', params.photographer);
      if (params.date) queryParams.append('date', params.date);
      
      const response = await api.get(`/bookings?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all bookings:', error);
      throw error;
    }
  },

  // Get booking by ID
  getBookingById: async (id) => {
    try {
      const response = await api.get(`/bookings/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }
  },

  // Update booking
  updateBooking: async (id, updateData) => {
    try {
      const response = await api.put(`/bookings/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  },

  // Cancel booking
  cancelBooking: async (id) => {
    try {
      const response = await api.patch(`/bookings/${id}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  },

  // Get available time slots
  getAvailableSlots: async (date, photographer, serviceId = null) => {
    try {
      const queryParams = new URLSearchParams({
        date,
        photographer
      });
      
      if (serviceId) {
        queryParams.append('serviceId', serviceId);
      }
      
      const response = await api.get(`/bookings/available-slots?${queryParams}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching time slots:', error);
      throw error;
    }
  },

  // Get booking statistics (admin)
  getBookingStats: async () => {
    try {
      const response = await api.get('/bookings/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  },

  // Utility functions for statuses
  getStatusLabel: (status) => {
    const statusMap = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  },

  getStatusColor: (status) => {
    const colorMap = {
      'pending': 'warning',
      'confirmed': 'success',
      'completed': 'info',
      'cancelled': 'error'
    };
    return colorMap[status] || 'default';
  },

  // Check if booking can be modified
  canModifyBooking: (booking) => {
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return false;
    }
    
    const bookingDateTime = new Date(booking.date);
    const [hours, minutes] = booking.time.split(':');
    bookingDateTime.setHours(parseInt(hours), parseInt(minutes));
    
    const now = new Date();
    const timeDiff = bookingDateTime.getTime() - now.getTime();
    
    // Can be modified if at least 24h in the future
    return timeDiff > 24 * 60 * 60 * 1000;
  },

  // Format date for display
  formatDate: (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // Format price
  formatPrice: (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  },

  // Calculate duration between two times
  calculateDuration: (startTime, duration) => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(start.getTime() + duration * 60000);
    return end.toTimeString().slice(0, 5);
  }
};