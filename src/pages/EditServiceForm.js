import React, { useState, useEffect } from 'react';
import { useServices } from '../contexts/ServicesContext';

const EditServiceForm = ({ service, onClose, onSuccess }) => {
  const { updateService } = useServices();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state initialized with service data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    duration: 60,
    category: 'photo',
    type: 'portrait',
    maxParticipants: 1,
    isActive: true
  });

  // Initialize the form when the service changes
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || '',
        description: service.description || '',
        price: service.price || 0,
        duration: service.duration || 60,
        category: service.category || 'photo',
        type: service.type || 'portrait',
        maxParticipants: service.maxParticipants || 1,
        isActive: service.isActive !== false // Par défaut true si undefined
      });
    }
  }, [service]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              (name === 'price' || name === 'duration' || name === 'maxParticipants') ? 
              Number(value) : value
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Client-side validation
      if (!formData.name.trim()) {
        throw new Error('Service name is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }
      if (formData.price <= 0) {
        throw new Error('Price must be greater than 0');
      }
      if (formData.duration < 15) {
        throw new Error('Minimum duration is 15 minutes');
      }
      if (formData.maxParticipants < 1) {
        throw new Error('Maximum number of participants must be at least 1');
      }

      console.log('📝 Updating service with data:', formData);

      const result = await updateService(service._id, formData);
      
      if (result.success) {
        console.log('✅ Service updated successfully');
        onSuccess?.(result.data);
        onClose();
      } else {
        throw new Error(result.error || 'Error modifying service');
      }

    } catch (err) {
      console.error('❌ Error updating service:', err);
      setError(err.message || 'Error modifying service');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'photo', label: 'Photographie' },
    { value: 'video', label: 'Vidéographie' },
    { value: 'photo-video', label: 'Photo & Vidéo' }
  ];

  const types = [
    { value: 'portrait', label: 'Portrait' },
    { value: 'mariage', label: 'Mariage' },
    { value: 'evenement', label: 'Événement' },
    { value: 'entreprise', label: 'Entreprise' },
    { value: 'produit', label: 'Produit' },
    { value: 'immobilier', label: 'Immobilier' },
    { value: 'sport', label: 'Sport' },
    { value: 'nature', label: 'Nature' },
    { value: 'mode', label: 'Mode' },
    { value: 'nouveau-ne', label: 'Nouveau-né' },
    { value: 'famille', label: 'Famille' },
    { value: 'grossesse', label: 'Grossesse' },
    { value: 'bapteme', label: 'Baptême' },
    { value: 'anniversaire', label: 'Anniversaire' },
    { value: 'autre', label: 'Autre' }
  ];

  if (!service) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            ✏️ Edit service
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {/* Erreur globale */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Nom du service */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Séance photo portrait"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Décrivez votre service..."
              />
            </div>

            {/* Prix et durée */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (€) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="15"
                  step="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Catégorie et type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                 Type of service *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {types.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Participants maximum */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
               Maximum number of participants *
              </label>
              <input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleInputChange}
                min="1"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Statut actif */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Active service (visible to clients)
              </label>
            </div>
          </div>

          {/* Aperçu du prix formaté */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Price preview:</span>
              <span className="text-lg font-bold text-blue-600">
                {formData.price} €
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-gray-600">Duration:</span>
              <span className="text-sm font-medium text-gray-700">
                {Math.floor(formData.duration / 60)}h{formData.duration % 60 > 0 ? `${formData.duration % 60}min` : ''}
              </span>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Modification...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Validate the changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditServiceForm;