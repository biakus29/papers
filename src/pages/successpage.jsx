import React, { useEffect, useState } from "react";
import { doc, updateDoc, getDoc, increment, arrayUnion } from "firebase/firestore";
import { db } from "../firebase"; // Assurez-vous que ce fichier exporte `db`
import { useNavigate } from "react-router-dom"; // Pour la redirection

const SuccessPage = () => {
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // État de chargement
  const navigate = useNavigate(); // Hook pour la navigation

  // Fonction pour afficher un message
  const showMessage = (msg, error = false) => {
    setMessage(msg);
    setIsError(error);
  };

  // Fonction pour mettre à jour la base de données
  const updateSuccessState = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const venteId = urlParams.get("venteId");

      if (!venteId) {
        showMessage("ID de vente manquant dans l'URL.", true);
        throw new Error("ID de vente manquant");
      }

      const venteRef = doc(db, "ventes_direct", venteId);
      const venteDoc = await getDoc(venteRef);

      if (!venteDoc.exists()) {
        showMessage("Document de vente introuvable !", true);
        throw new Error("Document de vente introuvable");
      }

      const venteData = venteDoc.data();
      showMessage("Document de vente récupéré avec succès.");

      // Mise à jour de l'état de la vente vers "reussi"
      await updateDoc(venteRef, { etat: "reussi" });
      showMessage("État de la vente mis à jour à 'reussi'.");

      // Mise à jour du document utilisateur
      const userRef = doc(db, "users", venteData.user);
      await updateDoc(userRef, {
        buyed: arrayUnion(venteData.livre),
      });
      showMessage("Document utilisateur mis à jour avec succès.");

      // Mise à jour du solde de l'auteur
      const auteurRef = doc(db, "auteurs", venteData.auteur);
      await updateDoc(auteurRef, {
        balance: increment(venteData.prix),
      });
      showMessage("Solde de l'auteur mis à jour avec succès.");

      showMessage("Paiement réussi et toutes les mises à jour ont été effectuées !");

      // Redirection vers la page d'accueil après 5 secondes
      setTimeout(() => {
        navigate("/");
      }, 5000);
    } catch (error) {
      console.error("Erreur :", error);
      showMessage("Erreur lors de la mise à jour de la base de données. Veuillez contacter le support.", true);
    } finally {
      setIsLoading(false); // Arrêter le chargement
    }
  };

  // Exécuter la logique de mise à jour dès le chargement du composant
  useEffect(() => {
    updateSuccessState();
  }, []);

  // Styles en ligne
  const styles = {
    container: {
      fontFamily: "Arial, sans-serif",
      backgroundColor: "#f9f9f9",
      color: "#333",
      textAlign: "center",
      margin: 0,
      padding: 0,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
    },
    heading: {
      color: "#28a745",
      fontSize: "2.5em",
      marginBottom: "0.5em",
    },
    text: {
      fontSize: "1.2em",
      margin: "0.5em 0",
    },
    message: {
      marginTop: "1em",
      fontSize: "1.1em",
      color: isError ? "#dc3545" : "#28a745", // Couleur dynamique en fonction de l'état
    },
    button: {
      display: "inline-block",
      marginTop: "1.5em",
      padding: "0.8em 1.5em",
      fontSize: "1em",
      color: "white",
      backgroundColor: "#007bff",
      border: "none",
      borderRadius: "5px",
      textDecoration: "none",
      cursor: "pointer",
    },
    spinner: {
      border: "4px solid rgba(0, 0, 0, 0.1)",
      borderLeftColor: "#007bff",
      borderRadius: "50%",
      width: "40px",
      height: "40px",
      animation: "spin 1s linear infinite",
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Paiement Réussi</h1>
      <p style={styles.text}>Votre paiement a été validé. Merci pour votre achat !</p>
      {isLoading ? (
        <div style={styles.spinner}></div> // Indicateur de chargement
      ) : (
        <p style={styles.message}>{message}</p>
      )}
      <a href="https://papersweb.seedsoftengine.com/" style={styles.button}>
        Retour à l'accueil
      </a>
    </div>
  );
};

export default SuccessPage;