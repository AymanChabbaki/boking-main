import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useServices } from '../contexts/ServicesContext';
import CreateServiceForm from '../components/Services/CreateServiceForm';

// Simple component for admin actions (temporary)
const AdminServiceActions = ({ service, onUpdate }) => {
  const { updateService, deleteService } = useServices();
  const [loading, setLoading] = useState(false);

  const handleEdit = useCallback(async () => {
    const newName = prompt('Nouveau nom du service:', service.name);
    if (newName && newName !== service.name) {
      setLoading(true);
      try {
        const result = await updateService(service._id, { name: newName });
        if (result.success && onUpdate) {
          onUpdate('edit', result.data);
        }
      } catch (error) {
        console.error('Erreur lors de la modification:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [service._id, service.name, updateService, onUpdate]);

  const handleDelete = useCallback(async () => {
    if (window.confirm(`Supprimer le service "${service.name}" ?`)) {
      setLoading(true);
      try {
        const result = await deleteService(service._id);
        if (result.success && onUpdate) {
          onUpdate('delete', service);
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [service._id, service.name, deleteService, onUpdate, service]);

  return (
    <div className="flex space-x-2">
      <button
        onClick={handleEdit}
        disabled={loading}
        className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {loading ? 'Modification...' : 'Modifier'}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {loading ? 'Suppression...' : 'Supprimer'}
      </button>
    </div>
  );
};

// Client Dashboard component - FIXED
const ClientDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalSpent: 0
  });

  // ✅ CORRECTION CRITIQUE - URL DYNAMIQUE
  const API_URL = process.env.REACT_APP_API_URL;

  // ✅ DEBUG LOGS
  useEffect(() => {
    console.log('🔧 Dashboard Debug:');
    console.log('  - REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    console.log('  - API_URL calculé:', API_URL);
    console.log('  - Current URL:', window.location.href);
  }, [API_URL]);

  // ✅ NEW STATES for filters
  const [filterStatus, setFilterStatus] = useState('all');

  // ✅ NEW STATES for action management
  const [actionLoading, setActionLoading] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({
    bookingDate: '',
    startTime: '',
    endTime: '',
    notes: ''
  });

  // ✅ FIXED FUNCTION: Load real bookings from API
  const fetchBookings = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('booking_token');
      // ✅ CORRECTION CRITIQUE - Utiliser API_URL au lieu de localhost
      const response = await fetch(`${API_URL}/bookings/my-bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des réservations');
      }

      const data = await response.json();
      
      if (data.success) {
        const bookingsData = data.data || [];
        setBookings(bookingsData);

        // ✅ FIXED CALCULATIONS for statistics
        const newStats = {
          totalBookings: bookingsData.length,
          confirmedBookings: bookingsData.filter(b => b.status === 'confirmed').length,
          pendingBookings: bookingsData.filter(b => b.status === 'pending').length,
          completedBookings: bookingsData.filter(b => b.status === 'completed').length,
          cancelledBookings: bookingsData.filter(b => b.status === 'cancelled').length,
          // ✅ FIXED CALCULATION for total spent - ONLY confirmed and completed bookings
          totalSpent: bookingsData
            .filter(b => ['confirmed', 'completed'].includes(b.status)) // Only paid bookings
            .reduce((sum, b) => {
              // Try multiple fields for price
              const amount = b.pricing?.totalAmount || 
                           b.totalAmount || 
                           b.price || 
                           (b.service?.price * (b.participants?.count || 1)) || 
                           0;
              return sum + amount;
            }, 0)
        };
        
        setStats(newStats);
        console.log('📊 Stats client calculées:', newStats);
      }
    } catch (err) {
      console.error('❌ Erreur:', err);
      setError('Erreur lors du chargement des réservations');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [user, API_URL]); // ✅ AJOUTER API_URL dans les dépendances

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // ✅ NEW FUNCTION: Cancel a booking
  const handleCancelBooking = useCallback(async (bookingId, bookingName) => {
    const reason = prompt(`Why do you want to cancel the booking "${bookingName}"?\n(Optional)`);

    if (reason === null) return; // User canceled

    if (window.confirm(`Are you sure you want to cancel the booking "${bookingName}"?`)) {
      try {
        setActionLoading(bookingId);
        
        const token = localStorage.getItem('booking_token');
        // ✅ CORRECTION CRITIQUE - Utiliser API_URL
        const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            reason: reason || 'Cancellation requested by client'
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error while cancelling');
        }

        const data = await response.json();
        
        if (data.success) {
          // Update local list
          setBookings(prev => prev.map(booking =>
            booking._id === bookingId
              ? { ...booking, status: 'cancelled', cancellation: { reason: reason || 'Cancelled by client', cancelledAt: new Date() } }
              : booking
          ));

          alert('Booking cancelled successfully!');

          // Recalculate stats
          fetchBookings();
        }
      } catch (error) {
        console.error('Error cancelling:', error);
        alert(`Error: ${error.message}`);
      } finally {
        setActionLoading(null);
      }
    }
  }, [fetchBookings, API_URL]); // ✅ AJOUTER API_URL

  // ✅ NEW FUNCTION: Permanently delete a booking
  const handleDeleteBooking = useCallback(async (bookingId, bookingName) => {
    if (window.confirm(`⚠️ WARNING ⚠️\n\nAre you sure you want to PERMANENTLY DELETE the booking "${bookingName}"?\n\nThis action is IRREVERSIBLE and will delete all booking data.`)) {
      try {
        setActionLoading(bookingId);
        
        const token = localStorage.getItem('booking_token');
        // ✅ CORRECTION CRITIQUE - Utiliser API_URL
        const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erreur lors de la suppression');
        }

        const data = await response.json();
        
        if (data.success) {
          // Supprimer de la liste locale
          setBookings(prev => prev.filter(booking => booking._id !== bookingId));
          
          alert('Réservation supprimée définitivement !');
          
          // Recalculer les stats
          fetchBookings();
        }
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert(`Erreur: ${error.message}`);
      } finally {
        setActionLoading(null);
      }
    }
  }, [fetchBookings, API_URL]); // ✅ AJOUTER API_URL

  // ✅ NEW FEATURE: Check availability
  const checkAvailability = useCallback(async (serviceId, date, startTime, endTime, excludeBookingId = null) => {
    try {
      const token = localStorage.getItem('booking_token');
      // ✅ CORRECTION CRITIQUE - Utiliser API_URL
      const response = await fetch(`${API_URL}/bookings/check-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId,
          bookingDate: date,
          startTime,
          endTime,
          excludeBookingId // To exclude the current booking being modified
        })
      });

      const data = await response.json();
      return data.success && data.data.available;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  }, [API_URL]); // ✅ AJOUTER API_URL

  // ✅ NEW FUNCTION: Open reschedule modal
  const handleRescheduleBooking = useCallback((booking) => {
    setSelectedBooking(booking);
    setRescheduleData({
      bookingDate: booking.bookingDate ? new Date(booking.bookingDate).toISOString().split('T')[0] : '',
      startTime: booking.startTime || '',
      endTime: booking.endTime || '',
      notes: booking.clientNotes || ''
    });
    setShowRescheduleModal(true);
  }, []);

  // ✅ NEW FUNCTION: Confirm reschedule
  const handleConfirmReschedule = useCallback(async () => {
    if (!selectedBooking) return;

    // Basic validation
    if (!rescheduleData.bookingDate || !rescheduleData.startTime || !rescheduleData.endTime) {
      alert('Please fill in all required fields');
      return;
    }

    // Check that the new date is not in the past
    const selectedDate = new Date(rescheduleData.bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      alert('You cannot schedule a booking in the past');
      return;
    }

    try {
      setActionLoading(selectedBooking._id);

      // Check availability
      const isAvailable = await checkAvailability(
        selectedBooking.service._id,
        rescheduleData.bookingDate,
        rescheduleData.startTime,
        rescheduleData.endTime,
        selectedBooking._id
      );

      if (!isAvailable) {
        alert('This time slot is not available. Please choose another time.');
        return;
      }

      const token = localStorage.getItem('booking_token');
      // ✅ CORRECTION CRITIQUE - Utiliser API_URL
      const response = await fetch(`${API_URL}/bookings/${selectedBooking._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingDate: rescheduleData.bookingDate,
          startTime: rescheduleData.startTime,
          endTime: rescheduleData.endTime,
          clientNotes: rescheduleData.notes,
          status: 'pending' // Return to pending after modification
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error while rescheduling');
      }

      const data = await response.json();
      
      if (data.success) {
        // Update local list
        setBookings(prev => prev.map(booking =>
          booking._id === selectedBooking._id
            ? {
                ...booking,
                bookingDate: rescheduleData.bookingDate,
                startTime: rescheduleData.startTime,
                endTime: rescheduleData.endTime,
                clientNotes: rescheduleData.notes,
                status: 'pending'
              }
            : booking
        ));
        
        alert('Reservation successfully rescheduled! It is now awaiting confirmation.');
        setShowRescheduleModal(false);
        setSelectedBooking(null);

        // Recalculate stats
        fetchBookings();
      }
    } catch (error) {
      console.error('Error rescheduling:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  }, [selectedBooking, rescheduleData, checkAvailability, fetchBookings, API_URL]); // ✅ AJOUTER API_URL

  // ✅ NEW FUNCTION: Close modal
  const handleCloseRescheduleModal = useCallback(() => {
    setShowRescheduleModal(false);
    setSelectedBooking(null);
    setRescheduleData({
      bookingDate: '',
      startTime: '',
      endTime: '',
      notes: ''
    });
  }, []);

  // ✅ NEW FUNCTION: Check if an action is possible
  const canPerformAction = useCallback((booking) => {
    return ['pending', 'confirmed'].includes(booking.status);
  }, []);

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getStatusText = useCallback((status) => {
    switch (status) {
      case 'confirmed': return '✅ Confirmed';
      case 'pending': return '⏳ pending';
      case 'completed': return '✓ Completed';
      case 'cancelled': return '✗ Cancelled';
      default: return status;
    }
  }, []);

  // ✅ FIXED FUNCTION to calculate the price of a reservation
  const getBookingPrice = useCallback((booking) => {
    return booking.pricing?.totalAmount || 
           booking.totalAmount || 
           booking.price || 
           (booking.service?.price * (booking.participants?.count || 1)) || 
           0;
  }, []);

  // ✅ NEW: Filter bookings
  const filteredBookings = React.useMemo(() => {
    if (filterStatus === 'all') return bookings;
    return bookings.filter(booking => booking.status === filterStatus);
  }, [bookings, filterStatus]);

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête Client */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {user.firstName} {user.lastName}!
            </h1>
            <p className="text-gray-600">Manage your bookings and profile</p>
          </div>
        </div>
      </div>

      {/* ✅ FIXED STATISTICS with 5 cards now */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Confirmed</p>
              <p className="text-xl font-bold text-gray-900">{stats.confirmedBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Pending</p>
              <p className="text-xl font-bold text-gray-900">{stats.pendingBookings}</p>
            </div>
          </div>
        </div>

        {/* ✅ NEW CARD: Rejected bookings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Rejected</p>
              <p className="text-xl font-bold text-gray-900">{stats.cancelledBookings}</p>
            </div>
          </div>
        </div>

        {/* ✅ MODIFIÉ : MAD → € */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Spent</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalSpent} €</p>
            </div>
          </div>
        </div>
      </div>

      {/* List of reservations */}      
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Reservations</h2>
          {/* ✅ NEW FILTERS */}
          <div className="flex space-x-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All reservations</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {filterStatus === 'all' ? 'No reservations' : `No reservations ${
                filterStatus === 'pending' ? 'pending' :
                filterStatus === 'confirmed' ? 'confirmed' :
                filterStatus === 'completed' ? 'completed' :
                'cancelled'
              }`}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {filterStatus === 'all' ? 'Start by booking a service.' : 'Change the filter to see other reservations.'}
            </p>
            {filterStatus === 'all' && (
              <Link
                to="/services"
                className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                View services
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredBookings.map((booking) => (
              <div key={booking._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {booking.service?.name || 'Service'}
                      </h3>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-500">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">Date:</span> {new Date(booking.bookingDate).toLocaleDateString('fr-FR')} à {booking.startTime}
                      </div>
                      
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">Place:</span> {booking.location?.type === 'studio' ? 'Studio' : booking.location?.address?.city || 'À définir'}
                      </div>
                      
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">Photographe:</span> {booking.photographer?.name || 'Non assigné'}
                      </div>
                      
                      {booking.participants?.count > 1 && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-medium">Participants:</span> {booking.participants.count}
                        </div>
                      )}
                    </div>

                    {/* ✅ NOUVEAU : Afficher la raison du refus si refusée */}
                    {booking.status === 'cancelled' && booking.cancellation?.reason && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex">
                          <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-red-800">Raison du refus:</p>
                            <p className="text-sm text-red-700">{booking.cancellation.reason}</p>
                            {booking.cancellation.cancelledAt && (
                              <p className="text-xs text-red-600 mt-1">
                               Refused on {new Date(booking.cancellation.cancelledAt).toLocaleDateString('en-US')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                   {/* Customer Notes */}
                    {booking.clientNotes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">Your notes:</span> {booking.clientNotes}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 ml-6">
                    <div className="text-right">
                      <span className="text-2xl font-bold text-gray-900">
                       
                        {getBookingPrice(booking)} €
                      </span>
                      {booking.service?.price && booking.participants?.count > 1 && (
                        <p className="text-xs text-gray-500">
                        
                          ({booking.service.price} € × {booking.participants.count})
                        </p>
                      )}
                      {booking.service?.duration && (
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.floor(booking.service.duration / 60)}h{booking.service.duration % 60 > 0 ? `${booking.service.duration % 60}min` : ''}
                        </p>
                      )}
                    </div>

                    {/* ✅ NEW ACTION BUTTONS */}
                    {canPerformAction(booking) && (
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleRescheduleBooking(booking)}
                          disabled={actionLoading === booking._id}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === booking._id ? 'Processing...' : 'Reschedule'}
                        </button>
                        <button
                          onClick={() => handleCancelBooking(booking._id, booking.service?.name || 'cette réservation')}
                          disabled={actionLoading === booking._id}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === booking._id ? 'Processing...' : 'Cancel'}
                        </button>
                        <button
                          onClick={() => handleDeleteBooking(booking._id, booking.service?.name || 'cette réservation')}
                          disabled={actionLoading === booking._id}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === booking._id ? 'Processing...' : 'Delete'}
                        </button>
                      </div>
                    )}

                    {/* ✅ NEW: Delete button for cancelled/completed bookings */}
                    {!canPerformAction(booking) && (
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleDeleteBooking(booking._id, booking.service?.name || 'cette réservation')}
                          disabled={actionLoading === booking._id}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === booking._id ? 'Processing...' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ NEW SECTION: Summary of Cancelled Reservations */}
      {stats.cancelledBookings > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-red-800">
                {stats.cancelledBookings} reservation{stats.cancelledBookings > 1 ? 's' : ''} refusée{stats.cancelledBookings > 1 ? 's' : ''}
              </h3>
              <p className="text-red-700 text-sm">
                Vous pouvez consulter les raisons du refus en filtrant par "Refusées" ci-dessus.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NEW MODAL: Reschedule Booking */}
      {showRescheduleModal && selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Reschedule Booking
                </h3>
                <button
                  onClick={handleCloseRescheduleModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Current Reservation:</h4>
                <p className="text-sm text-blue-800">
                  <strong>{selectedBooking.service?.name}</strong><br/>
                  On {new Date(selectedBooking.bookingDate).toLocaleDateString('en-US')} from {selectedBooking.startTime} to {selectedBooking.endTime}
                </p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleConfirmReschedule(); }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Date *
                    </label>
                    <input
                      type="date"
                      value={rescheduleData.bookingDate}
                      onChange={(e) => setRescheduleData(prev => ({ ...prev, bookingDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        value={rescheduleData.startTime}
                        onChange={(e) => setRescheduleData(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time *
                      </label>
                      <input
                        type="time"
                        value={rescheduleData.endTime}
                        onChange={(e) => setRescheduleData(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Notes (optional)
                    </label>
                    <textarea
                      value={rescheduleData.notes}
                      onChange={(e) => setRescheduleData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      placeholder="Add notes for your new reservation..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm text-yellow-800">
                         Important: After modification, your reservation will be changed to "Pending" and will need to be reconfirmed by the administrator.

</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseRescheduleModal}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === selectedBooking._id}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === selectedBooking._id ? 'Processing...' : 'Confirm Reschedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ ADMIN REDIRECTION to /admin/dashboard
const AdminRedirect = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/admin/dashboard', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  );
};

// Dashboard Main Component - MODIFIED for admin redirection
const Dashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateSuccess = useCallback(() => {
    setShowCreateForm(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You must be logged in to access the dashboard.</p>
        </div>
      </div>
    );
  }

// ✅ AUTOMATIC REDIRECTION: If admin, redirect to the admin dashboard
  if (isAdmin) {
    return <AdminRedirect />;
  }

  // ✅ Otherwise, display the client dashboard
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <ClientDashboard />

        {/* Global Creation Form */}
        {showCreateForm && (
          <CreateServiceForm
            onClose={() => setShowCreateForm(false)}
            onSuccess={handleCreateSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
