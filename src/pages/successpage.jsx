import React, { useEffect, useState } from "react";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, arrayUnion, increment, addDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Timestamp } from "firebase/firestore"; 
import { useNavigate } from "react-router-dom";
import { CheckCircleIcon, ExclamationCircleIcon, ClockIcon, ArrowRightIcon, BookOpenIcon } from "@heroicons/react/24/outline";

const SuccessPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseStatus, setPurchaseStatus] = useState(null);
  const navigate = useNavigate();

  const processPurchaseAndUpdateDB = async (bookData) => {
    // ... (keep your existing processPurchaseAndUpdateDB implementation)
  };

  const handleSuccessfulPurchase = async () => {
    // ... (keep your existing handleSuccessfulPurchase implementation)
  };

  useEffect(() => {
    handleSuccessfulPurchase();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          <h3 className="text-lg font-medium text-gray-700">Traitement en cours</h3>
          <p className="text-gray-500">Veuillez patienter pendant que nous validons votre achat...</p>
        </div>
      );
    }

    switch (purchaseStatus) {
      case "success":
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <CheckCircleIcon className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Paiement confirmé !</h2>
            <p className="mt-2 text-gray-600">Votre achat a été enregistré avec succès.</p>
            
            <div className="mt-8 space-y-4">
              <button
                onClick={() => navigate("/bibliotheque")}
                className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Accéder à ma bibliothèque
                <BookOpenIcon className="ml-2 h-5 w-5" />
              </button>
              
              <button
                onClick={() => navigate("/")}
                className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Retour à l'accueil
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        );
      case "no_pending":
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
              <ExclamationCircleIcon className="h-10 w-10 text-yellow-600" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Aucun achat en attente</h2>
            <p className="mt-2 text-gray-600">Votre paiement a été accepté mais aucun achat n'était en attente.</p>
            <button
              onClick={() => navigate("/contact")}
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Contacter le support
            </button>
          </div>
        );
      case "error":
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
              <ExclamationCircleIcon className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Erreur de traitement</h2>
            <p className="mt-2 text-gray-600">Votre paiement a été accepté mais une erreur est survenue.</p>
            <div className="mt-6 bg-red-50 p-4 rounded-md">
              <p className="text-sm text-red-700">Veuillez contacter notre support avec votre référence de paiement.</p>
            </div>
            <button
              onClick={() => navigate("/contact")}
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Support technique
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Confirmation de paiement
          </h1>
        </div>
        
        <div className="mt-8">
          {renderContent()}
        </div>
        
        <div className="mt-8 pt-5 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            En cas de problème, contactez-nous à support@votreapp.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;