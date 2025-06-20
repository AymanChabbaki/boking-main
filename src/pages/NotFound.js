import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();

  // ✅ HANDLE GO BACK
  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  // ✅ SUGGEST RELEVANT LINKS BASED ON USER STATUS
  const getSuggestedLinks = () => {
    const links = [
      { to: '/', label: 'Home', icon: '🏠', description: 'Go back to homepage' }
    ];

    if (isAuthenticated) {
      links.push(
        { to: '/dashboard', label: 'Dashboard', icon: '📊', description: 'View your dashboard' },
        { to: '/services', label: 'Services', icon: '📸', description: 'Browse our services' },
        
      );

      if (isAdmin) {
        links.push(
          { to: '/admin', label: 'Admin Panel', icon: '⚙️', description: 'Access admin features' }
        );
      }
    } else {
      links.push(
        { to: '/services', label: 'Services', icon: '📸', description: 'Discover our photography services' },
        { to: '/login', label: 'Sign In', icon: '🔑', description: 'Access your account' },
        { to: '/register', label: 'Sign Up', icon: '📝', description: 'Create a new account' }
      );
    }

    return links;
  };

  const suggestedLinks = getSuggestedLinks();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Animation */}
        <div className="mb-8">
          <div className="relative">
            {/* Large 404 */}
            <h1 className="text-9xl font-black text-gray-200 select-none">
              404
            </h1>
            
            {/* Camera Icon Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-blue-600 rounded-full p-6 shadow-lg animate-bounce">
                <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Oops! Page Not Found
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <p className="text-gray-500">
            Don't worry, let's get you back on track! 📷
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Back
          </button>
          
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go Home
          </Link>
        </div>

        {/* Suggested Links */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Where would you like to go?
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestedLinks.map((link, index) => (
              <Link
                key={index}
                to={link.to}
                className="group p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left"
              >
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-3" role="img" aria-label={link.label}>
                    {link.icon}
                  </span>
                  <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {link.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {link.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

      
      </div>
    </div>
  );
};

export default NotFound;