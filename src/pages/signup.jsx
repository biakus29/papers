import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import "./assets/css/Login.css"; // Assurez-vous de créer ce fichier pour les styles
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const Signup = () => {
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const googleProvider = new GoogleAuthProvider();
  const facebookProvider = new FacebookAuthProvider();

  // Validation des entrées du formulaire
  const validate = () => {
    const newErrors = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = "Le nom d'utilisateur est requis.";
    }

    if (!formData.email) {
      newErrors.email = "L'adresse e-mail est requise.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "L'adresse e-mail est invalide.";
    }

    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Veuillez confirmer votre mot de passe.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
    }

    return newErrors;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrors({
      ...errors,
      [e.target.name]: "",
    });
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      await updateProfile(result.user, {
        displayName: formData.displayName,
      });

      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        name: formData.displayName,
        email: result.user.email,
        image: result.user.photoURL || "",
        isConnected: true,
        biblio: [],
        favorites: [],
        downloaded: [],
        createdAt: new Date(),
      });

      navigate("./Homes.jsx");
    } catch (error) {
      console.error("Erreur lors de l'inscription :", error);
      handleAuthErrors(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsSubmitting(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);

      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        name: result.user.displayName || "Utilisateur",
        email: result.user.email,
        image: result.user.photoURL || "",
        isConnected: true,
        biblio: [],
        favorites: [],
        downloaded: [],
        createdAt: new Date(),
      });

      navigate("./Homes.jsx");
    } catch (error) {
      console.error("Erreur lors de l'inscription avec Google :", error);
      handleAuthErrors(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFacebookSignup = async () => {
    setIsSubmitting(true);
    try {
      const result = await signInWithPopup(auth, facebookProvider);

      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        name: result.user.displayName || "Utilisateur",
        email: result.user.email,
        image: result.user.photoURL || "",
        isConnected: true,
        biblio: [],
        favorites: [],
        downloaded: [],
        createdAt: new Date(),
      });

      navigate("/home");
    } catch (error) {
      console.error("Erreur lors de l'inscription avec Facebook :", error);
      handleAuthErrors(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthErrors = (error) => {
    switch (error.code) {
      case "auth/email-already-in-use":
        setErrors({ email: "Cette adresse e-mail est déjà utilisée." });
        break;
      case "auth/invalid-email":
        setErrors({ email: "Cette adresse e-mail est invalide." });
        break;
      case "auth/weak-password":
        setErrors({ password: "Le mot de passe est trop faible." });
        break;
      default:
        setErrors({ general: "Une erreur est survenue. Veuillez réessayer plus tard." });
        break;
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-form">
        <h2>Créer un compte</h2>
        {errors.general && <p className="error-message">{errors.general}</p>}
        <form onSubmit={handleEmailSignup} noValidate>
          <div className="form-group">
            <label htmlFor="displayName">Nom d'utilisateur</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="Entrez votre nom d'utilisateur"
              className={errors.displayName ? "input-error" : ""}
            />
            {errors.displayName && <span className="error-text">{errors.displayName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Adresse e-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Entrez votre adresse e-mail"
              className={errors.email ? "input-error" : ""}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Entrez votre mot de passe"
              className={errors.password ? "input-error" : ""}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirmez votre mot de passe"
              className={errors.confirmPassword ? "input-error" : ""}
            />
            {errors.confirmPassword && (
              <span className="error-text">{errors.confirmPassword}</span>
            )}
          </div>

          <button type="submit" className="signup-button" disabled={isSubmitting}>
            {isSubmitting ? (
              <AiOutlineLoading3Quarters className="loading-icon" />
            ) : (
              "S'inscrire"
            )}
          </button>
        </form>

        <div className="divider">
          <span>OU</span>
        </div>

        <button
          className="google-button"
          onClick={handleGoogleSignup}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <AiOutlineLoading3Quarters className="loading-icon" />
          ) : (
            "S'inscrire avec Google"
          )}
        </button>

        <button
          className="facebook-button"
          onClick={handleFacebookSignup}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <AiOutlineLoading3Quarters className="loading-icon" />
          ) : (
            "S'inscrire avec Facebook"
          )}
        </button>

        <p className="redirect-login">
          Vous avez déjà un compte ? <Link to="./login.jsx">Connectez-vous</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
