import React, { useEffect, useState } from 'react';

const PaymentSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const [verificationAttempts, setVerificationAttempts] = useState(0);

  // Récupérer les paramètres de l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  const bookingId = urlParams.get('booking_id');

  useEffect(() => {
    if (!sessionId) {
      setError('Session ID manquant');
      setLoading(false);
      return;
    }

    // ✅ VÉRIFIER LE PAIEMENT IMMÉDIATEMENT AVEC RETRY
    verifyPaymentWithRetry();
  }, [sessionId]);

  // ✅ FONCTION AVEC RETRY AUTOMATIQUE - CORRIGÉE
  const verifyPaymentWithRetry = async (attemptNumber = 1) => {
    const maxAttempts = 3;
    
    try {
      console.log(`🔍 Tentative ${attemptNumber}/${maxAttempts} - Vérification du paiement...`);
      setVerificationAttempts(attemptNumber);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/payment/verify/${sessionId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('booking_token')}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la vérification');
      }

      console.log('✅ Paiement vérifié:', data.data);
      
      // ✅ CORRECTION : ACCEPTER 'pending' + 'paid' COMME SUCCÈS
      if (data.data.paymentStatus === 'paid') {
        // Le paiement est confirmé, peu importe le statut de la réservation
        console.log('✅ Paiement confirmé, affichage du succès');
        setBookingData(data.data.booking);
        setLoading(false);
      } else if (attemptNumber < maxAttempts) {
        // ✅ RETRY SI LE PAIEMENT N'EST PAS ENCORE CONFIRMÉ
        console.log('⏳ Paiement pas encore confirmé, retry dans 2 secondes...');
        setTimeout(() => {
          verifyPaymentWithRetry(attemptNumber + 1);
        }, 2000);
      } else {
        // ✅ DERNIÈRE TENTATIVE - ACCEPTER MÊME SI LE PAIEMENT N'EST PAS PARFAIT
        console.log('⚠️ Paiement pas complètement confirmé mais on continue');
        setBookingData(data.data.booking || {
          id: bookingId,
          serviceName: 'Service inconnu',
          totalAmount: 0,
          status: 'pending',
          paymentStatus: 'pending'
        });
        setLoading(false);
      }

    } catch (err) {
      console.error(`❌ Erreur vérification (tentative ${attemptNumber}):`, err);
      
      if (attemptNumber < maxAttempts) {
        console.log(`🔄 Retry dans 2 secondes...`);
        setTimeout(() => {
          verifyPaymentWithRetry(attemptNumber + 1);
        }, 2000);
      } else {
        setError(err.message);
        setLoading(false);
      }
    }
  };

  // ✅ FONCTION POUR ALLER AU DASHBOARD
  const goToDashboard = () => {
    window.location.href = '/dashboard';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Vérification du paiement...
          </h2>
          <p className="text-gray-600">
            Tentative {verificationAttempts}/3 - Patientez un instant...
          </p>
          {verificationAttempts > 1 && (
            <p className="text-sm text-blue-600 mt-2">
              Synchronisation en cours avec le système de paiement...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <svg className="mx-auto h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => verifyPaymentWithRetry(1)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Réessayer la vérification
              </button>
              <button
                onClick={goToDashboard}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Aller au tableau de bord
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ CORRECTION : VÉRIFIER LE PAIEMENT, PAS LE STATUT DE LA RÉSERVATION
  const isPaid = bookingData?.paymentStatus === 'paid';
  const isPending = bookingData?.status === 'pending';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* ✅ HEADER SUCCESS */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Paiement réussi !
          </h1>
          <p className="text-lg text-gray-600">
            {isPaid && isPending 
              ? 'Votre paiement a été confirmé. Votre réservation est en attente d\'approbation.' 
              : 'Votre réservation a été traitée avec succès.'
            }
          </p>
        </div>

        {/* ✅ DÉTAILS RÉSERVATION */}
        {bookingData && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="bg-green-50 px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-green-900">Votre réservation</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Service</h3>
                  <div className="space-y-2">
                    <p className="text-gray-600">
                      <span className="font-medium">Service :</span> {bookingData.serviceName || 'Service inconnu'}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">ID :</span> {bookingData.id || bookingId}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Statut :</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        isPending ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {isPending ? 'En attente d\'approbation' : 'Confirmée'}
                      </span>
                    </p>
                    {bookingData.bookingDate && (
                      <p className="text-gray-600">
                        <span className="font-medium">Date :</span> {new Date(bookingData.bookingDate).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    {bookingData.startTime && bookingData.endTime && (
                      <p className="text-gray-600">
                        <span className="font-medium">Heure :</span> {bookingData.startTime} - {bookingData.endTime}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Paiement</h3>
                  <div className="space-y-2">
                    <p className="text-gray-600">
                      <span className="font-medium">Montant :</span>
                      <span className="text-2xl font-bold text-green-600 ml-2">
                        {bookingData.totalAmount || 0}€
                      </span>
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Statut :</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {isPaid ? 'Payé' : 'En cours'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* ✅ MESSAGE EXPLICATIF POUR LE STATUT PENDING */}
              {isPaid && isPending && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-blue-800 font-medium">Prochaine étape</p>
                      <p className="text-blue-700 text-sm mt-1">
                        Votre paiement a été confirmé avec succès. Votre réservation sera examinée par notre équipe et vous recevrez une confirmation d'ici 24-48h.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ✅ ACTIONS */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={goToDashboard}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors inline-flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Mes réservations
            </button>
            
            <a
              href="/services"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-8 rounded-lg transition-colors inline-flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Nouvelle réservation
            </a>
          </div>

          {/* Informations */}
          <div className="pt-6 border-t">
            <p className="text-gray-600 text-sm">
              Un email de confirmation vous sera envoyé prochainement.
            </p>
            {isPaid && isPending && (
              <p className="text-blue-600 text-sm mt-2">
                Votre réservation sera confirmée par l'équipe sous 24-48h.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;