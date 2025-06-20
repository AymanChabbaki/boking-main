import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ServicesProvider } from '../src/contexts/ServicesContext';
import { BookingProvider } from '../src/contexts/BookingContext';
// Authentication components
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import ProtectedRoute, { AdminRoute, ClientRoute, PublicRoute } from './components/auth/ProtectedRoute';
// ✅ IMPORTATION DES COMPOSANTS DE PAIEMENT
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
// Layout components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';  // ✅ CLIENT Dashboard only
import AdminDashboard from './pages/AdminDashboard'; // ✅ Separate admin dashboard
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Legal pages
import TermsOfService from './pages/Legal/TermsOfService';
import PrivacyPolicy from './pages/Legal/PrivacyPolicy';
import UserManagement from './pages/UserManagement';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ServicesProvider>
          <BookingProvider>
            <div className="min-h-screen bg-gray-50 flex flex-col">
              {/* Navigation */}
              <Navbar />
              
              {/* Main content */}
              <main className="flex-grow">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/services/:id" element={<ServiceDetail />} />
                  
                  {/* ✅ Authentication routes with smart redirection */}
                  <Route 
                    path="/login" 
                    element={
                      <PublicRoute redirectTo="/dashboard">
                        <LoginForm />
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/register" 
                    element={
                      <PublicRoute redirectTo="/dashboard">
                        <SignupForm />
                      </PublicRoute>
                    } 
                  />
                  
                  {/* ✅ CLIENT Dashboard only - Admins will be redirected */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <ClientRoute>
                        <Dashboard />
                      </ClientRoute>
                    } 
                  />
                  
                  {/* ✅ Separate Admin dashboard */}
                  <Route 
                    path="/admin/dashboard" 
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    } 
                  />
                  
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Route for "My Bookings" - CLIENT only */}
                  <Route 
                    path="/dashboard/bookings" 
                    element={
                      <ClientRoute>
                        <Dashboard />
                      </ClientRoute>
                    }
                  />

                  {/* Specialized Admin routes */}
                  <Route 
                    path="/admin/services" 
                    element={
                      <AdminRoute>
                        <Services />
                      </AdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/users" 
                    element={
                      <AdminRoute>
                        <UserManagement />
                      </AdminRoute>
                    } 
                  />
                   <Route 
              path="/payment/success" 
              element={
                <ProtectedRoute>
                  <PaymentSuccess />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payment/cancel" 
              element={
                <ProtectedRoute>
                  <PaymentCancel />
                </ProtectedRoute>
              } 
            />
                  {/* Legal pages */}
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  
                  {/* ✅ Admin redirections */}
                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                  
                  {/* 404 page */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              
              {/* Footer */}
              <Footer />
            </div>
          </BookingProvider>
        </ServicesProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;