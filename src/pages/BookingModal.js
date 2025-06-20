import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const BookingModal = ({ service, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // ✅ NOUVEAUX ÉTATS POUR LE PAIEMENT
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [bookingCreated, setBookingCreated] = useState(null);
  const [step, setStep] = useState('booking'); // 'booking' | 'payment'

  // État du formulaire
  const [formData, setFormData] = useState({
    bookingDate: '',
    startTime: '',
    endTime: '',
    participants: {
      count: 1,
      details: []
    },
    location: {
      type: 'studio',
      address: {
        street: '',
        city: '',
        postalCode: '',
        country: 'France'
      },
      notes: ''
    },
    photographer: null,
    specialRequests: '',
    clientNotes: ''
  });

  // Photographes disponibles
  const photographers = [
    { name: 'Sophie Martin', email: 'sophie@photo.com', phone: '06 12 34 56 78' },
    { name: 'Thomas Dubois', email: 'thomas@photo.com', phone: '06 23 45 67 89' },
    { name: 'Marie Lefebvre', email: 'marie@photo.com', phone: '06 34 56 78 90' }
  ];

  useEffect(() => {
    if (formData.bookingDate) {
      loadAvailableSlots();
    }
  }, [formData.bookingDate]);

  useEffect(() => {
    if (formData.startTime && service?.duration) {
      const [hours, minutes] = formData.startTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + service.duration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
      setFormData(prev => ({ ...prev, endTime }));
    }
  }, [formData.startTime, service]);

  const loadAvailableSlots = async () => {
    setLoadingSlots(true);
    setAvailableSlots([]);
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/bookings/available-slots?date=${formData.bookingDate}&serviceId=${service._id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('booking_token')}`
          }
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors du chargement des créneaux');
      }

      setAvailableSlots(data.data || []);
      
    } catch (err) {
      console.error('❌ Error loading available slots:', err);
      setError(`Erreur chargement créneaux: ${err.message}`);
      setAvailableSlots(generateFallbackSlots());
    } finally {
      setLoadingSlots(false);
    }
  };

  const generateFallbackSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const startTime = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        const startMinutes = hour * 60 + min;
        const endMinutes = startMinutes + (service?.duration || 60);
        const endHour = Math.floor(endMinutes / 60);
        const endMin = endMinutes % 60;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
        
        slots.push({
          startTime,
          endTime,
          duration: service?.duration || 60
        });
      }
    }
    return slots;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child, grandchild] = name.split('.');
      if (grandchild) {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [grandchild]: value
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotographerSelect = (photographer) => {
    setFormData(prev => ({
      ...prev,
      photographer: photographer ? { ...photographer } : null
    }));
  };

  const handleAssignLater = () => {
    setFormData(prev => ({
      ...prev,
      photographer: null
    }));
  };

  const handleSlotSelect = (slot) => {
    setFormData(prev => ({
      ...prev,
      startTime: slot.startTime,
      endTime: slot.endTime
    }));
  };

  // ✅ FONCTION POUR CRÉER LA RÉSERVATION (SANS PAIEMENT)
  const createBooking = async () => {
    try {
      console.log('📤 Creating booking with data:', formData);

      if (!formData.bookingDate || !formData.startTime || !formData.endTime || !formData.participants.count) {
        throw new Error('Tous les champs requis doivent être remplis');
      }

      const bookingData = {
        service: service._id,
        bookingDate: formData.bookingDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        participants: {
          count: parseInt(formData.participants.count),
          details: formData.participants.details
        },
        location: formData.location,
        specialRequests: formData.specialRequests || '',
        clientNotes: formData.clientNotes || '',
        // ✅ CALCUL DU PRIX TOTAL
        pricing: {
          basePrice: service.price,
          additionalFees: 0,
          discount: 0,
          totalAmount: service.price * parseInt(formData.participants.count),
          currency: 'EUR',
          paymentStatus: 'pending'
        }
      };

      if (formData.photographer && formData.photographer.name) {
        bookingData.photographer = formData.photographer;
      }

      console.log('📤 Final booking data:', bookingData);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('booking_token')}`
        },
        body: JSON.stringify(bookingData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la création de la réservation');
      }

      console.log('✅ Booking created successfully:', data.data);
      return data.data;

    } catch (err) {
      console.error('❌ Error creating booking:', err);
      throw err;
    }
  };

  // ✅ FONCTION POUR REDIRIGER VERS STRIPE
  const redirectToStripe = async (bookingId) => {
    try {
      setPaymentLoading(true);
      console.log('💳 Creating Stripe session for booking:', bookingId);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/payment/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('booking_token')}`
        },
        body: JSON.stringify({ bookingId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la création de la session de paiement');
      }

      console.log('✅ Stripe session created:', data.data);

      // ✅ REDIRIGER VERS STRIPE
      if (data.data.sessionUrl) {
        console.log('🔗 Redirecting to Stripe:', data.data.sessionUrl);
        window.location.href = data.data.sessionUrl;
      } else {
        throw new Error('URL de session Stripe manquante');
      }

    } catch (err) {
      console.error('❌ Error creating Stripe session:', err);
      setError(`Erreur paiement: ${err.message}`);
      setPaymentLoading(false);
    }
  };

  // ✅ GESTION DU SUBMIT PRINCIPAL
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ✅ ÉTAPE 1: CRÉER LA RÉSERVATION
      console.log('🔄 Step 1: Creating booking...');
      const booking = await createBooking();
      setBookingCreated(booking);
      
      // ✅ ÉTAPE 2: REDIRIGER VERS STRIPE
      console.log('🔄 Step 2: Redirecting to Stripe...');
      await redirectToStripe(booking._id);

      // Cette ligne ne sera pas atteinte car on redirige vers Stripe
      
    } catch (err) {
      console.error('❌ Error in booking process:', err);
      setError(err.message || 'Erreur lors du processus de réservation');
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.bookingDate &&
      formData.startTime &&
      formData.endTime &&
      formData.participants.count > 0
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 'booking' ? 'Réserver' : 'Paiement'} : {service.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading || paymentLoading}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenu */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Erreur générale */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-800 font-medium">Erreur de réservation</p>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* ✅ INDICATEUR DE PROGRESSION */}
          <div className="mb-6 bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step === 'booking' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                }`}>
                  {step === 'booking' ? '1' : '✓'}
                </div>
                <span className={`font-medium ${step === 'booking' ? 'text-blue-900' : 'text-green-900'}`}>
                  Informations de réservation
                </span>
                
                <div className="w-8 border-t-2 border-gray-300"></div>
                
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  2
                </div>
                <span className={`font-medium ${step === 'payment' ? 'text-blue-900' : 'text-gray-600'}`}>
                  Paiement sécurisé
                </span>
              </div>
            </div>
          </div>

          {/* Résumé du service */}
          <div className="mb-6 bg-blue-50 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-blue-900">{service.name}</h3>
                <p className="text-sm text-blue-700">Durée : {service.duration} minutes</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-900">{service.price}€</p>
                <p className="text-sm text-blue-700">par session</p>
              </div>
            </div>
          </div>

          {/* ✅ AFFICHAGE CONDITIONNEL DU CONTENU */}
          {step === 'booking' && (
            <>
              {/* Date et heure */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">📅 Date et heure</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de la séance *
                    </label>
                    <input
                      type="date"
                      name="bookingDate"
                      value={formData.bookingDate}
                      onChange={handleInputChange}
                      min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {formData.bookingDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Créneaux disponibles *
                      </label>
                      {loadingSlots ? (
                        <div className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <p className="mt-2 text-gray-500">Chargement des créneaux...</p>
                        </div>
                      ) : availableSlots.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {availableSlots.map((slot, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleSlotSelect(slot)}
                              className={`p-3 border-2 rounded-lg text-sm transition-all ${
                                formData.startTime === slot.startTime
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="font-medium">
                                {slot.startTime} - {slot.endTime}
                              </div>
                              <div className="text-xs text-gray-500">
                                {slot.duration}min
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">Aucun créneau disponible pour cette date</p>
                          <p className="text-sm text-gray-400 mt-1">Veuillez choisir une autre date</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Photographe */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">📸 Photographe (optionnel)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    onClick={handleAssignLater}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.photographer === null
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h4 className="font-medium">À assigner plus tard</h4>
                    <p className="text-sm text-gray-500">Le studio assignera un photographe</p>
                    {formData.photographer === null && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          ✓ Sélectionné
                        </span>
                      </div>
                    )}
                  </div>

                  {photographers.map((photographer) => (
                    <div
                      key={photographer.name}
                      onClick={() => handlePhotographerSelect(photographer)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.photographer?.name === photographer.name
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h4 className="font-medium">{photographer.name}</h4>
                      <p className="text-sm text-gray-500">{photographer.phone}</p>
                      {formData.photographer?.name === photographer.name && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ✓ Sélectionné
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Participants */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">👥 Participants</h3>
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">
                    Nombre de participants :
                  </label>
                  <input
                    type="number"
                    name="participants.count"
                    value={formData.participants.count}
                    onChange={handleInputChange}
                    min="1"
                    max={service.maxParticipants}
                    required
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-500">
                    (Maximum : {service.maxParticipants} personnes)
                  </span>
                </div>
              </div>

              {/* Lieu */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">📍 Lieu de la séance</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type de lieu
                    </label>
                    <select
                      name="location.type"
                      value={formData.location.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="studio">Studio photo</option>
                      <option value="client-home">À domicile</option>
                      <option value="outdoor">Extérieur</option>
                      <option value="event-venue">Lieu d'événement</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  
                  {formData.location.type !== 'studio' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Adresse
                        </label>
                        <input
                          type="text"
                          name="location.address.street"
                          value={formData.location.address.street}
                          onChange={handleInputChange}
                          placeholder="Rue et numéro"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          name="location.address.city"
                          value={formData.location.address.city}
                          onChange={handleInputChange}
                          placeholder="Ville"
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          name="location.address.postalCode"
                          value={formData.location.address.postalCode}
                          onChange={handleInputChange}
                          placeholder="Code postal"
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">💬 Informations complémentaires</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Demandes spéciales (optionnel)
                    </label>
                    <textarea
                      name="specialRequests"
                      value={formData.specialRequests}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Ex: Style particulier, accessoires souhaités..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes pour le photographe (optionnel)
                    </label>
                    <textarea
                      name="clientNotes"
                      value={formData.clientNotes}
                      onChange={handleInputChange}
                      rows={2}
                      placeholder="Informations utiles pour la séance..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ✅ RÉCAPITULATIF PRIX */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">💰 Récapitulatif</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Prix du service :</span>
                <span>{service.price}€</span>
              </div>
              {formData.participants.count > 1 && (
                <div className="flex justify-between items-center">
                  <span>Participants ({formData.participants.count}) :</span>
                  <span>×{formData.participants.count}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between items-center font-bold text-lg">
                <span>Total à payer :</span>
                <span className="text-blue-600">
                  {service.price * formData.participants.count}€
                </span>
              </div>
            </div>
          </div>

          {/* ✅ INFORMATION PAIEMENT SÉCURISÉ */}
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-green-800 font-medium">Paiement 100% sécurisé</p>
                <p className="text-green-700 text-sm mt-1">
                  Vous serez redirigé vers notre plateforme de paiement sécurisée Stripe pour finaliser votre réservation.
                </p>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || paymentLoading}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || paymentLoading || !isFormValid()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || paymentLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {paymentLoading ? 'Redirection vers le paiement...' : 'Création de la réservation...'}
                </span>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2" />
                  </svg>
                  Procéder au paiement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;