import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Button, TextField } from '@material-ui/core';
import { auth, googleProvider } from '../firebase'; // Assurez-vous que googleProvider est configuré dans firebase.js

const PrePurchasePage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const location = useLocation();
  const { book } = location.state || {}; // Récupérer les infos du livre depuis le state

  // Connexion via Google
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await auth.signInWithPopup(googleProvider);
      const user = result.user;
      
      // Rediriger vers la page de paiement
      history.push('/payment', { email: user.email, book });
    } catch (error) {
      console.error('Erreur de connexion Google : ', error);
      alert('Erreur lors de la connexion avec Google, veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Soumettre l'email pour la création d'un compte avec mot de passe aléatoire
  const handleNext = async () => {
    if (!email) {
      alert('Veuillez entrer une adresse e-mail valide.');
      return;
    }

    setLoading(true);

    // Création d'un mot de passe aléatoire
    const randomPassword = Math.random().toString(36).slice(-8);

    try {
      // Création de l'utilisateur en arrière-plan avec un mot de passe généré
      await auth.createUserWithEmailAndPassword(email, randomPassword);

      // Redirection vers la page de paiement avec les infos du livre
      history.push('/payment', { email, book });
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur : ', error);
      alert('Erreur lors de la création du compte, veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Vous êtes sur le point d'acheter le livre 📙 {book.name}</h2>
      <TextField
        label="Adresse E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
        required
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleNext}
        disabled={loading}
        fullWidth
      >
        {loading ? 'Chargement...' : 'Suivant'}
      </Button>
      <div style={{ marginTop: '20px' }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleGoogleLogin}
          disabled={loading}
          fullWidth
        >
          {loading ? 'Chargement...' : 'Se connecter avec Google'}
        </Button>
      </div>
    </div>
  );
};

export default PrePurchasePage;
