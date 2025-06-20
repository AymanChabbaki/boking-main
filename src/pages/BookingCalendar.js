import React, { useState, useEffect, useCallback, useMemo } from 'react';

const BookingCalendar = ({ bookings = [], loading = false, onDateSelect, onBookingClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Date utilities
  const formatDate = (date, format = 'full') => {
    const options = {
      year: 'numeric',
      month: format === 'full' ? 'long' : 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  const getMonthYear = (date) => {
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0

    const days = [];
    
    // Days from previous month
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Complete with days from next month to have 42 cells (6 weeks)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDay = (date1, date2) => {
    return date1.toDateString() === date2.toDateString();
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  // Generate month days
  const monthDays = useMemo(() => {
    return getDaysInMonth(currentDate);
  }, [currentDate]);

  // Organize bookings by date
  const bookingsByDate = useMemo(() => {
    const grouped = {};
    bookings.forEach(booking => {
      const date = new Date(booking.bookingDate);
      const dateKey = date.toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(booking);
    });
    return grouped;
  }, [bookings]);

  // Get bookings for a given date
  const getBookingsForDate = useCallback((date) => {
    const dateKey = date.toDateString();
    return bookingsByDate[dateKey] || [];
  }, [bookingsByDate]);

  // Change month
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Select a date
  const handleDateClick = (date) => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  // Color according to status
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmed';
      case 'pending': return 'Pending';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  // Status legend
  const StatusLegend = () => (
    <div className="flex flex-wrap gap-4 text-xs">
      <div className="flex items-center">
        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
        <span>Pending</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
        <span>Confirmed</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
        <span>Completed</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
        <span>Cancelled</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Calendar header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Booking Calendar
            </h2>
            <p className="text-sm text-gray-600">
              {getMonthYear(currentDate)}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="order-2 sm:order-1">
              <StatusLegend />
            </div>
            <div className="flex items-center space-x-2 order-1 sm:order-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Previous month"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                Today
              </button>
              
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Next month"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar body */}
      <div className="p-4 sm:p-6">
        {/* Days of the week */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((dayObj, index) => {
            const { date, isCurrentMonth } = dayObj;
            const dayBookings = getBookingsForDate(date);
            const isSelectedDate = selectedDate && isSameDay(date, selectedDate);
            const isPast = isPastDate(date);

            return (
              <div
                key={index}
                onClick={() => handleDateClick(date)}
                className={`
                  min-h-16 sm:min-h-20 p-1 border border-gray-200 rounded-lg cursor-pointer transition-all hover:bg-gray-50
                  ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                  ${isSelectedDate ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                  ${isToday(date) ? 'bg-blue-100 border-blue-300' : ''}
                  ${isPast ? 'opacity-60' : ''}
                `}
              >
                {/* Day number */}
                <div className={`
                  text-xs sm:text-sm font-medium mb-1
                  ${isToday(date) ? 'text-blue-700' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                `}>
                  {date.getDate()}
                </div>

                {/* Day bookings */}
                <div className="space-y-1">
                  {dayBookings.slice(0, window.innerWidth > 640 ? 3 : 2).map((booking, index) => (
                    <div
                      key={booking._id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onBookingClick) {
                          onBookingClick(booking);
                        }
                      }}
                      className={`
                        px-1 py-0.5 text-xs rounded text-white truncate cursor-pointer hover:opacity-80
                        ${getStatusColor(booking.status)}
                      `}
                      title={`${booking.service?.name} - ${booking.startTime} - ${booking.client?.firstName} ${booking.client?.lastName}`}
                    >
                      <span className="hidden sm:inline">{booking.startTime} {booking.service?.name}</span>
                      <span className="sm:hidden">{booking.startTime}</span>
                    </div>
                  ))}
                  
                  {dayBookings.length > (window.innerWidth > 640 ? 3 : 2) && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayBookings.length - (window.innerWidth > 640 ? 3 : 2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected date details */}
      {selectedDate && (
        <div className="border-t border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Bookings for {formatDate(selectedDate)}
          </h3>
          
          {getBookingsForDate(selectedDate).length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No bookings for this date
            </p>
          ) : (
            <div className="space-y-3">
              {getBookingsForDate(selectedDate).map(booking => (
                <div
                  key={booking._id}
                  onClick={() => onBookingClick && onBookingClick(booking)}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors gap-2"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(booking.status)}`}></div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {booking.service?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.client?.firstName} {booking.client?.lastName} • {booking.startTime} - {booking.endTime}
                      </div>
                    </div>
                  </div>
                  <div className="flex sm:flex-col sm:text-right items-center sm:items-end gap-2">
                    <div className="font-medium text-gray-900">
                      {booking.pricing?.totalAmount || booking.service?.price} €
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full text-white ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;