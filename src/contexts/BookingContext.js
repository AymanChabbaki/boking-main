
// ===== BookingContext.js =====
import React, { createContext, useState, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';

const BookingContext = createContext();

export const useBookings = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookings must be used within a BookingProvider');
  }
  return context;
};

export const BookingProvider = ({ children }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL;

  // Fetch user bookings
  const fetchUserBookings = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('booking_token');
      const response = await fetch(`${API_URL}/bookings/my-bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error loading bookings');
      }

      const data = await response.json();
      if (data.success) {
        setBookings(data.data);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, API_URL]);

  // Create new booking
  const createBooking = async (bookingData) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('booking_token');
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error creating booking');
      }

      // Add new booking to list
      setBookings(prev => [data.data, ...prev]);

      return { success: true, data: data.data };
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Cancel booking
  const cancelBooking = async (bookingId, reason) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('booking_token');
      const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Cancellation error');
      }

      // Update booking in list
      setBookings(prev => 
        prev.map(booking => 
          booking._id === bookingId ? data.data : booking
        )
      );

      return { success: true, data: data.data };
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Update booking
  const updateBooking = async (bookingId, updateData) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('booking_token');
      const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Update error');
      }

      // Update booking in list
      setBookings(prev => 
        prev.map(booking => 
          booking._id === bookingId ? data.data : booking
        )
      );

      return { success: true, data: data.data };
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Get available time slots
  const getAvailableSlots = async (date, serviceId) => {
    try {
      const token = localStorage.getItem('booking_token');
      const response = await fetch(
        `${API_URL}/bookings/available-slots?date=${date}&serviceId=${serviceId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error loading time slots');
      }

      return { success: true, data: data.data };
    } catch (err) {
      console.error('Error:', err);
      return { success: false, error: err.message };
    }
  };

  const value = {
    bookings,
    loading,
    error,
    fetchUserBookings,
    createBooking,
    cancelBooking,
    updateBooking,
    getAvailableSlots
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};
