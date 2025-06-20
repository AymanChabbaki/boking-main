// ===== ServiceCard.js - AVEC IMAGES ET VIDEOS =====
import React, { useState } from 'react';

const ServiceCard = ({ service, onBook, onEdit, onDelete, showActions = false }) => {
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [mediaType, setMediaType] = useState('images'); // 'images' ou 'videos'
// ✅ AJOUTEZ CES LOGS POUR DEBUG
  console.log('🎬 ServiceCard - Service received:', service);
  console.log('🎬 ServiceCard - Videos in service:', service.videos);
  console.log('🎬 ServiceCard - Videos length:', service.videos?.length || 0);
  console.log('🎬 ServiceCard - Images in service:', service.images);
  console.log('🎬 ServiceCard - Images length:', service.images?.length || 0);
  // Combiner images et vidéos pour l'affichage
  const allMedia = [
    ...(service.images || []).map(img => ({ ...img, type: 'image' })),
    ...(service.videos || []).map(vid => ({ ...vid, type: 'video' }))
  ];
  // ✅ AJOUTEZ CES LOGS AUSSI
  console.log('🎬 ServiceCard - All media combined:', allMedia);
  console.log('🎬 ServiceCard - Media type selected:', mediaType);
  const currentMedia = mediaType === 'images' 
    ? (service.images || [])
    : (service.videos || []);
  // ✅ LOG DU MÉDIA ACTUEL
  console.log('🎬 ServiceCard - Current media for display:', currentMedia);
  console.log('🎬 ServiceCard - Current media length:', currentMedia.length);
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  // Helper to get full image URL
  const getImageUrl = (url) => {
    if (!url) return '';
    // If already absolute (http/https), return as is
    if (/^https?:\/\//i.test(url)) return url;
    // Remove trailing /api if present
    const apiBase = process.env.REACT_APP_API_URL?.replace(/\/api$/, '') || '';
    // Ensure no double slashes
    return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* SECTION MÉDIA */}
      {allMedia.length > 0 ? (
        <div className="relative h-48 bg-gray-100">
          {/* Onglets Images/Vidéos */}
          {service.images?.length > 0 && service.videos?.length > 0 && (
            <div className="absolute top-2 left-2 z-10 flex bg-black bg-opacity-50 rounded-md">
              <button
                onClick={() => setMediaType('images')}
                className={`px-3 py-1 text-xs font-medium rounded-l-md transition-colors ${
                  mediaType === 'images'
                    ? 'bg-white text-black'
                    : 'text-white hover:bg-gray-700'
                }`}
              >
                📸 Images ({service.images.length})
              </button>
              <button
                onClick={() => setMediaType('videos')}
                className={`px-3 py-1 text-xs font-medium rounded-r-md transition-colors ${
                  mediaType === 'videos'
                    ? 'bg-white text-black'
                    : 'text-white hover:bg-gray-700'
                }`}
              >
                🎬 Vidéos ({service.videos.length})
              </button>
            </div>
          )}

          {/* Affichage du média actuel */}
          {currentMedia.length > 0 && (
            <>
              {/* Image */}
              {mediaType === 'images' && (
                <img
                  src={getImageUrl(currentMedia[selectedMediaIndex]?.url)}
                  alt={currentMedia[selectedMediaIndex]?.alt || service.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE0OCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                  }}
                />
              )}

              {/* Vidéo */}
              {mediaType === 'videos' && (
                <video
                  src={currentMedia[selectedMediaIndex]?.url}
                  className="w-full h-full object-cover"
                  controls
                  poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE0OCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iNzQiIHI9IjI1IiBmaWxsPSIjOTk5Ii8+PHBvbHlnb24gcG9pbnRzPSI5MCw2MCA5MCw4OCAxMTAsNzQiIGZpbGw9IndoaXRlIi8+PC9zdmc+"
                />
              )}

              {/* Navigation des médias */}
              {currentMedia.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedMediaIndex(prev => prev > 0 ? prev - 1 : currentMedia.length - 1)}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSelectedMediaIndex(prev => prev < currentMedia.length - 1 ? prev + 1 : 0)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Indicateurs de médias */}
              {currentMedia.length > 1 && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {currentMedia.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedMediaIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        selectedMediaIndex === index ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Badge de statut */}
          {!service.isActive && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
              Inactif
            </div>
          )}
        </div>
      ) : (
        /* Placeholder si pas de média */
        <div className="h-48 bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm mt-1">Aucun média</p>
          </div>
        </div>
      )}

      {/* CONTENU DU SERVICE */}
      <div className="p-4">
        {/* Header avec titre et prix */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{service.name}</h3>
          <span className="text-xl font-bold text-blue-600 ml-2">{formatPrice(service.price)}</span>
        </div>

        {/* Badges catégorie et type */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {service.category}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {service.type}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">{service.description}</p>

        {/* Détails du service */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatDuration(service.duration)}
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Max {service.maxParticipants} pers.
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {service.location?.type || 'Non spécifié'}
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {service.deliverables?.deliveryTime || 7} jours
          </div>
        </div>

        {/* Média stats */}
        {(service.images?.length > 0 || service.videos?.length > 0) && (
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
            {service.images?.length > 0 && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                {service.images.length} image{service.images.length > 1 ? 's' : ''}
              </div>
            )}
            {service.videos?.length > 0 && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                {service.videos.length} vidéo{service.videos.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {service.tags && service.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {service.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
            {service.tags.length > 3 && (
              <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                +{service.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onBook?.(service)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            Réserver
          </button>
          
          {showActions && (
            <>
              <button
                onClick={() => onEdit?.(service)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-3 rounded-md transition-colors duration-200"
                title="Modifier"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              
              <button
                onClick={() => onDelete?.(service)}
                className="bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium py-2 px-3 rounded-md transition-colors duration-200"
                title="Supprimer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;