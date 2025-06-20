import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Politique de Confidentialité</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="prose max-w-none">
          <h2 className="text-xl font-semibold mb-4">1. Collecte des données</h2>
          <p className="mb-4">
            Nous collectons uniquement les données nécessaires au fonctionnement du service.
          </p>
          
          <h2 className="text-xl font-semibold mb-4">2. Utilisation des données</h2>
          <p className="mb-4">
            Vos données sont utilisées pour gérer vos réservations et améliorer nos services.
          </p>
          
          <h2 className="text-xl font-semibold mb-4">3. Protection des données</h2>
          <p className="mb-4">
            Nous mettons en place des mesures de sécurité pour protéger vos informations.
          </p>
          
          <p className="text-gray-500 text-sm mt-8">
            Dernière mise à jour: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;