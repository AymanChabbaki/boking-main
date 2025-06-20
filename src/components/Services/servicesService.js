// ===== servicesService.js =====
import api from './api';

export const servicesService = {
  // ✅ Get all services
  getAllServices: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      // Add filters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/services?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error in getAllServices:', error);
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // ✅ Get service by ID
  getServiceById: async (serviceId) => {
    try {
      const response = await api.get(`/services/${serviceId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error in getServiceById:', error);
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // ✅ Create new service (admin)
  createService: async (serviceData) => {
    try {
      console.log('📝 Creating service with data:', serviceData);
      
      const response = await api.post('/services', serviceData);
      return response.data;
    } catch (error) {
      console.error('❌ Error in createService:', error);
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // ✅ Update service (admin)
  updateService: async (serviceId, updateData) => {
    try {
      console.log('📝 Updating service:', serviceId, updateData);
      
      const response = await api.put(`/services/${serviceId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('❌ Error in updateService:', error);
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // ✅ Delete service (admin)
  deleteService: async (serviceId) => {
    try {
      console.log('🗑️ Deleting service:', serviceId);
      
      const response = await api.delete(`/services/${serviceId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error in deleteService:', error);
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // ✅ Get service categories
  getServiceCategories: async () => {
    try {
      const response = await api.get('/services/categories');
      return response.data;
    } catch (error) {
      console.error('❌ Error in getServiceCategories:', error);
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // ✅ Get popular services
  getPopularServices: async (limit = 6) => {
    try {
      const response = await api.get(`/services/popular?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error in getPopularServices:', error);
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // ✅ Search services
  searchServices: async (query, filters = {}) => {
    try {
      const params = new URLSearchParams();
      params.append('search', query);
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/services/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error in searchServices:', error);
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // ✅ Utilities
  formatPrice: (price, currency = 'USD') => {
    if (!price && price !== 0) return 'Price on request';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  },

  formatDuration: (duration) => {
    if (!duration) return 'Duration not defined';
    
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}min`;
    }
  },

  getCategoryLabel: (category) => {
    const labels = {
      photo: 'Photography',
      video: 'Videography',
      'photo-video': 'Photo & Video'
    };
    return labels[category] || category;
  },

  getTypeLabel: (type) => {
    const labels = {
      portrait: 'Portrait',
      wedding: 'Wedding',
      event: 'Event',
      corporate: 'Corporate',
      product: 'Product',
      'real-estate': 'Real Estate',
      sports: 'Sports',
      nature: 'Nature',
      fashion: 'Fashion',
      newborn: 'Newborn',
      family: 'Family',
      pregnancy: 'Pregnancy',
      baptism: 'Baptism',
      birthday: 'Birthday',
      other: 'Other'
    };
    return labels[type] || type;
  },

  // ✅ Client-side validation
  validateServiceData: (data) => {
    const errors = [];

    if (!data.name || data.name.trim().length < 3) {
      errors.push('Service name must contain at least 3 characters');
    }

    if (!data.description || data.description.trim().length < 10) {
      errors.push('Description must contain at least 10 characters');
    }

    if (!data.category) {
      errors.push('Category is required');
    }

    if (!data.type) {
      errors.push('Service type is required');
    }

    if (!data.price || data.price <= 0) {
      errors.push('Price must be greater than 0');
    }

    if (!data.duration || data.duration < 15) {
      errors.push('Minimum duration is 15 minutes');
    }

    if (!data.maxParticipants || data.maxParticipants < 1) {
      errors.push('Maximum number of participants must be at least 1');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

export default servicesService;