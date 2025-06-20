// ===== CreateServiceForm.js - IMAGES + VIDEOS =====
import React, { useState } from 'react';
import { useServices } from '../../contexts/ServicesContext';

const CreateServiceForm = ({ onClose, onSuccess }) => {
  const { createService, loading } = useServices();
 
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'photo',
    type: 'portrait',
    price: '',
    duration: 120,
    maxParticipants: 1,
    location: {
      type: 'studio'
    },
    deliverables: {
      photos: {
        digitalCount: 10,
        printCount: 0
      },
      videos: {
        duration: 0
      },
      deliveryTime: 7
    },
    equipment: [],
    tags: [],
    images: [],
    videos: []
  });

  const [currentEquipment, setCurrentEquipment] = useState({ name: '', description: '' });
  const [currentTag, setCurrentTag] = useState('');
  const [currentImage, setCurrentImage] = useState({ url: '', alt: '' });
  const [errors, setErrors] = useState({});

  // États pour l'upload
  const [imageMode, setImageMode] = useState('upload');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragActiveImage, setDragActiveImage] = useState(false);
  const [uploadImageDescription, setUploadImageDescription] = useState('');

  // FONCTIONS D'UPLOAD IMAGE
  const uploadImage = async (file) => {
    setUploadingImage(true);
    
    try {
      console.log('📤 Uploading image file:', file.name);

      const formData = new FormData();
      formData.append('image', file);
      formData.append('alt', uploadImageDescription || file.name);

      const token = localStorage.getItem('booking_token');
      const response = await fetch('https://backend-main-production-78c0.up.railway.app/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Image upload successful:', result.data);
        
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, result.data]
        }));
        
        setUploadImageDescription('');
        setErrors(prev => ({ ...prev, uploadImage: null }));
      } else {
        throw new Error(result.message || 'Erreur lors de l\'upload de l\'image');
      }

    } catch (error) {
      console.error('❌ Image upload error:', error);
      setErrors(prev => ({ ...prev, uploadImage: error.message }));
    } finally {
      setUploadingImage(false);
    }
  };

  const validateAndUploadImage = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, uploadImage: 'Type de fichier non autorisé. Utilisez: JPG, PNG, GIF, WEBP' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, uploadImage: 'Fichier trop volumineux. Maximum: 5MB' }));
      return;
    }

    uploadImage(file);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndUploadImage(file);
    }
  };

  // DRAG & DROP IMAGES
  const handleImageDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActiveImage(true);
    } else if (e.type === 'dragleave') {
      setDragActiveImage(false);
    }
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveImage(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUploadImage(e.dataTransfer.files[0]);
    }
  };

  // VALIDATION URLs
  const isValidImageUrl = (url) => {
    try {
      const validUrl = new URL(url);
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      const hasValidExtension = imageExtensions.some(ext => 
        validUrl.pathname.toLowerCase().includes(ext)
      );
      const isValidDomain = validUrl.protocol === 'http:' || validUrl.protocol === 'https:';
      
      return isValidDomain && (hasValidExtension || url.includes('imgur') || url.includes('cloudinary'));
    } catch {
      return false;
    }
  };

  

  // Handle field changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child, grandchild] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: grandchild ? {
            ...prev[parent][child],
            [grandchild]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
          } : (type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value))
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
      }));
    }
  };

  // Add equipment
  const addEquipment = () => {
    if (currentEquipment.name.trim()) {
      setFormData(prev => ({
        ...prev,
        equipment: [...prev.equipment, { ...currentEquipment }]
      }));
      setCurrentEquipment({ name: '', description: '' });
    }
  };

  // Remove equipment
  const removeEquipment = (index) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== index)
    }));
  };

  // Add tag
  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  // Remove tag
  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Add image from URL
  const addImage = () => {
    const url = currentImage.url.trim();
    const alt = currentImage.alt.trim() || 'Image du service';

    if (!url) {
      setErrors(prev => ({ ...prev, imageUrl: 'URL image requise' }));
      return;
    }

    if (!isValidImageUrl(url)) {
      setErrors(prev => ({ ...prev, imageUrl: 'URL image invalide. Utilisez .jpg, .png, .gif, .webp ou des services comme Imgur' }));
      return;
    }

    const newImage = {
      url: url,
      alt: alt,
      type: 'image',
      isUploaded: false,
      uploadedAt: new Date()
    };

    console.log('📸 Adding image:', newImage);

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, newImage]
    }));

    setCurrentImage({ url: '', alt: '' });
    setErrors(prev => ({ ...prev, imageUrl: null }));
  };

 
  // Remove image
  const removeImage = (index) => {
    console.log(`🗑️ Removing image at index ${index}`);
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

 

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (!formData.duration || formData.duration <= 0) newErrors.duration = 'Duration must be greater than 0';
    if (!formData.maxParticipants || formData.maxParticipants <= 0) newErrors.maxParticipants = 'Number of participants must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      console.log('🚀 Submitting service with media:', {
        images: formData.images.length,
        videos: formData.videos.length
      });

      const result = await createService(formData);
      
      if (result.success) {
        console.log('✅ Service created successfully');
        onSuccess?.();
        onClose?.();
      } else {
        setErrors({ submit: result.error });
      }
    } catch (error) {
      console.error('❌ Error creating service:', error);
      setErrors({ submit: 'Error creating service' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Create new service</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* General error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{errors.submit}</p>
            </div>
          )}

          {/* Basic information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Professional portrait photo session"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (€) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="150"
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="photo">Photo</option>
                <option value="video">Video</option>
                <option value="photo-video">Photo + Video</option>
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="portrait">Portrait</option>
                <option value="mariage">Mariage</option>
                <option value="evenement">Événement</option>
                <option value="entreprise">Entreprise</option>
                <option value="produit">Produit</option>
                <option value="famille">Famille</option>
                <option value="mode">Mode</option>
                <option value="sport">Sport</option>
                <option value="immobilier">Immobilier</option>
                <option value="nature">Nature</option>
                <option value="nouveau-ne">Nouveau-né</option>
                <option value="grossesse">Grossesse</option>
                <option value="bapteme">Baptême</option>
                <option value="anniversaire">Anniversaire</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes) *
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                min="15"
                step="15"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.duration ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="120"
              />
              {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
            </div>

            {/* Max participants */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max number of participants *
              </label>
              <input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleInputChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.maxParticipants ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="1"
              />
              {errors.maxParticipants && <p className="text-red-500 text-sm mt-1">{errors.maxParticipants}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe your service in detail..."
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location type
            </label>
            <select
              name="location.type"
              value={formData.location.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="studio">Studio</option>
              <option value="client-home">Client home</option>
              <option value="outdoor">Outdoor</option>
              <option value="event-venue">Event venue</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Deliverables */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Included deliverables</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Digital photos
                </label>
                <input
                  type="number"
                  name="deliverables.photos.digitalCount"
                  value={formData.deliverables.photos.digitalCount}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Printed photos
                </label>
                <input
                  type="number"
                  name="deliverables.photos.printCount"
                  value={formData.deliverables.photos.printCount}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery time (days)
                </label>
                <input
                  type="number"
                  name="deliverables.deliveryTime"
                  value={formData.deliverables.deliveryTime}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Equipment */}
          <div>
            <h3 className="text-lg font-medium mb-4">Included equipment</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={currentEquipment.name}
                onChange={(e) => setCurrentEquipment(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Equipment name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={currentEquipment.description}
                onChange={(e) => setCurrentEquipment(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description (optional)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addEquipment}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
              >
                Add
              </button>
            </div>
            {formData.equipment.length > 0 && (
              <div className="space-y-2">
                {formData.equipment.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEquipment(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-lg font-medium mb-4">Tags</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Add a tag"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button
                type="button"
                onClick={addTag}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* SECTION IMAGES */}
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4 text-green-900">📸 Service Images</h3>
            
            {/* Onglets pour images */}
            <div className="mb-4">
              <div className="border-b border-green-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      imageMode === 'upload'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    📤 Upload Fichier
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      imageMode === 'url'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    🔗 URL Image
                  </button>
                </nav>
              </div>
            </div>

            {/* Mode Upload Image */}
            {imageMode === 'upload' && (
              <div className="bg-white rounded-lg p-4 mb-4">
                <h4 className="font-medium mb-3 text-green-900">Upload image depuis votre ordinateur</h4>
                <div className="space-y-3">
                  {/* Zone d'upload image */}
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragActiveImage
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleImageDrag}
                    onDragLeave={handleImageDrag}
                    onDragOver={handleImageDrag}
                    onDrop={handleImageDrop}
                  >
                    {uploadingImage ? (
                      <div className="flex flex-col items-center">
                        <svg className="animate-spin h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-2 text-sm text-green-600">Upload image en cours...</p>
                      </div>
                    ) : (
                      <div>
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="mt-4">
                          <label htmlFor="image-file-upload" className="cursor-pointer">
                            <span className="text-green-600 hover:text-green-500 font-medium">
                              Cliquez pour choisir une image
                            </span>
                            <span className="text-gray-500"> ou glissez-déposez</span>
                          </label>
                          <input
                            id="image-file-upload"
                            name="image-file-upload"
                            type="file"
                            className="sr-only"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handleImageFileChange}
                            disabled={uploadingImage}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          PNG, JPG, GIF, WEBP jusqu'à 5MB
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Description pour image uploadée */}
                  <div>
                    <input
                      type="text"
                      value={uploadImageDescription}
                      onChange={(e) => setUploadImageDescription(e.target.value)}
                      placeholder="Description de l'image (optionnel)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Affichage erreurs upload image */}
                  {errors.uploadImage && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {errors.uploadImage}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mode URL Image */}
            {imageMode === 'url' && (
              <div className="bg-white rounded-lg p-4 mb-4">
                <h4 className="font-medium mb-3 text-green-900">Add image from URL</h4>
                <div className="space-y-3">
                  <div>
                    <input
                      type="url"
                      value={currentImage.url}
                      onChange={(e) => setCurrentImage(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.imageUrl ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.imageUrl && <p className="text-red-500 text-sm mt-1">{errors.imageUrl}</p>}
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      value={currentImage.alt}
                      onChange={(e) => setCurrentImage(prev => ({ ...prev, alt: e.target.value }))}
                      placeholder="Image description (optional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={addImage}
                    disabled={!currentImage.url.trim()}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md transition-colors duration-200 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Image
                  </button>
                </div>
              </div>
            )}

            {/* Affichage des images */}
            {formData.images.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 text-green-900">
                  Added Images ({formData.images.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="bg-white border rounded-lg overflow-hidden shadow-sm">
                      <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                        <img
                          src={image.url}
                          alt={image.alt || `Image ${index + 1}`}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                            e.target.className = 'w-full h-32 object-cover opacity-50';
                          }}
                        />
                      </div>
                      
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {image.alt || `Image ${index + 1}`}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {image.url}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                            {image.isUploaded ? 'Uploaded' : 'URL'}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Remove image"
                          >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          

          {/* Message si aucun média */}
         

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create service
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateServiceForm;