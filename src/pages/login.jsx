import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa';
import { auth, provider, db } from '../firebase'; // Import de Firebase
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import './assets/css/Login.css'; // Import du style

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // Basculer entre connexion et inscription

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      // navigate('/homes'); // Redirection si utilisateur déjà connecté
    }
  }, [navigate]);

  // Fonction de connexion via Google
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userInfo = {
        uid: user.uid,
        uname: user.displayName,
        email: user.email,
        image: user.photoURL,
        buyed: [],
        biblio: [],
        favories: [],
        telecharge: [],
        isConnected: true,
      };

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, userInfo);
        console.log('Utilisateur enregistré dans Firestore.');
      }

      localStorage.setItem('user', JSON.stringify(userInfo));
      navigate('/homes');
    } catch (error) {
      console.error('Erreur de connexion Google :', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    }
  };

  // Fonction de connexion ou d'inscription par e-mail
  const handleEmailAuth = async () => {
    try {
      if (!email || !password) {
        alert('Veuillez remplir tous les champs.');
        return;
      }

      if (password.length < 6) {
        alert('Le mot de passe doit contenir au moins 6 caractères.');
        return;
      }

      if (isRegistering) {
        // Inscription
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;

        const userInfo = {
          uid: user.uid,
          uname: user.email.split('@')[0],
          email: user.email,
          image: '',
          buyed: [],
          biblio: [],
          favories: [],
          telecharge: [],
          isConnected: true,
        };

        await setDoc(doc(db, 'users', user.uid), userInfo);
        localStorage.setItem('user', JSON.stringify(userInfo));
        console.log('Utilisateur inscrit avec succès.');
        navigate('/homes');
      } else {
        // Connexion
        const result = await signInWithEmailAndPassword(auth, email, password);
        const user = result.user;

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userInfo = userSnap.data();
          localStorage.setItem('user', JSON.stringify(userInfo));
          console.log('Connexion réussie.');
          navigate('/homes');
        } else {
          console.error('Utilisateur introuvable dans Firestore.');
        }
      }
    } catch (error) {
      console.error('Erreur d\'authentification :', error);
      if (error.code === 'auth/user-not-found') {
        alert('Utilisateur introuvable. Veuillez vérifier vos informations.');
      } else if (error.code === 'auth/wrong-password') {
        alert('Mot de passe incorrect.');
      } else if (error.code === 'auth/email-already-in-use') {
        alert('Cette adresse e-mail est déjà utilisée.');
      } else if (error.code === 'auth/invalid-email') {
        alert('Adresse e-mail invalide.');
      } else {
        alert('Une erreur est survenue. Veuillez réessayer.');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="header">
        <img
          className="header-image"
          src={require('./assets/images/header.jpg')}
          alt="Header"
        />
        <div className="gradient-overlay"></div>
        <div className="header-content">
          <h1>Bienvenue sur Papers</h1>
          <div className="logo-container">
            <img
              className="logo"
              src={require('./assets/images/logo.png')}
              alt="Logo"
            />
          </div>
        </div>
      </div>

      <div className="form-container">
        <input
          type="email"
          className="input-field"
          placeholder="Adresse e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="input-field"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="auth-button" onClick={handleEmailAuth}>
          {isRegistering ? 'S\'inscrire' : 'Se connecter'}
        </button>
        <p
          className="toggle-text"
          onClick={() => setIsRegistering(!isRegistering)}
        >
          {isRegistering
            ? 'Déjà un compte ? Connectez-vous'
            : 'Pas encore de compte ? Inscrivez-vous'}
        </p>
        <div className="separator">ou</div>
        <button className="google-button" onClick={handleGoogleLogin}>
          <FaGoogle className="google-icon" />
          <span>Continuer avec Google</span>
        </button>
      </div>
    </div>
  );
};

export default Login;
