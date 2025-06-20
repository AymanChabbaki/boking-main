import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useServices } from '../contexts/ServicesContext';
import { useAuth } from '../contexts/AuthContext';
import CreateServiceForm from '../components/Services/CreateServiceForm';

// Composant de carte de service - Optimisé mobile
const ServiceCard = ({ service }) => {
  const primaryImage = service.images?.find(img => img.isPrimary) || service.images?.[0];
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Image - Hauteur adaptée mobile */}
      <div className="h-40 sm:h-48 bg-gray-200 overflow-hidden">
        {primaryImage ? (
          <img 
            src={primaryImage.url} 
            alt={primaryImage.alt || service.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
            <svg className="h-12 w-12 sm:h-16 sm:w-16 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Contenu - Padding adapté mobile */}
      <div className="p-4 sm:p-6">
        {/* Header - Layout responsive */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 space-y-1 sm:space-y-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2 pr-0 sm:pr-2">
            {service.name}
          </h3>
          <span className="text-lg sm:text-xl font-bold text-blue-600 self-start sm:self-auto">
            {service.price}€
          </span>
        </div>
        
        {/* Tags - Ajustement mobile */}
        <div className="flex flex-wrap gap-1 mb-3">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            {service.category}
          </span>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            {service.type}
          </span>
        </div>
        
        {/* Description - Taille adaptée */}
        <p className="text-gray-600 text-sm mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">
          {service.description}
        </p>
        
        {/* Détails - Layout mobile optimisé */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm text-gray-500 mb-3 sm:mb-4 space-y-1 sm:space-y-0">
          <span className="flex items-center">
            <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {Math.floor(service.duration / 60)}h{service.duration % 60 > 0 ? `${service.duration % 60}min` : ''}
          </span>
          <span className="flex items-center">
            <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {service.location?.type || 'Studio'}
          </span>
        </div>
        
        {/* Bouton - Taille tactile améliorée */}
        <Link
          to={`/services/${service._id}`}
          className="block w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-center py-3 sm:py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
        >
          See details
        </Link>
      </div>
    </div>
  );
};

const ServiceFilters = ({ filters, onFilterChange, onReset }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [isExpanded, setIsExpanded] = useState(false); // État pour mobile

  const handleInputChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
    setIsExpanded(false); // Fermer sur mobile après application
  };

  const handleReset = () => {
    const resetFilters = {
      category: '',
      type: '',
      minPrice: '',
      maxPrice: '',
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    setLocalFilters(resetFilters);
    onReset();
    setIsExpanded(false); // Fermer sur mobile après reset
  };

  return (
    <div className="bg-white rounded-lg shadow-md mb-4 sm:mb-6">
      {/* Header mobile avec toggle */}
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold">Filter services</h3>
          {/* Bouton toggle pour mobile */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="sm:hidden p-2 text-gray-500 hover:text-gray-700"
          >
            <svg 
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        {/* Contenu des filtres - Collapsible sur mobile */}
        <div className={`${isExpanded ? 'block' : 'hidden'} sm:block`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Search - Première position sur mobile */}
            <div className="sm:order-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={localFilters.search}
                onChange={(e) => handleInputChange('search', e.target.value)}
                placeholder="Service name..."
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={localFilters.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              >
                <option value="">All</option>
                <option value="photo">Photo</option>
                <option value="video">Video</option>
                <option value="photo-video">Photo + Video</option>
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={localFilters.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              >
                <option value="">All</option>
                <option value="portrait">Portrait</option>
                <option value="mariage">Wedding</option>
                <option value="evenement">Event</option>
                <option value="entreprise">Corporate</option>
                <option value="produit">Product</option>
                <option value="famille">Family</option>
                <option value="mode">Fashion</option>
                <option value="sport">Sports</option>
              </select>
            </div>

            {/* Prix - Groupés sur mobile */}
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Price (€)
              </label>
              <input
                type="number"
                value={localFilters.minPrice}
                onChange={(e) => handleInputChange('minPrice', e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Price (€)
              </label>
              <input
                type="number"
                value={localFilters.maxPrice}
                onChange={(e) => handleInputChange('maxPrice', e.target.value)}
                placeholder="1000"
                min="0"
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>

            {/* Tri */}
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort by
              </label>
              <select
                value={`${localFilters.sortBy}_${localFilters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('_');
                  handleInputChange('sortBy', sortBy);
                  handleInputChange('sortOrder', sortOrder);
                }}
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              >
                <option value="createdAt_desc">Most recent</option>
                <option value="createdAt_asc">Oldest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="duration_asc">Duration: Short to Long</option>
                <option value="duration_desc">Duration: Long to Short</option>
              </select>
            </div>
          </div>

          {/* Boutons - Layout mobile optimisé */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 sm:mt-6 space-y-3 sm:space-y-0">
            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 border border-gray-300 rounded-lg sm:border-none"
            >
              Reset
            </button>
            <button
              onClick={handleApplyFilters}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-3 sm:py-2 rounded-lg transition-colors duration-200 font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Pagination component - Optimisé mobile
const Pagination = ({ pagination, onPageChange }) => {
  const { currentPage, totalPages, hasNextPage, hasPrevPage } = pagination;

  const pages = [];
  const maxVisiblePages = window.innerWidth < 640 ? 3 : 5; // Moins de pages sur mobile
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center space-x-1 sm:space-x-2 mt-6 sm:mt-8">
      {/* Previous button - Adapté mobile */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrevPage}
        className={`px-2 sm:px-3 py-2 rounded-md transition-colors duration-200 text-sm sm:text-base ${
          hasPrevPage
            ? 'bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 border border-gray-300'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        <span className="hidden sm:inline">Previous</span>
        <svg className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Pages - Taille tactile */}
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-2 rounded-md transition-colors duration-200 text-sm sm:text-base min-w-[40px] ${
            page === currentPage
              ? 'bg-blue-600 text-white'
              : 'bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 border border-gray-300'
          }`}
        >
          {page}
        </button>
      ))}

      {/* Next button - Adapté mobile */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
        className={`px-2 sm:px-3 py-2 rounded-md transition-colors duration-200 text-sm sm:text-base ${
          hasNextPage
            ? 'bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 border border-gray-300'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        <span className="hidden sm:inline">Next</span>
        <svg className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

// Main component - Optimisé mobile
const Services = () => {
  const {isAdmin } = useAuth();
  const {
    services,
    loading,
    error,
    filters,
    pagination,
    fetchServices,
    updateFilters,
    resetFilters,
    clearError
  } = useServices();

  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handlePageChange = (page) => {
    fetchServices(filters, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = (newFilters) => {
    updateFilters(newFilters);
    fetchServices(newFilters, 1);
  };

  const handleResetFilters = () => {
    resetFilters();
    fetchServices({}, 1);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchServices();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-4">
        {/* Header - Layout mobile optimisé */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
              Our Photography Services
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto sm:mx-0">
              Discover our selection of professional photography services
              to immortalize your precious moments.
            </p>
          </div>
          
          {/* Bouton créer service - Adapté mobile */}
          {isAdmin && (
            <div className="sm:ml-8">
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden sm:inline">Create a service</span>
                <span className="sm:hidden">Create service</span>
              </button>
            </div>
          )}
        </div>

        {/* Filtres */}
        <ServiceFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* Erreur - Design mobile amélioré */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 sm:mb-6">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800 flex-1 text-sm sm:text-base">{error}</p>
              <button
                onClick={clearError}
                className="ml-2 text-red-400 hover:text-red-600 p-1"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Résultats - Info responsive */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
            <p className="text-gray-600 text-sm sm:text-base">
              {loading ? (
                'Loading...'
              ) : (
                `${pagination.totalServices} service${pagination.totalServices > 1 ? 's' : ''} found`
              )}
            </p>
            
            {pagination.totalServices > 0 && (
              <p className="text-xs sm:text-sm text-gray-500">
                Page {pagination.currentPage} of {pagination.totalPages}
              </p>
            )}
          </div>
        </div>

        {/* Chargement */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Liste des services - Grid responsive amélioré */}
        {!loading && services.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {services.map(service => (
                <ServiceCard key={service._id} service={service} />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </>
        )}

        {/* Aucun service trouvé - Layout mobile optimisé */}
        {!loading && services.length === 0 && !error && (
          <div className="text-center py-8 sm:py-12 px-4">
            <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              No service found
            </h3>
            <p className="text-gray-500 mb-4 text-sm sm:text-base">
              {isAdmin ? (
                'Be the first to create a service!'
              ) : (
                'No service available at the moment.'
              )}
            </p>

            {isAdmin ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-3 rounded-lg transition-colors duration-200"
              >
                Create the first service
              </button>
            ) : (
              <button
                onClick={handleResetFilters}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-3 rounded-lg transition-colors duration-200"
              >
                Reset filters
              </button>
            )}
          </div>
        )}

        {/* Create Service Form */}
        {showCreateForm && (
          <CreateServiceForm
            onClose={() => setShowCreateForm(false)}
            onSuccess={handleCreateSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default Services;