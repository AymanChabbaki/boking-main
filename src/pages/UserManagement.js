import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import EditUserModal from './EditUserModal';
import CreateUserModal from './CreateUserModal';
import DeleteConfirmModal from './DeleteConfirmModal';

const UserManagement = () => {
  const { api, isAdmin } = useAuth();
  
  // NEW STATE to manage views
  const [activeView, setActiveView] = useState('users'); // 'users' or 'clients'
  
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]); // NEW for bookings
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // States for pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Mobile UI states
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'

  // NEW STATES for client view
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDetails, setShowClientDetails] = useState(false);

  // States for modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // States for statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    clients: 0
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setViewMode('card');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ✅ FIXED: Function to format time correctly with AM/PM
  const formatTime = (timeString) => {
    if (!timeString) return 'Not specified';
    
    try {
      // Check if it's already in HH:mm format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (timeRegex.test(timeString)) {
        // Convert 24h to 12h format with AM/PM
        const [hours, minutes] = timeString.split(':');
        const hour24 = parseInt(hours, 10);
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const period = hour24 >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${period}`;
      }
      
      // If it already has AM/PM, return as is
      if (timeString.includes('AM') || timeString.includes('PM')) {
        return timeString;
      }
      
      return timeString;
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  };

  // ✅ IMPROVED: Better date formatting function
  

  const isInDateRange = (date, range) => {
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (range) {
      case 'today':
        const todayEnd = new Date(today);
        todayEnd.setDate(todayEnd.getDate() + 1);
        return bookingDate >= today && bookingDate < todayEnd;
      case 'week':
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        return bookingDate >= today && bookingDate < weekEnd;
      case 'month':
        const monthEnd = new Date(today);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        return bookingDate >= today && bookingDate < monthEnd;
      default:
        return true;
    }
  };

  // Function to load users
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
        sortBy,
        sortOrder
      });

      const response = await api.get(`/admin/users?${params}`);
      
      if (response.data.success) {
        setUsers(response.data.data.users);
        const pagination = response.data.data.pagination;
        setTotalPages(pagination.totalPages);
        setTotalUsers(pagination.totalUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError(error.response?.data?.message || 'Error loading users');
    } finally {
      setLoading(false);
    }
  }, [api, currentPage, searchTerm, roleFilter, statusFilter, sortBy, sortOrder]);

  // NEW function to load bookings
  const loadBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem('booking_token');
      const response = await fetch('https://backend-main-production-78c0.up.railway.app/api/bookings/admin/all?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBookings(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  }, []);

  // Function to load statistics
  const loadStats = useCallback(async () => {
    try {
      const response = await api.get('/admin/users/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }, [api]);

  // MODIFY useEffect to also load bookings
  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      loadStats();
      if (activeView === 'clients') {
        loadBookings();
      }
    }
  }, [isAdmin, loadUsers, loadStats, loadBookings, activeView]);

  // NEW client statistics
  const clientStats = useMemo(() => {
    const stats = {};
    const clientUsers = users.filter(user => user.role === 'client');
    
    clientUsers.forEach(client => {
      const clientBookings = bookings.filter(booking => 
        booking.client?._id === client._id || booking.client === client._id
      );
      
      stats[client._id] = {
        totalBookings: clientBookings.length,
        confirmedBookings: clientBookings.filter(b => b.status === 'confirmed').length,
        completedBookings: clientBookings.filter(b => b.status === 'completed').length,
        pendingBookings: clientBookings.filter(b => b.status === 'pending').length,
        cancelledBookings: clientBookings.filter(b => b.status === 'cancelled').length,
        totalSpent: clientBookings
          .filter(b => ['confirmed', 'completed'].includes(b.status))
          .reduce((sum, b) => sum + (b.pricing?.totalAmount || b.service?.price || 0), 0),
        lastBooking: clientBookings
          .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))[0]
      };
    });
    return stats;
  }, [users, bookings]);

  // NEW filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      const matchesDate = dateFilter === 'all' || isInDateRange(booking.bookingDate, dateFilter);
      const matchesSearch = !searchTerm || 
        booking.service?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${booking.client?.firstName} ${booking.client?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesDate && matchesSearch;
    });
  }, [bookings, statusFilter, dateFilter, searchTerm]);

  // NEW function to click on a client
  const handleClientClick = (client) => {
    setSelectedClient(client);
    setShowClientDetails(true);
  };

  // Function to edit a user
  const handleEditUser = (user) => {
    setSelectedClient(user);
    setIsEditModalOpen(true);
  };

  // Function to delete a user
  const handleDeleteUser = (user) => {
    setSelectedClient(user);
    setIsDeleteModalOpen(true);
  };

  // Function to confirm deletion
  const confirmDelete = async () => {
    try {
      const response = await api.delete(`/admin/users/${selectedClient._id}`);
      if (response.data.success) {
        setUsers(users.filter(user => user._id !== selectedClient._id));
        setIsDeleteModalOpen(false);
        setSelectedClient(null);
        loadStats();
        alert('User deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.message || 'Error deleting user');
    }
  };

  // Function to update a user after editing
  const handleUserUpdated = (updatedUser) => {
    setUsers(users.map(user => 
      user._id === updatedUser._id ? updatedUser : user
    ));
    setIsEditModalOpen(false);
    setSelectedClient(null);
    loadStats();
  };

  // Function to add a new user
  const handleUserCreated = (newUser) => {
    setUsers([newUser, ...users]);
    setIsCreateModalOpen(false);
    loadStats();
  };

  // Function to change sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Function for search with debounce
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Function to change page
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // ✅ IMPROVED: Better short date format function
  const formatDateShort = (dateString) => {
    if (!dateString) return 'Not specified';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Function to get badge color by role
  const getRoleBadgeColor = (role) => {
    return role === 'admin' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-blue-100 text-blue-800';
  };

  // Function to get badge color by status
  const getStatusBadgeColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  // NEW functions for booking statuses
  const getBookingStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBookingStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmed';
      case 'pending': return 'Pending';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  // Mobile-optimized User Card Component
  const UserCard = ({ user }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${getRoleBadgeColor(user.role)}`}>
            <span className="text-sm font-medium">
              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
            </span>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="font-semibold text-gray-900 text-sm">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
            {user.role === 'admin' ? 'Admin' : 'Client'}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(user.isActive)}`}>
            {user.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 mb-3">
        <div>
          <span className="block font-medium text-gray-700">Registration</span>
          {formatDateShort(user.createdAt)}
        </div>
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={() => handleEditUser(user)}
          className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation"
        >
          Edit
        </button>
        <button
          onClick={() => handleDeleteUser(user)}
          className="flex-1 px-3 py-2 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 active:bg-red-800 transition-colors touch-manipulation"
        >
          Delete
        </button>
      </div>
    </div>
  );

  // Mobile-optimized Client Card Component
  const ClientCard = ({ client }) => {
    const stats = clientStats[client._id] || {};
    return (
      <div
        onClick={() => handleClientClick(client)}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 active:bg-gray-50 transition-colors touch-manipulation"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-800">
                {client.firstName?.charAt(0)}{client.lastName?.charAt(0)}
              </span>
            </div>
            <div className="ml-3">
              <h3 className="font-semibold text-gray-900 text-sm">
                {client.firstName} {client.lastName}
              </h3>
              <p className="text-xs text-gray-500 truncate">{client.email}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-gray-900">
              {stats.totalBookings || 0}
            </div>
            <div className="text-xs text-gray-500">bookings</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-green-50 p-2 rounded">
            <span className="font-medium text-green-800">{stats.completedBookings || 0}</span>
            <span className="text-green-600 ml-1">completed</span>
          </div>
          <div className="bg-purple-50 p-2 rounded">
            <span className="font-medium text-purple-800">{stats.totalSpent || 0}€</span>
            <span className="text-purple-600 ml-1">spent</span>
          </div>
        </div>
      </div>
    );
  };

  // Mobile-optimized Booking Card Component
  const BookingCard = ({ booking }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm mb-1">
            {booking.service?.name}
          </h3>
          <p className="text-xs text-gray-600 mb-2">
            {booking.client?.firstName} {booking.client?.lastName}
          </p>
          <div className="flex items-center text-xs text-gray-500 mb-1">
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
            </svg>
            {formatDateShort(booking.bookingDate)}
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
          </div>
        </div>
        <div className="text-right ml-3">
          <div className="text-base font-bold text-gray-900 mb-2">
            {booking.pricing?.totalAmount || booking.service?.price}€
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBookingStatusColor(booking.status)}`}>
            {getBookingStatusText(booking.status)}
          </span>
        </div>
      </div>
    </div>
  );

  // NEW Client details modal - Mobile optimized
  const ClientDetailsModal = ({ client, onClose }) => {
    const clientBookingsList = bookings.filter(booking => 
      booking.client?._id === client._id || booking.client === client._id
    );

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className={`bg-white ${isMobile ? 'min-h-full' : 'rounded-lg shadow-xl max-w-4xl mx-auto mt-8'} ${isMobile ? '' : 'max-h-[90vh] overflow-y-auto mx-4'}`}>
          <div className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  {client.firstName} {client.lastName}
                </h3>
                <p className="text-sm sm:text-base text-gray-600">{client.email}</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 active:text-gray-800 transition-colors p-2 touch-manipulation"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Client statistics - Mobile responsive */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-blue-600">
                  {clientStats[client._id]?.totalBookings || 0}
                </div>
                <div className="text-xs sm:text-sm text-blue-800">Total Bookings</div>
              </div>
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-green-600">
                  {clientStats[client._id]?.completedBookings || 0}
                </div>
                <div className="text-xs sm:text-sm text-green-800">Completed</div>
              </div>
              <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                  {clientStats[client._id]?.pendingBookings || 0}
                </div>
                <div className="text-xs sm:text-sm text-yellow-800">Pending</div>
              </div>
              <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-purple-600">
                  {clientStats[client._id]?.totalSpent || 0} €
                </div>
                <div className="text-xs sm:text-sm text-purple-800">Total Spent</div>
              </div>
            </div>

            {/* Client's booking list - Mobile optimized */}
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                Bookings ({clientBookingsList.length})
              </h4>
              {clientBookingsList.length === 0 ? (
                <p className="text-gray-500 text-center py-6 sm:py-8">No bookings</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {clientBookingsList
                    .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
                    .map(booking => (
                    <div key={booking._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{booking.service?.name}</div>
                        <div className="text-xs text-gray-500">
                          {formatDateShort(booking.bookingDate)} • {formatTime(booking.startTime)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className="font-medium text-sm">
                          {booking.pricing?.totalAmount || booking.service?.price} €
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getBookingStatusColor(booking.status)}`}>
                          {getBookingStatusText(booking.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Mobile pagination
  const renderMobilePagination = () => (
    <div className="flex items-center justify-between px-4 py-3">
      <button
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 touch-manipulation"
      >
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </button>
      
      <span className="text-sm text-gray-700">
        Page {currentPage} of {totalPages}
      </span>
      
      <button
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 touch-manipulation"
      >
        Next
        <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );

  // Render pagination buttons - Mobile optimized
  const renderPagination = () => {
    if (isMobile) {
      return renderMobilePagination();
    }

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            i === currentPage
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * 10, totalUsers)}
              </span>{' '}
              of <span className="font-medium">{totalUsers}</span> results
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 text-gray-400 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            {pages}
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 text-gray-400 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-sm sm:text-base text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with navigation - Mobile optimized */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Manage user accounts and view client data
          </p>
          
          {/* NEW Tab navigation - Mobile responsive */}
          <div className="mt-4 sm:mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 sm:space-x-8">
              <button
                onClick={() => {
                  setActiveView('users');
                  setCurrentPage(1);
                  setSearchTerm('');
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeView === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👥 Users
              </button>
              <button
                onClick={() => {
                  setActiveView('clients');
                  setCurrentPage(1);
                  setSearchTerm('');
                  loadBookings();
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeView === 'clients'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🛍️ Clients
              </button>
            </nav>
          </div>
        </div>

        {/* Statistics - Mobile responsive grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                </div>
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Total</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Active</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Inactive</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Admins</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.admins}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-6 rounded-lg shadow col-span-2 sm:col-span-1">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Clients</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.clients}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and search - Mobile optimized */}
        <div className="bg-white rounded-lg shadow mb-4 sm:mb-6">
          <div className="p-4 sm:p-6">
            {/* Search bar always visible */}
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder={activeView === 'users' ? 'Name, email...' : 'Client, service...'}
                  className="block w-full pl-10 pr-12 py-3 sm:py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-base"
                />
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center sm:hidden"
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Collapsible filters on mobile */}
            {(showFilters || !isMobile) && (
              <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-4 sm:gap-4">
                {activeView === 'users' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <select
                        value={roleFilter}
                        onChange={(e) => {
                          setRoleFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="block w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
                      >
                        <option value="all">All roles</option>
                        <option value="client">Client</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="block w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
                      >
                        <option value="all">All statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Booking Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="block w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
                      >
                        <option value="all">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                      <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="block w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
                      >
                        <option value="all">All dates</option>
                        <option value="today">Today</option>
                        <option value="week">This week</option>
                        <option value="month">This month</option>
                      </select>
                    </div>
                  </>
                )}
                
                {/* View toggle for desktop and user view */}
                {!isMobile && activeView === 'users' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">View</label>
                    <div className="flex rounded-md shadow-sm">
                      <button
                        onClick={() => setViewMode('card')}
                        className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                          viewMode === 'card' 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Cards
                      </button>
                      <button
                        onClick={() => setViewMode('table')}
                        className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-b border-r ${
                          viewMode === 'table' 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Table
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Create user button (only for user view) - Mobile optimized */}
            {activeView === 'users' && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 sm:py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-manipulation"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New User
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main content according to active view */}
        {activeView === 'users' ? (
          /* Users view - Mobile optimized */
          <div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600 text-sm sm:text-base">Loading...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">
                  <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-900">Loading error</h3>
                <p className="text-sm text-gray-500 mt-1">{error}</p>
                <button
                  onClick={loadUsers}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 active:bg-blue-300 touch-manipulation"
                >
                  Retry
                </button>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                    ? 'No users match your search criteria.'
                    : 'Start by creating a new user.'}
                </p>
              </div>
            ) : (
              <>
                {isMobile || viewMode === 'card' ? (
                  // Card view - Mobile optimized
                  <div className="space-y-3">
                    {users.map((user) => (
                      <UserCard key={user._id} user={user} />
                    ))}
                  </div>
                ) : (
                  // Table view (desktop only)
                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    {/* Table header */}
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                      <div className="grid grid-cols-12 gap-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="col-span-3">
                          <button
                            onClick={() => handleSort('firstName')}
                            className="flex items-center hover:text-gray-700"
                          >
                            User
                            {sortBy === 'firstName' && (
                              <svg className={`w-4 h-4 ml-1 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        </div>
                        <div className="col-span-2">Email</div>
                        <div className="col-span-1">Role</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-2">Registration</div>
                        <div className="col-span-1">Bookings</div>
                        <div className="col-span-2">Actions</div>
                      </div>
                    </div>

                    {/* Table body */}
                    <ul className="divide-y divide-gray-200">
                      {users.map((user) => (
                        <li key={user._id} className="px-6 py-4 hover:bg-gray-50">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            {/* User */}
                            <div className="col-span-3">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getRoleBadgeColor(user.role)}`}>
                                    <span className="text-sm font-medium">
                                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.firstName} {user.lastName}
                                  </div>
                                  {user.phone && (
                                    <div className="text-sm text-gray-500">
                                      {user.phone}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Email */}
                            <div className="col-span-2">
                              <div className="text-sm text-gray-900">{user.email}</div>
                              <div className="text-sm text-gray-500">
                                {user.isEmailVerified ? (
                                  <span className="inline-flex items-center text-green-600">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Verified
                                  </span>
                                ) : (
                                  <span className="text-orange-600">Not verified</span>
                                )}
                              </div>
                            </div>

                            {/* Role */}
                            <div className="col-span-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                {user.role === 'admin' ? 'Admin' : 'Client'}
                              </span>
                            </div>

                            {/* Status */}
                            <div className="col-span-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(user.isActive)}`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>

                            {/* Registration date */}
                            <div className="col-span-2">
                              <div className="text-sm text-gray-900">
                                {formatDateShort(user.createdAt)}
                              </div>
                              {user.lastLogin && (
                                <div className="text-sm text-gray-500">
                                  Last login: {formatDateShort(user.lastLogin)}
                                </div>
                              )}
                            </div>

                            {/* Number of bookings */}
                            <div className="col-span-1">
                              <div className="text-sm font-medium text-gray-900">
                                {user.stats?.bookingCount || 0}
                              </div>
                              {user.stats?.lastBooking && (
                                <div className="text-xs text-gray-500">
                                  Last: {formatDateShort(user.stats.lastBooking.date)}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="col-span-2">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Pagination */}
                {totalPages > 1 && renderPagination()}
              </>
            )}
          </div>
        ) : (
          /* NEW Client and bookings view - Mobile optimized */
          <div className="space-y-4 sm:space-y-6">
            {/* Client view */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Clients ({users.filter(u => u.role === 'client').length})
                  </h3>
                  <span className="text-xs sm:text-sm text-gray-500">
                    Tap to see details
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-0">
                {users.filter(user => user.role === 'client').map(client => (
                  <div key={client._id} className="sm:border-b sm:border-gray-200 last:border-b-0">
                    <div className="sm:p-6">
                      <ClientCard client={client} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bookings view */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  All Bookings ({filteredBookings.length})
                </h3>
              </div>

              <div className="p-4 sm:p-0">
                {filteredBookings.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">No bookings found</p>
                  </div>
                ) : (
                  filteredBookings.slice(0, 10).map(booking => (
                    <div key={booking._id} className="sm:border-b sm:border-gray-200 last:border-b-0">
                      <div className="sm:p-6">
                        <BookingCard booking={booking} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {isEditModalOpen && selectedClient && (
          <EditUserModal
            user={selectedClient}
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedClient(null);
            }}
            onUserUpdated={handleUserUpdated}
          />
        )}

        {isCreateModalOpen && (
          <CreateUserModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onUserCreated={handleUserCreated}
          />
        )}

        {isDeleteModalOpen && selectedClient && (
          <DeleteConfirmModal
            user={selectedClient}
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedClient(null);
            }}
            onConfirm={confirmDelete}
          />
        )}

        {/* NEW Client details modal */}
        {showClientDetails && selectedClient && (
          <ClientDetailsModal
            client={selectedClient}
            onClose={() => {
              setShowClientDetails(false);
              setSelectedClient(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default UserManagement;