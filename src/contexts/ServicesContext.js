import React, { createContext, useContext, useState, useCallback } from 'react';

const ServicesContext = createContext();

// Custom hook to use the context
export const useServices = () => {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices must be used within ServicesProvider');
  }
  return context;
};

// Context provider
export const ServicesProvider = ({ children }) => {
  // States
  const [services, setServices] = useState([]);
  const [currentService, setCurrentService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // States for filters and pagination
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    minPrice: '',
    maxPrice: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalServices: 0,
    servicesPerPage: 12,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Base configuration
  const API_BASE = process.env.REACT_APP_API_URL;

  // Utility function for API calls with auth
  const apiCall = async (url, options = {}) => {
    try {
      console.log('🌐 API Call:', url);
      
      // Get token from localStorage (same key as AuthContext)
      const token = localStorage.getItem('booking_token');
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }), // Add token if available
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API Response:', data.success);
      return data;
      
    } catch (err) {
      console.error('❌ API Error:', err.message);
      throw err;
    }
  };

  // Fetch all services with filters
  const fetchServices = useCallback(async (customFilters = null, page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const currentFilters = customFilters || filters;
      
      // Build URL parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '12');
      
      // Add non-empty filters
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value.toString());
        }
      });

      const url = `${API_BASE}/services?${params.toString()}`;
      const response = await apiCall(url);
      
      if (response.success && response.data) {
        setServices(response.data.services || []);
        setPagination(response.data.pagination || {
          currentPage: page,
          totalPages: 1,
          totalServices: 0,
          servicesPerPage: 12,
          hasNextPage: false,
          hasPrevPage: false
        });
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (err) {
      console.error('Error fetchServices:', err);
      setError(`Error loading services: ${err.message}`);
      setServices([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalServices: 0,
        servicesPerPage: 12,
        hasNextPage: false,
        hasPrevPage: false
      });
    } finally {
      setLoading(false);
    }
  }, [filters, API_BASE]);

  // Fetch service by ID
  const fetchServiceById = useCallback(async (id) => {
    if (!id) {
      setError('Service ID required');
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentService(null);
    
    try {
      const url = `${API_BASE}/services/${id}`;
      const response = await apiCall(url);
      
      if (response.success && response.data) {
        setCurrentService(response.data);
      } else {
        throw new Error('Service not found');
      }
      
    } catch (err) {
      console.error('Error fetchServiceById:', err);
      setError(`Service not found: ${err.message}`);
      setCurrentService(null);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    console.log('🔍 Updating filters:', newFilters);
    setFilters(newFilters);
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    console.log('🔄 Resetting filters');
    const defaultFilters = {
      category: '',
      type: '',
      minPrice: '',
      maxPrice: '',
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    setFilters(defaultFilters);
  }, []);

  // Clear errors
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ✅ CREATE A NEW SERVICE WITH PERFECT IMAGE HANDLING
  const createService = useCallback(async (serviceData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check token
      const token = localStorage.getItem('booking_token');
      if (!token) {
        throw new Error('You must be logged in to create a service');
      }

      // Check admin role client-side (additional security)
      const storedUser = localStorage.getItem('booking_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.role !== 'admin') {
          throw new Error('Only administrators can create services');
        }
      }

      console.log('📝 ===== CREATING SERVICE - COMPLETE DEBUG =====');
      console.log('📊 Original serviceData:', serviceData);
      console.log('🖼️ Original images array:', serviceData.images);
      console.log('📸 Number of images:', serviceData.images?.length || 0);

      // ✅ VALIDATE AND CLEAN IMAGE DATA
      const validatedImages = (serviceData.images || []).map((image, index) => {
        console.log(`🔍 Validating image ${index + 1}:`, image);
        
        const cleanImage = {
          url: image.url || '',
          alt: image.alt || `Image ${index + 1}`,
          type: 'image', // ✅ ENSURE TYPE IS ALWAYS 'image'
          isUploaded: false, // ✅ FALSE FOR URL-BASED IMAGES
          uploadedAt: image.uploadedAt || new Date()
        };

        console.log(`✅ Clean image ${index + 1}:`, cleanImage);
        return cleanImage;
      });

      console.log('🎯 Final validated images:', validatedImages);
      console.log('📊 Final validated images count:', validatedImages.length);

      // ✅ ENSURE ALL DATA IS TRANSMITTED PERFECTLY
      const completeServiceData = {
        name: serviceData.name || '',
        description: serviceData.description || '',
        price: Number(serviceData.price) || 0,
        duration: Number(serviceData.duration) || 120,
        category: serviceData.category || 'photo',
        type: serviceData.type || 'portrait',
        maxParticipants: Number(serviceData.maxParticipants) || 1,
        isActive: serviceData.isActive !== undefined ? serviceData.isActive : true,
        
        // ✅ PERFECT IMAGE TRANSMISSION
        images: validatedImages,
        videos: serviceData.videos || [],
        equipment: serviceData.equipment || [],
        tags: serviceData.tags || [],
        deliverables: serviceData.deliverables || {
          photos: { digitalCount: 0, printCount: 0 },
          videos: { duration: 0 },
          deliveryTime: 7
        },
        location: serviceData.location || { type: 'studio' }
      };

      console.log('🚀 ===== FINAL DATA TO SEND =====');
      console.log('📊 Complete service data:', completeServiceData);
      console.log('🖼️ Final images to send:', completeServiceData.images);
      console.log('📈 Images count to send:', completeServiceData.images.length);
      console.log('🎬 Videos to send:', completeServiceData.videos);
      console.log('🔧 Equipment to send:', completeServiceData.equipment);
      console.log('🏷️ Tags to send:', completeServiceData.tags);

      const url = `${API_BASE}/services`;
      const response = await apiCall(url, {
        method: 'POST',
        body: JSON.stringify(completeServiceData)
      });
      
      if (response.success) {
        console.log('🎉 ===== SERVICE CREATED SUCCESSFULLY =====');
        console.log('✅ Server response:', response.data);
        console.log('📸 Images saved on server:', response.data.images?.length || 0);
        console.log('🎬 Videos saved on server:', response.data.videos?.length || 0);
        console.log('🔧 Equipment saved on server:', response.data.equipment?.length || 0);
        console.log('🏷️ Tags saved on server:', response.data.tags?.length || 0);
        
        // Log each saved image for verification
        if (response.data.images && response.data.images.length > 0) {
          response.data.images.forEach((img, index) => {
            console.log(`✅ Saved image ${index + 1}:`, {
              url: img.url,
              alt: img.alt,
              type: img.type,
              isUploaded: img.isUploaded
            });
          });
        }
        
        // Reload services
        await fetchServices();
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Error during creation');
      }
      
    } catch (err) {
      console.error('❌ ===== ERROR CREATING SERVICE =====');
      console.error('❌ Error details:', err);
      const errorMessage = `Error during creation: ${err.message}`;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [API_BASE, fetchServices]);

  // Update service (ADMIN ONLY)
  const updateService = useCallback(async (serviceId, serviceData) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('booking_token');
      if (!token) {
        throw new Error('You must be logged in to update a service');
      }

      console.log('📝 Updating service:', serviceId, serviceData);

      const url = `${API_BASE}/services/${serviceId}`;
      const response = await apiCall(url, {
        method: 'PUT',
        body: JSON.stringify(serviceData)
      });
      
      if (response.success) {
        // Reload services
        await fetchServices();
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Error during update');
      }
      
    } catch (err) {
      console.error('Error updateService:', err);
      const errorMessage = `Error during update: ${err.message}`;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [API_BASE, fetchServices]);

  // Delete service (ADMIN ONLY)
  const deleteService = useCallback(async (serviceId) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('booking_token');
      if (!token) {
        throw new Error('You must be logged in to delete a service');
      }

      const url = `${API_BASE}/services/${serviceId}`;
      const response = await apiCall(url, {
        method: 'DELETE'
      });
      
      if (response.success) {
        // Reload services
        await fetchServices();
        return { success: true, message: 'Service deleted successfully' };
      } else {
        throw new Error(response.message || 'Error during deletion');
      }
      
    } catch (err) {
      console.error('Error deleteService:', err);
      const errorMessage = `Error during deletion: ${err.message}`;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [API_BASE, fetchServices]);

  // Context values
  const contextValue = {
    // States
    services,
    currentService,
    loading,
    error,
    filters,
    pagination,
    
    // Actions
    fetchServices,
    fetchServiceById,
    updateFilters,
    resetFilters,
    clearError,
    createService,
    updateService,
    deleteService
  };

  return (
    <ServicesContext.Provider value={contextValue}>
      {children}
    </ServicesContext.Provider>
  );
};