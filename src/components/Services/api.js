// ===== api.js =====
import axios from 'axios';

// Base configuration
const API_BASE_URL = process.env.REACT_APP_API_URL;

console.log('🔧 API Base URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===============================
// REQUEST INTERCEPTORS
// ===============================
api.interceptors.request.use(
  (config) => {
    // Add authentication token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data
      });
    }

    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// ===============================
// RESPONSE INTERCEPTORS
// ===============================
api.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }

    // Check data before using split()
    if (response.data && response.data.someString) {
      const value = response.data.someString;
      if (typeof value === 'string') {
        const parts = value.split(','); // Use split only if it's a string
        console.log(parts);
      } else {
        console.error('Value is not a string:', value);
      }
    }

    return response;
  },
  (error) => {
    console.error('❌ Response error:', error);

    // Handle authentication errors
    if (error.response?.status === 401) {
      console.log('🔒 Token expired or invalid - Redirecting to login');

      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirect to login page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      }
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      console.error('💥 Server error:', error.response.data);

      // You can add a toast error notification here
      if (window.showErrorToast) {
        window.showErrorToast('Server error. Please try again later.');
      }
    }

    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      console.error('🌐 Network error');

      if (window.showErrorToast) {
        window.showErrorToast('Connection problem. Check your internet connection.');
      }
    }

    // Handle timeout
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Request timeout');

      if (window.showErrorToast) {
        window.showErrorToast('Request took too long. Please try again.');
      }
    }

    return Promise.reject(error);
  }
);

// ===============================
// UTILITY FUNCTIONS
// ===============================

// Helper for GET requests
export const get = async (url, params = {}, config = {}) => {
  try {
    const response = await api.get(url, { 
      params, 
      ...config 
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Helper for POST requests
export const post = async (url, data = {}, config = {}) => {
  try {
    const response = await api.post(url, data, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Helper for PUT requests
export const put = async (url, data = {}, config = {}) => {
  try {
    const response = await api.put(url, data, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Helper for DELETE requests
export const del = async (url, data = {}, config = {}) => {
  try {
    const response = await api.delete(url, { 
      data, 
      ...config 
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Helper for file uploads
export const upload = async (url, formData, onProgress = null) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      };
    }

    const response = await api.post(url, formData, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// ===============================
// ERROR HANDLING
// ===============================
const handleApiError = (error) => {
  // If it's a network error
  if (!error.response) {
    return {
      success: false,
      message: 'Connection error. Check your internet connection.',
      error: 'NETWORK_ERROR'
    };
  }

  // If server returned an error response
  const { status, data } = error.response;
  
  // Validation errors (400)
  if (status === 400) {
    return {
      success: false,
      message: data.message || 'Invalid data',
      errors: data.errors || [],
      error: 'VALIDATION_ERROR'
    };
  }

  // Authentication errors (401)
  if (status === 401) {
    return {
      success: false,
      message: 'You must be logged in to access this resource',
      error: 'AUTH_ERROR'
    };
  }

  // Authorization errors (403)
  if (status === 403) {
    return {
      success: false,
      message: 'You don\'t have the necessary permissions',
      error: 'PERMISSION_ERROR'
    };
  }

  // Resource not found (404)
  if (status === 404) {
    return {
      success: false,
      message: data.message || 'Resource not found',
      error: 'NOT_FOUND'
    };
  }

  // Conflict (409) - often used for booking conflicts
  if (status === 409) {
    return {
      success: false,
      message: data.message || 'Conflict detected',
      error: 'CONFLICT_ERROR'
    };
  }

  // Server errors (500+)
  if (status >= 500) {
    return {
      success: false,
      message: 'Internal server error. Please try again later.',
      error: 'SERVER_ERROR'
    };
  }

  // Other errors
  return {
    success: false,
    message: data.message || 'An error occurred',
    error: 'UNKNOWN_ERROR'
  };
};

// ===============================
// URL BUILDING UTILITIES
// ===============================
export const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, item));
      } else {
        searchParams.append(key, value);
      }
    }
  });
  
  return searchParams.toString();
};

// ===============================
// VERIFICATION METHODS
// ===============================
export const checkConnection = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  return !!(token && user);
};

export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('❌ Error parsing user data:', error);
    localStorage.removeItem('user');
    return null;
  }
};

export const setAuthData = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// ===============================
// DEFAULT EXPORT
// ===============================
export default api;