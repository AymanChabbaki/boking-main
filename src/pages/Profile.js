import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user, updateProfile, changePassword, loading, error, clearError } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [userStats, setUserStats] = useState({
    totalBookings: 0,
    completedBookings: 0,
    totalSpent: 0,
    memberSince: user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear(),
    pendingBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const fetchUserStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      
      const token = localStorage.getItem('booking_token');
      if (!token) {
        throw new Error('Token not found');
      }

      const response = await fetch('https://backend-main-production-78c0.up.railway.app/api/bookings/my-bookings?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error('Error fetching bookings');
      }

      const data = await response.json();
      
      if (data.success) {
        const bookings = data.data || [];
        
        const stats = {
          totalBookings: bookings.length,
          completedBookings: bookings.filter(b => b.status === 'completed').length,
          pendingBookings: bookings.filter(b => b.status === 'pending').length,
          confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
          cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
          totalSpent: bookings
            .filter(b => b.status === 'completed' || b.status === 'confirmed')
            .reduce((total, booking) => {
              const amount = booking.pricing?.totalAmount || booking.service?.price || 0;
              return total + amount;
            }, 0),
          memberSince: user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear()
        };

        setUserStats(stats);
      } else {
        throw new Error(data.message || 'Error fetching data');
      }
    } catch (error) {
      console.error('❌ Error fetching user stats:', error);
      setStatsError(error.message);
      
      setUserStats({
        totalBookings: 0,
        completedBookings: 0,
        totalSpent: 0,
        memberSince: user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear(),
        pendingBookings: 0,
        confirmedBookings: 0,
        cancelledBookings: 0
      });
    } finally {
      setStatsLoading(false);
    }
  }, [user?.createdAt]);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user, fetchUserStats]);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    clearError();
  }, [activeTab, clearError]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLocalLoading(true);
    setMessage(null);
    clearError();

    try {
      const result = await updateProfile(profileData);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        
        if (result.data) {
          setProfileData({
            firstName: result.data.firstName || '',
            lastName: result.data.lastName || '',
            email: result.data.email || '',
            phone: result.data.phone || ''
          });
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Error updating profile' });
      }
    } catch (error) {
      console.error('❌ Profile.js - Error updating profile:', error);
      setMessage({ type: 'error', text: error.message || 'Error updating profile' });
    } finally {
      setLocalLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setLocalLoading(true);
    setMessage(null);
    clearError();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setLocalLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must contain at least 6 characters' });
      setLocalLoading(false);
      return;
    }

    if (!passwordData.currentPassword) {
      setMessage({ type: 'error', text: 'Please enter your current password' });
      setLocalLoading(false);
      return;
    }

    try {
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Password changed successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Error changing password' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'Error changing password' });
    } finally {
      setLocalLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setProfileData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || ''
    });
    setIsEditing(false);
    setMessage(null);
    clearError();
  };

  const refreshStats = () => {
    fetchUserStats();
  };

  const isLoading = loading || localLoading;

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-2xl sm:text-3xl font-bold text-white">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </span>
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base break-all">{user?.email}</p>
              <div className="flex flex-col sm:flex-row items-center sm:items-start mt-2 space-y-2 sm:space-y-0 sm:space-x-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  user?.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {user?.role === 'admin' ? '👑 Administrator' : '📸 Client'}
                </span>
                <span className="text-sm text-gray-500">
                  Member since {userStats.memberSince}
                </span>
              </div>
            </div>

            <div className="w-full sm:w-auto">
              {statsLoading ? (
                <div className="flex items-center justify-center sm:flex-col sm:items-end">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 sm:ml-0 sm:mt-2 text-sm text-gray-500">Loading...</span>
                </div>
              ) : statsError ? (
                <div className="text-center sm:text-right">
                  <div className="text-red-500 text-sm mb-1">Error</div>
                  <button 
                    onClick={refreshStats}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 sm:flex sm:space-x-6 text-center sm:text-right">
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{userStats.totalBookings}</div>
                    <div className="text-xs sm:text-sm text-gray-500">Bookings</div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{userStats.completedBookings}</div>
                    <div className="text-xs sm:text-sm text-gray-500">Completed</div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{userStats.totalSpent}€</div>
                    <div className="text-xs sm:text-sm text-gray-500">Spent</div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={refreshStats}
              disabled={statsLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 p-2"
              title="Refresh statistics"
            >
              <svg className={`w-5 h-5 ${statsLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          <div className="sm:hidden mt-4 grid grid-cols-2 gap-4">
            {statsLoading ? (
              <div className="col-span-2 text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading statistics...</p>
              </div>
            ) : statsError ? (
              <div className="col-span-2 text-center py-4">
                <p className="text-red-500 text-sm mb-2">Loading error</p>
                <button 
                  onClick={refreshStats}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{userStats.totalBookings}</div>
                  <div className="text-xs text-gray-500">Total bookings</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{userStats.completedBookings}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{userStats.pendingBookings}</div>
                  <div className="text-xs text-gray-500">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{userStats.totalSpent}€</div>
                  <div className="text-xs text-gray-500">Total spent</div>
                </div>
              </>
            )}
          </div>
        </div>

        {(message || error) && (
          <div className={`mb-4 sm:mb-6 p-4 rounded-lg ${
            (message?.type === 'success') 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {(message?.type === 'success') ? (
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-sm sm:text-base">{message?.text || error}</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium text-center ${
                  activeTab === 'profile'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Personal Information
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium text-center ${
                  activeTab === 'security'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Security
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium text-center ${
                  activeTab === 'preferences'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Preferences
              </button>
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'profile' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleProfileSave} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={profileData.firstName}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={profileData.lastName}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={profileData.email}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          disabled={isLoading}
                        />
                        <p className="mt-1 text-xs text-blue-600">
                          ✅ Email modification is now supported
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="06 12 34 56 78"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 sm:justify-end">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm sm:text-base"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
                      >
                        {isLoading && (
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {isLoading ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">First Name</label>
                        <p className="mt-1 text-base sm:text-lg text-gray-900">{user?.firstName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Email</label>
                        <p className="mt-1 text-base sm:text-lg text-gray-900 break-all">{user?.email}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Last Name</label>
                        <p className="mt-1 text-base sm:text-lg text-gray-900">{user?.lastName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Phone</label>
                        <p className="mt-1 text-base sm:text-lg text-gray-900">{user?.phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h3>
                
                <form onSubmit={handlePasswordSave} className="space-y-6 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={isLoading}
                      minLength="6"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={isLoading}
                      minLength="6"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
                    >
                      {isLoading && (
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {isLoading ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Security Tips</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Use at least 6 characters (8 recommended)</li>
                    <li>• Mix uppercase, lowercase and numbers</li>
                    <li>• Avoid simple passwords</li>
                    <li>• Never share your password</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Preferences</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-4">Notifications</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-3 text-sm text-gray-700">Receive confirmation emails</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-3 text-sm text-gray-700">Receive booking reminders</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-3 text-sm text-gray-700">Receive promotional offers</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-4">Language</h4>
                    <select className="w-full sm:w-48 px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>

                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-4">Theme</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="radio" name="theme" value="light" defaultChecked className="border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-3 text-sm text-gray-700">Light</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="theme" value="dark" className="border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-3 text-sm text-gray-700">Dark</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="theme" value="auto" className="border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-3 text-sm text-gray-700">Automatic</span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base">
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;