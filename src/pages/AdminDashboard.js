import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useServices } from '../contexts/ServicesContext';

// Lazy loading components
const BookingCalendar = lazy(() => import('./BookingCalendar'));
const UserManagement = lazy(() => import('./UserManagement'));
const CreateServiceForm = lazy(() => import('../components/Services/CreateServiceForm'));
const EditServiceForm = lazy(() => import('./EditServiceForm'));

// Loading component - Mobile optimized
const LoadingSpinner = ({ text = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-6 sm:py-8">
    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mb-2"></div>
    <p className="text-gray-600 text-xs sm:text-sm">{text}</p>
  </div>
);

// Admin service actions component - Mobile optimized
const AdminServiceActions = ({ service, onUpdate }) => {
  const { updateService, deleteService } = useServices();
  const [loading, setLoading] = useState(false);

  const handleEdit = useCallback(() => {
    onUpdate('edit', service);
  }, [service, onUpdate]);

  const handleDelete = useCallback(async () => {
    if (window.confirm(`Delete service "${service.name}"?`)) {
      setLoading(true);
      try {
        const result = await deleteService(service._id);
        if (result.success && onUpdate) {
          onUpdate('delete', service);
        }
      } catch (error) {
        console.error('Error deleting service:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [service._id, service.name, deleteService, onUpdate, service]);

  return (
    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
      <button
        onClick={handleEdit}
        disabled={loading}
        className="text-blue-600 hover:text-blue-800 active:text-blue-900 text-sm font-medium transition-colors disabled:opacity-50 px-2 py-1 rounded hover:bg-blue-50"
      >
        Edit
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-red-600 hover:text-red-800 active:text-red-900 text-sm font-medium transition-colors disabled:opacity-50 px-2 py-1 rounded hover:bg-red-50"
      >
        {loading ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const { services, loading: servicesLoading, fetchServices } = useServices();

  // Interface states
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Service states
  const [editingService, setEditingService] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Statistics states
  const [stats, setStats] = useState({
    totalServices: 0,
    totalBookings: 0,
    totalUsers: 0,
    revenue: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0
  });

  // Booking states
  const [allBookings, setAllBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllServices, setShowAllServices] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAllBookings, setShowAllBookings] = useState(false);
  const [bookingSearchTerm, setBookingSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deletingBookingId, setDeletingBookingId] = useState(null);

  // Load user statistics
  const fetchUserStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('booking_token');
      const response = await fetch('https://backend-main-production-78c0.up.railway.app/api/admin/users/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.data.total || 0;
        }
      }
      return 0;
    } catch (error) {
      console.error('Error loading user stats:', error);
      return 0;
    }
  }, []);

  // Load all statistics
  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('booking_token');
      const userCount = await fetchUserStats();

      let totalRevenue = 0;
      allBookings.forEach(booking => {
        if (booking.status === 'confirmed' || booking.status === 'completed') {
          totalRevenue += booking.pricing?.totalAmount || booking.service?.price || 0;
        }
      });
      
      setStats({
        totalServices: services.length,
        totalBookings: allBookings.length,
        totalUsers: userCount,
        revenue: totalRevenue,
        pendingBookings: allBookings.filter(b => b.status === 'pending').length,
        confirmedBookings: allBookings.filter(b => b.status === 'confirmed').length,
        completedBookings: allBookings.filter(b => b.status === 'completed').length,
        cancelledBookings: allBookings.filter(b => b.status === 'cancelled').length
      });
      
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [services.length, fetchUserStats, allBookings]);

  // Load all bookings
  const fetchAllBookings = useCallback(async (forceRefresh = false) => {
    try {
      setBookingsLoading(true);
      
      const token = localStorage.getItem('booking_token');
      const timestamp = new Date().getTime();
      const url = `https://backend-main-production-78c0.up.railway.app/api/bookings/admin/all?_t=${timestamp}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        throw new Error('Error loading bookings');
      }

      const data = await response.json();
      if (data.success) {
        const bookingsData = data.data || [];
        setAllBookings(bookingsData);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  // Force complete refresh
  const forceRefreshData = useCallback(async () => {
    await fetchServices();
    await fetchAllBookings(true);
    setRefreshTrigger(prev => prev + 1);
  }, [fetchServices, fetchAllBookings]);

  // Permanently delete a booking
  const handleDeleteBooking = useCallback(async (bookingId, bookingInfo) => {
    const clientName = bookingInfo.clientName || `${bookingInfo.client?.firstName} ${bookingInfo.client?.lastName}`.trim();
    const serviceName = bookingInfo.service?.name || bookingInfo.serviceName || 'this booking';
    const bookingDate = new Date(bookingInfo.bookingDate).toLocaleDateString('en-US');

    if (window.confirm(`⚠️ WARNING ⚠️\n\nAre you sure you want to PERMANENTLY DELETE the booking?\n\nClient: ${clientName}\nService: ${serviceName}\nDate: ${bookingDate}\n\nThis action is IRREVERSIBLE.`)) {
      try {
        setDeletingBookingId(bookingId);
        
        const token = localStorage.getItem('booking_token');
        const response = await fetch(`https://backend-main-production-78c0.up.railway.app/api/bookings/${bookingId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error deleting');
        }

        const data = await response.json();
        
        if (data.success) {
          await forceRefreshData();
          alert(`Booking for ${clientName} permanently deleted!`);
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert(`Error: ${error.message}`);
      } finally {
        setDeletingBookingId(null);
      }
    }
  }, [forceRefreshData]);

  // Initial data loading
  useEffect(() => {
    fetchServices();
    fetchAllBookings(true);
  }, [fetchServices, fetchAllBookings, refreshTrigger]);

  // Recalculate stats
  useEffect(() => {
    if (allBookings.length >= 0) {
      fetchStats();
    }
  }, [allBookings, services, fetchStats]);

  // Update booking status
  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const token = localStorage.getItem('booking_token');
      let response;
      
      if (newStatus === 'confirmed') {
        response = await fetch(`https://backend-main-production-78c0.up.railway.app/api/bookings/${bookingId}/accept`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      } else if (newStatus === 'cancelled') {
        response = await fetch(`https://backend-main-production-78c0.up.railway.app/api/bookings/${bookingId}/reject`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            reason: 'Booking rejected by administrator' 
          })
        });
      } else {
        response = await fetch(`https://backend-main-production-78c0.up.railway.app/api/bookings/${bookingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        });
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await forceRefreshData();
          
          const statusText = newStatus === 'confirmed' ? 'accepted' : 
                           newStatus === 'cancelled' ? 'rejected' : 
                           newStatus === 'completed' ? 'marked as completed' : 'updated';
          
          alert(`Booking ${statusText} successfully!`);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Update error');
      }
    } catch (error) {
      console.error('Booking update error:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Handle service actions
  const handleServiceUpdate = useCallback((action, serviceData) => {
    if (action === 'edit') {
      setEditingService(serviceData);
      setShowEditForm(true);
    } else if (action === 'delete') {
      setRefreshTrigger(prev => prev + 1);
    } else if (action === 'update') {
      setShowEditForm(false);
      setEditingService(null);
      setRefreshTrigger(prev => prev + 1);
    }
  }, []);

  const handleEditSuccess = useCallback((updatedService) => {
    handleServiceUpdate('update', updatedService);
  }, [handleServiceUpdate]);

  // Filtered services
  const filteredServices = React.useMemo(() => {
    return services.filter(service => 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [services, searchTerm]);

  const servicesToShow = React.useMemo(() => {
    return showAllServices ? filteredServices : filteredServices.slice(0, 5);
  }, [showAllServices, filteredServices]);

  // Filtered and sorted bookings
  const filteredAndSortedBookings = React.useMemo(() => {
    let filtered = allBookings.filter(booking => {
      if (filterStatus !== 'all' && booking.status !== filterStatus) {
        return false;
      }

      if (bookingSearchTerm) {
        const serviceName = booking.service?.name || booking.serviceName || '';
        const clientName = `${booking.client?.firstName || ''} ${booking.client?.lastName || ''}`.trim();
        const searchTerm = bookingSearchTerm.toLowerCase();
        
        return serviceName.toLowerCase().includes(searchTerm) || 
               clientName.toLowerCase().includes(searchTerm);
      }
      
      return true;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.bookingDate);
        const dateB = new Date(b.bookingDate);
        
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          return 0;
        }
        
        return sortOrder === 'desc' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
      } else if (sortBy === 'price') {
        const priceA = a.pricing?.totalAmount || a.service?.price || 0;
        const priceB = b.pricing?.totalAmount || b.service?.price || 0;
        return sortOrder === 'desc' ? priceB - priceA : priceA - priceB;
      }
      return 0;
    });
    
    return filtered;
  }, [allBookings, filterStatus, bookingSearchTerm, sortBy, sortOrder]);

  const bookingsToShow = showAllBookings ? filteredAndSortedBookings : filteredAndSortedBookings.slice(0, 5);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return '✅ Confirmed';
      case 'pending': return '⏳ Pending';
      case 'completed': return '✓ Completed';
      case 'cancelled': return '✗ Cancelled';
      default: return status;
    }
  };

  // Mobile navigation menu - Enhanced responsive
  const NavigationTabs = () => (
    <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 sm:px-6">
        {/* Mobile menu */}
        <div className="sm:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center justify-between w-full py-3 text-left touch-manipulation"
          >
            <span className="font-medium text-sm">
              {activeTab === 'overview' && '📊 Overview'}
              {activeTab === 'calendar' && '📅 Calendar'}
              {activeTab === 'bookings' && '📋 Bookings'}
              {activeTab === 'services' && '🛠️ Services'}
              
            </span>
            <svg className={`w-5 h-5 transform transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isMobileMenuOpen && (
            <div className="pb-3 space-y-1">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'calendar', label: 'Calendar', icon: '📅' },
                { id: 'bookings', label: 'Bookings', icon: '📋' },
                { id: 'services', label: 'Services', icon: '🛠️' },
               
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center w-full px-3 py-3 text-left rounded-lg transition-colors touch-manipulation ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                  }`}
                >
                  <span className="mr-3 text-base">{tab.icon}</span>
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop menu */}
        <div className="hidden sm:flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'calendar', label: 'Calendar', icon: '📅' },
            { id: 'bookings', label: 'Bookings', icon: '📋' },
            { id: 'services', label: 'Services', icon: '🛠️' },
        
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main header - Mobile optimized */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                  Admin Dashboard
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 truncate">
                  Welcome {user?.firstName}, manage your platform
                </p>
              </div>
            </div>
            
            <button
              onClick={forceRefreshData}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-3 sm:py-2 rounded-lg font-medium transition-colors flex items-center justify-center sm:justify-start space-x-2 touch-manipulation"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <NavigationTabs />

      {/* Main content - Mobile responsive padding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Statistics - Mobile optimized grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="ml-2 sm:ml-3 md:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Services</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{stats.totalServices}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-2 sm:ml-3 md:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Bookings</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="ml-2 sm:ml-3 md:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Users</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-2 sm:ml-3 md:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Revenue</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{stats.revenue} €</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Bookings - Mobile optimized */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Bookings</h2>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {filteredAndSortedBookings.length} booking{filteredAndSortedBookings.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
              
              {bookingsLoading ? (
                <LoadingSpinner text="Loading bookings..." />
              ) : bookingsToShow.length === 0 ? (
                <div className="p-4 sm:p-6 text-center">
                  <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No bookings in the system
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    Clients have not made any bookings yet.
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-200">
                    {bookingsToShow.slice(0, 3).map((booking) => (
                      <div key={booking._id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                              <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 truncate">
                                {booking.service?.name || booking.serviceName || 'Service'}
                              </h3>
                              <span className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full self-start sm:self-auto ${getStatusColor(booking.status)}`}>
                                {getStatusText(booking.status)}
                              </span>
                            </div>
                            
                            <div className="text-xs sm:text-sm text-gray-500 space-y-1">
                              <div>
                                <span className="font-medium">Client:</span> {booking.clientName || `${booking.client?.firstName} ${booking.client?.lastName}` || 'Not specified'}
                              </div>
                              <div>
                                <span className="font-medium">Date:</span> {new Date(booking.bookingDate).toLocaleDateString('en-US')} • 
                                <span className="font-medium ml-2">Time:</span> {booking.startTime}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right lg:text-right">
                            <span className="text-lg sm:text-xl font-bold text-gray-900">
                              {booking.pricing?.totalAmount || booking.service?.price || 0} €
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 text-center border-t border-gray-200">
                    <button 
                      onClick={() => setActiveTab('bookings')}
                      className="text-blue-600 hover:text-blue-800 active:text-blue-900 font-medium transition-colors text-sm sm:text-base"
                    >
                      View all bookings
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Calendar header - Mobile optimized */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Booking Calendar</h2>
                  <p className="text-sm sm:text-base text-gray-600">View and manage all bookings</p>
                </div>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 py-3 sm:py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 touch-manipulation"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Booking</span>
                </button>
              </div>
            </div>

            {/* Calendar component */}
            <Suspense fallback={<LoadingSpinner text="Loading calendar..." />}>
              <BookingCalendar
                bookings={allBookings}
                loading={bookingsLoading}
                onDateSelect={(date) => console.log('Selected date:', date)}
                onBookingClick={(booking) => console.log('Clicked booking:', booking)}
              />
            </Suspense>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Booking management - Mobile optimized */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Booking Management</h2>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {filteredAndSortedBookings.length} booking{filteredAndSortedBookings.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Filters and search - Mobile responsive */}
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search by service or client..."
                      value={bookingSearchTerm}
                      onChange={(e) => setBookingSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    />
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-3 sm:py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="date">Sort by date</option>
                    <option value="price">Sort by price</option>
                  </select>

                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="px-3 py-3 sm:py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {sortBy === 'date' ? (
                      <>
                        <option value="desc">🕐 Most recent first</option>
                        <option value="asc">🕑 Oldest first</option>
                      </>
                    ) : (
                      <>
                        <option value="desc">💰 Highest price first</option>
                        <option value="asc">💰 Lowest price first</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
              
              {bookingsLoading ? (
                <LoadingSpinner text="Loading bookings..." />
              ) : filteredAndSortedBookings.length === 0 ? (
                <div className="p-4 sm:p-6 text-center">
                  <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {allBookings.length === 0 ? 'No bookings in the system' : 'No matching bookings'}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    {bookingSearchTerm ? `No bookings found for "${bookingSearchTerm}"` : 
                     filterStatus === 'all' ? 'Clients have not made any bookings yet.' : 
                     `No ${filterStatus} bookings.`}
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-200">
                    {filteredAndSortedBookings.map((booking) => (
                      <div key={booking._id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                              <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                                {booking.service?.name || booking.serviceName || 'Service'}
                              </h3>
                              <span className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full self-start sm:self-auto ${getStatusColor(booking.status)}`}>
                                {getStatusText(booking.status)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                              <div className="space-y-2">
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span className="font-medium">Client:</span>
                                  <span className="ml-1 truncate">{booking.clientName || `${booking.client?.firstName} ${booking.client?.lastName}` || 'Not specified'}</span>
                                </div>
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  <span className="font-medium">Email:</span>
                                  <span className="ml-1 truncate">{booking.client?.email || 'Not specified'}</span>
                                </div>
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  <span className="font-medium">Phone:</span>
                                  <span className="ml-1">{booking.client?.phone || 'Not specified'}</span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span className="font-medium">Date:</span>
                                  <span className="ml-1">{new Date(booking.bookingDate).toLocaleDateString('en-US')}</span>
                                </div>
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="font-medium">Time:</span>
                                  <span className="ml-1">{booking.startTime} - {booking.endTime}</span>
                                </div>
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                  </svg>
                                  <span className="font-medium">Photographer:</span>
                                  <span className="ml-1">{booking.photographer?.name || 'Not assigned'}</span>
                                </div>
                              </div>
                            </div>
                            
                            {booking.clientNotes && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs sm:text-sm text-gray-600">
                                  <span className="font-medium">Client Notes:</span> {booking.clientNotes}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 lg:gap-4">
                            <div className="text-left sm:text-right lg:text-right">
                              <span className="text-xl sm:text-2xl font-bold text-gray-900">
                                {booking.pricing?.totalAmount || booking.service?.price || 0} €
                              </span>
                              <p className="text-xs text-gray-500">
                                {booking.service?.duration ? `${Math.floor(booking.service.duration / 60)}h${booking.service.duration % 60 > 0 ? `${booking.service.duration % 60}min` : ''}` : ''}
                              </p>
                            </div>

                            {/* Action buttons - Mobile optimized */}
                            <div className="flex flex-row sm:flex-col lg:flex-col gap-2 w-full sm:w-auto">
                              {/* Buttons for pending bookings */}
                              {booking.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                                    className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-3 py-2 rounded text-sm font-medium transition-colors touch-manipulation"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                                    className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-3 py-2 rounded text-sm font-medium transition-colors touch-manipulation"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {/* Button to mark as completed if confirmed */}
                              {booking.status === 'confirmed' && (
                                <button
                                  onClick={() => updateBookingStatus(booking._id, 'completed')}
                                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3 py-2 rounded text-sm font-medium transition-colors touch-manipulation"
                                >
                                  Mark as completed
                                </button>
                              )}

                              {/* Delete button for ALL bookings */}
                              <button
                                onClick={() => handleDeleteBooking(booking._id, booking)}
                                disabled={deletingBookingId === booking._id}
                                className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                                title="Delete this booking permanently"
                              >
                                {deletingBookingId === booking._id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Service management - Mobile optimized */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">Service Management</h2>
                  <button 
                    onClick={() => setShowCreateForm(true)}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 py-3 sm:py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation"
                  >
                    New Service
                  </button>
                </div>
              </div>

              {/* Search bar - Mobile optimized */}
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search for a service..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>
              </div>
              
              {servicesLoading ? (
                <LoadingSpinner text="Loading services..." />
              ) : servicesToShow.length === 0 ? (
                <div className="p-4 sm:p-6 text-center">
                  <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No services</h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">Create your first service.</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="mt-3 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-3 sm:py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation"
                  >
                    Create a service
                  </button>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-200">
                    {servicesToShow.map((service) => (
                      <div key={service._id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                              <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">{service.name}</h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full self-start sm:self-auto ${
                                service.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {service.isActive !== false ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center text-xs sm:text-sm text-gray-500 mb-2 gap-2">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                {service.category}
                              </span>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                {service.type}
                              </span>
                              <span>{Math.floor(service.duration / 60)}h{service.duration % 60 > 0 ? `${service.duration % 60}min` : ''}</span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{service.description}</p>
                          </div>
                          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 lg:gap-4">
                            <span className="text-lg sm:text-xl font-bold text-gray-900">{service.price} €</span>
                            <AdminServiceActions 
                              service={service} 
                              onUpdate={handleServiceUpdate}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Button to show more/less - Mobile optimized */}
                  {!searchTerm && filteredServices.length > 5 && (
                    <div className="p-4 text-center border-t border-gray-200">
                      <button 
                        onClick={() => setShowAllServices(!showAllServices)}
                        className="text-blue-600 hover:text-blue-800 active:text-blue-900 font-medium transition-colors text-sm sm:text-base"
                      >
                        {showAllServices ? (
                          <>Show fewer services</>
                        ) : (
                          <>Show all services ({filteredServices.length})</>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'clients' && (
          <Suspense fallback={<LoadingSpinner text="Loading clients..." />}>
            <UserManagement />
          </Suspense>
        )}
      </div>

      {/* Modals */}
      {showEditForm && editingService && (
        <Suspense fallback={<LoadingSpinner text="Loading form..." />}>
          <EditServiceForm
            service={editingService}
            onClose={() => {
              setShowEditForm(false);
              setEditingService(null);
            }}
            onSuccess={handleEditSuccess}
          />
        </Suspense>
      )}

      {showCreateForm && (
        <Suspense fallback={<LoadingSpinner text="Loading form..." />}>
          <CreateServiceForm
            onClose={() => setShowCreateForm(false)}
            onSuccess={() => {
              setShowCreateForm(false);
              setRefreshTrigger(prev => prev + 1);
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

export default AdminDashboard;