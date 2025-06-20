// ===== ImageUpload.js =====
import React, { useState } from 'react';

const ImageUpload = ({ onImageUploaded, onError, disabled = false }) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // ✅ FONCTION D'UPLOAD SIMPLE
  const uploadImage = async (file) => {
    setUploading(true);
    
    try {
      console.log('📤 Uploading file:', file.name);

      const formData = new FormData();
      formData.append('image', file);
      formData.append('alt', file.name);

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
        console.log('✅ Upload successful:', result.data);
        onImageUploaded?.(result.data);
      } else {
        throw new Error(result.message || 'Erreur lors de l\'upload');
      }

    } catch (error) {
      console.error('❌ Upload error:', error);
      onError?.(error.message);
    } finally {
      setUploading(false);
    }
  };

  // ✅ GESTION DU CHANGEMENT DE FICHIER
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndUpload(file);
    }
  };

  // ✅ VALIDATION SIMPLE
  const validateAndUpload = (file) => {
    // Vérifier le type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      onError?.('Type de fichier non autorisé. Utilisez: JPG, PNG, GIF, WEBP');
      return;
    }

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      onError?.('Fichier trop volumineux. Maximum: 5MB');
      return;
    }

    uploadImage(file);
  };

  // ✅ DRAG & DROP SIMPLE
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full">
      {/* Zone de drop */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : disabled
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-sm text-blue-600">Upload en cours...</p>
          </div>
        ) : (
          <div>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-500 font-medium">
                  Cliquez pour choisir un fichier
                </span>
                <span className="text-gray-500"> ou glissez-déposez</span>
              </label>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                disabled={disabled || uploading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              PNG, JPG, GIF, WEBP jusqu'à 5MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;