import React from 'react';

const TermsOfService = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Conditions d'Utilisation</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="prose max-w-none">
          <h2 className="text-xl font-semibold mb-4">1. Acceptation des conditions</h2>
          <p className="mb-4">
            En utilisant PhotoBook, vous acceptez ces conditions d'utilisation.
          </p>
          
          <h2 className="text-xl font-semibold mb-4">2. Utilisation du service</h2>
          <p className="mb-4">
            PhotoBook est une plateforme de réservation de services photographiques.
          </p>
          
          <h2 className="text-xl font-semibold mb-4">3. Responsabilités</h2>
          <p className="mb-4">
            Les utilisateurs sont responsables de leurs réservations et paiements.
          </p>
          
          <p className="text-gray-500 text-sm mt-8">
            Dernière mise à jour: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;