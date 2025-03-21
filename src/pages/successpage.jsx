import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, arrayUnion, increment, getDoc } from "firebase/firestore";
import { firebaseConfig } from "../firebase";

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SuccessPage = () => {
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // Fonction pour afficher un message
  const showMessage = (msg, error = false) => {
    setMessage(msg);
    setIsError(error);
  };

  // Mise à jour du document utilisateur et du solde de l'auteur
  const processPurchaseAndUpdateDB = async (venteData) => {
    try {
      const userRef = doc(db, `users/${venteData.user}`);
      await updateDoc(userRef, {
        buyed: arrayUnion(venteData.livre),
      });
      console.log("✔ Document utilisateur mis à jour avec le livre acheté.");
      showMessage("Document utilisateur mis à jour avec succès.");

      const auteurRef = doc(db, `auteurs/${venteData.auteur}`);
      await updateDoc(auteurRef, {
        balance: increment(venteData.prix),
      });
      console.log("✔ Solde de l'auteur mis à jour avec succès.");
      showMessage("Solde de l'auteur mis à jour avec succès.");

      const authorDoc = await getDoc(auteurRef);
      const authorData = authorDoc.data();
      const newBalance = authorData.balance;

      const transaction = {
        amount: venteData.prix,
        balance: newBalance,
        date: new Date().toISOString(),
        type: "deposit",
      };

      await updateDoc(auteurRef, {
        transactions: arrayUnion(transaction),
      });
      console.log("✔ Transaction ajoutée avec succès.");
      showMessage("Transaction ajoutée avec succès.");
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la base de données :", error);
      showMessage("Erreur lors de la mise à jour de la base de données.", true);
    }
  };

  // Fonction principale pour récupérer la vente, mettre à jour son état et appeler processPurchaseAndUpdateDB
  const updateSuccessState = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const venteId = urlParams.get("venteId");

      if (!venteId) {
        showMessage("ID de vente manquant dans l'URL.", true);
        throw new Error("ID de vente manquant");
      }

      const venteRef = doc(db, `ventes_direct/${venteId}`);
      const venteDoc = await getDoc(venteRef);

      if (venteDoc.exists()) {
        const venteData = venteDoc.data();
        console.log("✔ Document de vente récupéré avec succès.");

        if (venteData.etat === "reussi") {
          showMessage("Cette vente a déjà été traitée avec succès.");
          return;
        }

        await updateDoc(venteRef, { etat: "reussi" });
        console.log("✔ État de la vente mis à jour à 'reussi'.");
        showMessage("État de la vente mis à jour à 'reussi'.");

        await processPurchaseAndUpdateDB(venteData);
        showMessage("Paiement réussi et toutes les mises à jour ont été effectuées !");
      } else {
        console.error("Document de vente introuvable !");
        showMessage("Document de vente introuvable !", true);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'état :", error);
      showMessage("Erreur lors de la mise à jour de la base de données. Veuillez contacter le support.", true);
    }
  };

  // Exécuter la logique de mise à jour dès le chargement du composant
  useEffect(() => {
    updateSuccessState();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 p-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-lg p-6 text-center">
        <h1 className="text-4xl font-extrabold text-green-600 mb-4">Paiement Réussi</h1>
        <p className="text-lg text-gray-700 mb-6">
          Votre paiement a été validé. Merci pour votre achat !
        </p>
        {message && (
          <p className={`text-lg mb-6 ${isError ? "text-red-600" : "text-green-600"}`}>
            {message}
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
