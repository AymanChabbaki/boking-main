import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PaymentCancel = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const bookingId = searchParams.get('booking_id');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (bookingId) {
      loadBookingData();
    } else {
      setLoading(false);
    }
  }, [bookingId, isAuthenticated, navigate]);

  const loadBookingData = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/bookings/${bookingId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('booking_token')}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setBookingData(data.data);
      } else {
        console.warn('Impossible de charger les données de réservation:', data.message);
      }
    } catch (err) {
      console.error('Erreur chargement réservation:', err);
      setError('Impossible de charger les informations de réservation');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = () => {
    if (bookingData && bookingData.isPayable) {
      // Rediriger vers la création d'une nouvelle session Stripe
      redirectToPayment();
    }
  };

  const redirectToPayment = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/payment/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('booking_token')}`
          },
          body: JSON.stringify({ bookingId: bookingData._id })
        }
      );

      const data = await response.json();

      if (response.ok && data.data.sessionUrl) {
        window.location.href = data.data.sessionUrl;
      } else {
        setError('Impossible de créer une nouvelle session de paiement');
      }
    } catch (err) {
      console.error('Erreur création session paiement:', err);
      setError('Erreur lors de la création de la session de paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* ✅ CANCEL HEADER */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-4">
            <svg className="h-12 w-12 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Paiement annulé</h1>
          <p className="text-lg text-gray-600">
            Votre paiement a été annulé. Votre réservation est temporairement en attente.
          </p>
        </div>

        {/* ✅ INFORMATION CARD */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="bg-orange-50 px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-orange-900">Que s'est-il passé ?</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-gray-900 font-medium">Paiement interrompu</p>
                  <p className="text-gray-600 text-sm">
                    Vous avez quitté la page de paiement avant de finaliser la transaction.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <svg className="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-gray-900 font-medium">Réservation conservée</p>
                  <p className="text-gray-600 text-sm">
                    Votre réservation est temporairement maintenue, mais doit être payée rapidement.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <svg className="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-gray-900 font-medium">Expiration automatique</p>
                  <p className="text-gray-600 text-sm">
                    Sans paiement, votre réservation sera automatiquement annulée dans 30 minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ BOOKING DETAILS (if available) */}
        {!loading && bookingData && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Détails de votre réservation</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Service</h3>
                  <div className="space-y-2">
                    <p className="text-gray-600">
                      <span className="font-medium">Service :</span> {bookingData.service?.name || 'Service indisponible'}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">ID :</span> {bookingData._id}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Statut :</span>
                      <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        En attente de paiement
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Montant</h3>
                  <div className="space-y-2">
                    <p className="text-gray-600">
                      <span className="font-medium">Total :</span> 
                      <span className="text-2xl font-bold text-blue-600 ml-2">
                        {bookingData.pricing?.totalAmount}€
                      </span>
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Statut paiement :</span>
                      <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Non payé
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ ERROR MESSAGE */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* ✅ ACTION BUTTONS */}
        <div className="text-center space-y-6">
          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {bookingData && bookingData.isPayable && (
              <button
                onClick={handleRetryPayment}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-8 rounded-lg transition-colors inline-flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Redirection...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2" />
                    </svg>
                    Finaliser le paiement
                  </>
                )}
              </button>
            )}
            
            <Link
              to="/dashboard"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-8 rounded-lg transition-colors inline-flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Mes réservations
            </Link>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/services"
              className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour aux services
            </Link>
          </div>

          {/* Help Section */}
          <div className="pt-8 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Besoin d'aide ?</h3>
            <p className="text-gray-600 mb-4">
              Si vous rencontrez des difficultés avec le paiement, notre équipe support est là pour vous aider.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
              <a
                href="mailto:support@photobook.com"
                className="text-blue-600 hover:text-blue-700 inline-flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                support@photobook.com
              </a>
              <a
                href="tel:+33123456789"
                className="text-blue-600 hover:text-blue-700 inline-flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +33 1 23 45 67 89
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;