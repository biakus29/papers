import React, { useEffect, useState } from "react";
import { getFirestore, doc, updateDoc, arrayUnion, increment, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const SuccessPage = () => {
  const [isLoading, setIsLoading] = useState(true);

  const processPurchaseAndUpdateDB = async (venteData) => {
    try {
      // Conversion du prix en nombre
      const prix = parseFloat(venteData.prix);

      // Met à jour la collection users : ajout du livre dans "buyed"
      const userRef = doc(db, `users/${venteData.user}`);
      await updateDoc(userRef, {
        buyed: arrayUnion(venteData.livre),
      });
      console.log("✔ Livre ajouté dans la collection users.");

      // Met à jour la collection auteurs : incrémente le champ "solde"
      const auteurRef = doc(db, `auteurs/${venteData.auteur}`);
      await updateDoc(auteurRef, {
        solde: increment(prix),
      });
      console.log("✔ Solde de l'auteur mis à jour.");
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la base de données :", error);
    }
  };

  const updateSuccessState = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const venteId = urlParams.get("venteId");

      if (!venteId) {
        console.error("ID de vente manquant dans l'URL.");
        return;
      }

      const venteRef = doc(db, `ventes_direct/${venteId}`);
      const venteDoc = await getDoc(venteRef);

      if (venteDoc.exists()) {
        const venteData = venteDoc.data();

        // Vérifie si l'état est "en cours" avant de passer à "reussi"
        if (venteData.etat === "en cours") {
          await updateDoc(venteRef, { etat: "reussi" });
          console.log("✔ État de la vente mis à jour.");
          await processPurchaseAndUpdateDB(venteData);
        }
      } else {
        console.error("Document de vente introuvable !");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'état :", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    updateSuccessState();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 p-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-lg p-8 text-center">
        <h1 className="text-4xl font-extrabold text-green-600 mb-6">Paiement Réussi</h1>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center">
            <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <p className="text-lg text-gray-700">Mise à jour en cours...</p>
          </div>
        ) : (
          <p className="text-lg text-gray-700 mb-6">
            Votre paiement a été validé. Merci pour votre achat !
          </p>
        )}
        <a
          href="/"
          className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300"
        >
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
};

export default SuccessPage;
