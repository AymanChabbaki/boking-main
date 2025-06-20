import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2">
               <img src="/images-removebg-preview.png" alt="Logo" className="w-12 h-12" />
              <span className="text-xl font-bold">PhotoBook</span>
            </div>
            <p className="mt-4 text-gray-300 max-w-md">
              Professional photography service booking platform. 
              Find the perfect photographer for your precious moments.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link to="/" className="text-base text-gray-300 hover:text-white transition-colors duration-200">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-base text-gray-300 hover:text-white transition-colors duration-200">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-base text-gray-300 hover:text-white transition-colors duration-200">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-base text-gray-300 hover:text-white transition-colors duration-200">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Legal
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link to="/terms" className="text-base text-gray-300 hover:text-white transition-colors duration-200">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-base text-gray-300 hover:text-white transition-colors duration-200">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-gray-700 pt-8">
          <p className="text-base text-gray-400 text-center">
            &copy; {new Date().getFullYear()} PhotoBook. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;