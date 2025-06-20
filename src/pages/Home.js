import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();
    
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section - Responsive padding */}
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <div className="text-center">
          {/* Title - Responsive font size */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            Welcome to <span className="text-blue-600">PhotoBook</span>
          </h1>
          
          {/* Description - Responsive text size and spacing */}
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-2 sm:px-0 leading-relaxed">
            Platform for booking professional photography services.
            Find the perfect photographer to capture your precious moments.
          </p>
                   
          {/* Buttons Container - Responsive layout */}
          <div className="flex flex-col sm:flex-row sm:justify-center sm:space-x-4 space-y-3 sm:space-y-0 max-w-md sm:max-w-none mx-auto">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 px-6 sm:px-8 rounded-lg transition-colors duration-200 text-center"
                >
                  Get Started
                </Link>
                <Link
                  to="/services"
                  className="w-full sm:w-auto bg-white hover:bg-gray-50 active:bg-gray-100 text-blue-600 font-bold py-3 px-6 sm:px-8 rounded-lg border-2 border-blue-600 transition-colors duration-200 text-center"
                >
                  View Services
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 px-6 sm:px-8 rounded-lg transition-colors duration-200 text-center"
                >
                  My Dashboard
                </Link>
                <Link
                  to="/services"
                  className="w-full sm:w-auto bg-white hover:bg-gray-50 active:bg-gray-100 text-blue-600 font-bold py-3 px-6 sm:px-8 rounded-lg border-2 border-blue-600 transition-colors duration-200 text-center"
                >
                  Book a Service
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;