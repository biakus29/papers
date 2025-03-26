import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Button, ListGroup, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { FaUserCircle } from 'react-icons/fa';
import StarRating from 'react-star-rating-component';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc, // Ajout de getDoc
  collection,
  getDocs,
  updateDoc,
  arrayUnion,
  Timestamp,
  addDoc, // Ajout de addDoc
  increment,
  query,
  where,
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth';
import axios from 'axios';
import { Star, Users, Bookmark, Share, Download } from 'react-feather';
import './assets/css/details.css';
import logo from './assets/images/logo.png';

const BookDetails = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const db = getFirestore();
  const auth = getAuth();

  const [loading, setLoading] = useState(true);
  const [bookDetails, setBookDetails] = useState(null);
  const [authorInfo, setAuthorInfo] = useState({});
  const [reviews, setReviews] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [rating, setRating] = useState(1);
  const [reviewText, setReviewText] = useState('');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullAuthorBio, setShowFullAuthorBio] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [error, setError] = useState(null);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [caracteristiques, setCaracteristiques] = useState({
    annee: null,
    edition: "",
    format: "",
    nbr_pages: null
  });
  const [isPurchased, setIsPurchased] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  useEffect(() => {
    const fetchBookDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const livresRef = collection(db, 'livres');
        const q = query(livresRef, where('id', '==', bookId));
        const querySnapshot = await getDocs(q);
  
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const bookData = docSnap.data();
          console.log("Données du livre récupérées :", bookData); // Vérifiez les données ici
          setBookDetails(bookData);
  
          // Mettre à jour les caractéristiques du livre
          if (bookData.caracteristiques) {
            setCaracteristiques({
              annee: bookData.caracteristiques.annee || "Non spécifiée",
              edition: bookData.caracteristiques.edition || "Non spécifiée",
              format: bookData.caracteristiques.format || "Non spécifié",
              nbr_pages: bookData.caracteristiques.nbr_pages || "Non spécifié",
            });
          } else {
            console.warn("Aucune caractéristique trouvée dans les données du livre.");
          }
  
          setEpisodes(await fetchEpisodes(bookId));
          setAuthorInfo(await fetchAuthorInfo(bookData.hauteur));
          setIsFavorite(await checkFavorite(bookData.name));
  
          const user = auth.currentUser;
          if (user) {
            const purchased = await checkBookInUserPurchasedBooks(user.uid, bookData.id);
            setIsPurchased(purchased);
          }
        } else {
          setBookDetails(null);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des détails du livre :', error);
        setError('Erreur lors de la récupération des détails du livre.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchBookDetails();
  }, [bookId]);

  const checkBookInUserPurchasedBooks = async (userId, bookId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      return userSnap.exists() && userSnap.data().buyed?.includes(bookId);
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'achat :', error);
      return false;
    }
  };

  const handleBuyBook = async () => {
    const user = auth.currentUser;

    if (!user) {
      setShowPurchaseModal(true);
      return;
    }

    try {
      await BuyBook(bookDetails);
      alert("Achat réussi !");
    } catch (error) {
      console.error("Erreur lors de l'achat : ", error);
      alert("Une erreur s'est produite lors de l'achat. Veuillez réessayer.");
    }
  };

  const fetchEpisodes = async (bookId) => {
    const episodesRef = collection(db, 'livres', bookId, 'episodes');
    const episodesSnapshot = await getDocs(episodesRef);
    return episodesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  const fetchAuthorInfo = async (authorId) => {
    try {
      const authorRef = doc(db, 'auteurs', authorId);
      const authorSnap = await getDoc(authorRef);
      if (authorSnap.exists()) {
        return {
          ...authorSnap.data(),
          photoUrl: authorSnap.data().photo || '',
        };
      } else {
        return { bio: 'Biographie non disponible.', photoUrl: '', metier: 'Inconnu' };
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des informations de l\'auteur :', error);
      return { bio: 'Erreur lors de la récupération des informations de l\'auteur.', photoUrl: '', metier: 'Inconnu' };
    }
  };

  const checkFavorite = async (bookName) => {
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      return userSnap.exists() && userSnap.data().favorites?.includes(bookName);
    }
    return false;
  };

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const bookDoc = doc(db, 'livres', bookId);
        const bookSnapshot = await getDoc(bookDoc);

        if (bookSnapshot.exists()) {
          const bookData = bookSnapshot.data();
          setReviews(bookData.revues || []);
        } else {
          console.log('Livre non trouvé');
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des avis : ", error);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [bookId, db]);

  const handleFavoriteToggle = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !bookDetails) return;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const updatedFavorites = isFavorite
        ? userSnap.data().favorites.filter(name => name !== bookDetails.name)
        : [...(userSnap.data().favorites || []), bookDetails.name];

      await updateDoc(userRef, { favorites: updatedFavorites });
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de favori :', error);
      setError('Erreur lors de la mise à jour des favoris.');
    }
  };

  const handleRatingSubmit = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !bookDetails) return;

      const newReview = {
        user_name: user.displayName || 'Utilisateur',
        note: rating,
        avis: reviewText,
        date: new Date()
      };

      const bookRef = doc(db, 'livres', bookId);
      const bookSnap = await getDoc(bookRef);
      const updatedReviews = [...(bookSnap.data().revues || []), newReview];

      await updateDoc(bookRef, { revues: updatedReviews });
      setReviews(updatedReviews);
      setRatingModalVisible(false);
      setRating(1);
      setReviewText('');
    } catch (error) {
      console.error('Erreur lors de la soumission de l\'avis :', error);
      setError('Erreur lors de la soumission de l\'avis.');
    }
  };

  const calculateAverageNote = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.note, 0);
    return (total / reviews.length).toFixed(1);
  };

  const averageNote = calculateAverageNote(reviews);

  const handleShare = () => {
    if (bookDetails) {
      navigator.clipboard.writeText(`Découvrez ce livre : ${bookDetails.name} - ${bookDetails.coverUrl}`);
      alert('Les détails du livre ont été copiés dans le presse-papiers !');
    }
  };

 const BuyBook = async (book) => {
  const auth = getAuth();
  let user = auth.currentUser;

  // 1. Gestion de l'authentification
  if (!user) {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      user = result.user;
      
      if (!user) {
        throw new Error("Connexion échouée");
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      throw new Error("Veuillez vous connecter pour acheter");
    }
  }

  try {
    // 2. Préparation des paramètres
    const bookId = encodeURIComponent(book.id);
    const userId = encodeURIComponent(user.uid);

    // 3. Construction du FormData
    const formData = new FormData();
    formData.append('email',"papers@seeds.cm");
    formData.append('token_app', '4fda55961a3152c09d67ede0d8ae2be9');
    formData.append('montant', book.price.toString());
    formData.append('image_link', book.coverUrl);
    formData.append('description', `Achat: ${book.name}`);
    formData.append('pass', 'My$S3cr3t$Pap3rs'); // À sécuriser en production
    formData.append('success_lien', `https://papersweb.vercel.app/success/${bookId}/${userId}`);
    formData.append('echec_lien', 'https://papers.seeds.cm/payementspage/echec.html');
    formData.append('code_produit', book.id);
    formData.append('nom_produit', book.name);

    // 4. Envoi de la requête
    const response = await axios.post(
      'https://www.flash.seeds.cm/flash/Service/set_payment_link',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    // 5. Traitement de la réponse
    if (response.data?.body?.lien_paiement) {
      const paymentUrl = response.data.body.lien_paiement;
      window.location.href = `https://flashsdk.seeds.cm/flash_checkout.html?d=${btoa(paymentUrl)}`;
    } else {
      throw new Error("Réponse inattendue du serveur de paiement");
    }

  } catch (error) {
    console.error("Erreur de paiement:", error);
    throw new Error(error.response?.data?.message || "Échec du processus de paiement");
  }
};

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src={logo} className="logo" alt="logo" />
          <Spinner animation="border" variant="primary" style={{ marginTop: 11 }} />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="text-center mt-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => navigate('./homes')}>Retour à l'accueil</Button>
      </Container>
    );
  }

  return (
    <Container className="" style={{ padding: 0 }}>
      <div style={{ padding: 16, backgroundColor: '#0cc0df', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        <img src={bookDetails.coverUrl} alt="Couverture du livre" style={{ width: '50%', height: '300px', borderRadius: 10 }} />
        <div style={{ justifyContent: 'center', marginLeft: 8 }}>
          <p style={{ color: '#096d98', fontWeight: 'bold', width: 140, fontSize: 11 }}>{bookDetails.genre}</p>
          <p style={{ fontSize: 20, fontWeight: 'bold', color: 'white', width: 120, marginVertical: 8, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {bookDetails.name}
          </p>
          <p style={{ width: 150, fontWeight: 'regular', color: 'white', fontSize: 14 }}>{bookDetails.small_summary}</p>
          <div style={{ display: 'flex', flexDirection: 'row', marginVertical: 16, alignItems: 'center' }}>
            <Star color='yellow' size={8} />
            <p style={{ marginLeft: 4, fontSize: 8, marginTop: 15 }}>{averageNote}</p>
            <Users color='white' size={8} style={{ marginLeft: 4 }} />
            <p style={{ marginLeft: 4, fontSize: 8, marginTop: 15 }}>{reviews.length}</p>
            <Button variant="" style={{ height: 8, fontSize: 8, marginLeft: 8, display: 'flex', justifyContent: 'center', backgroundColor: 'white' }} onClick={() => setRatingModalVisible(true)}> <p style={{ marginTop: -8 }}>evaluer</p> </Button>
          </div>
          <p style={{ width: 140, fontWeight: 'bold', color: 'white', marginTop: 5 }} numberOfLines={2}>par {authorInfo.NomPrenom}</p>
        </div>
        <div style={{ alignItems: 'center' }}>
          <Share size={18} color={"#fff"} />
          <Download size={18} color={"#fff"} />
          <Bookmark size={18} color={"#fff"} />
        </div>
      </div>

      <div style={{ borderBottom: '6px solid lightgray', borderBottomColor: '#f9f9f9', display: "flex", justifyContent: 'space-between', padding: 16, alignItems: 'center' }}>
        <div>
          <p>Paiement unique</p>
          <p style={{ fontSize: 28, marginTop: -15 }}>{bookDetails.price} <span style={{ fontSize: 14 }}>FCFA</span></p>
        </div>
        <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
  {/* Container des logos */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "5px 10px",
      // borderRadius: "8px",
      // border: "1px solid #ddd",
      backgroundColor: "white",
      // boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      height: "40px" // Hauteur fixe pour aligner avec le bouton
    }}
  >
    <img
      src="https://1000logos.net/wp-content/uploads/2021/02/Orange-Money-emblem.png"
      style={{ height: "20px", width: "auto" }}
      alt="Orange Money"
    />
    <img
      src="https://www.kindpng.com/picc/m/151-1514348_mtn-momo-logo-mobile-money-logo-png-transparent.png"
      style={{ height: "20px", width: "auto" }}
      alt="MTN Mobile Money"
    />
  </div>

  {/* Bouton principal */}
  <Button
    style={{
      backgroundColor: isPurchased ? "#007bff" : "#12c066",
      color: "white",
      border: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "10px 20px",
      borderRadius: "8px",
      fontWeight: "bold",
      height: "40px" // Hauteur identique au container des logos
    }}
    onClick={async () => {
      if (isPurchased) {
        window.location.href = `https://play.google.com/store/apps/details?id=com.seedsoftengine.papers&pcampaignid=web_share`;
      } else {
        try {
          await BuyBook(bookDetails);
        } catch (error) {
          console.error("Erreur lors de l'appel à BuyBook :", error);
        }
      }
    }}
    aria-label={isPurchased ? "Lire le livre" : "Obtenir le livre"}
  >
    {isPurchased ? "Lire" : "OBTENIR"}
  </Button>
</div>

        </div>
      </div>

      <div style={{ borderBottom: '6px solid lightgray', borderBottomColor: '#f9f9f9', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 24, fontWeight: "bold" }}>séries</p>
          <Button style={{ color: '#0cc0df', border: 'none' }} variant="" onClick={() => setShowEpisodes(!showEpisodes)}>
            {showEpisodes ? 'Masquer les épisodes' : 'Afficher les épisodes'}
          </Button>
        </div>

        {showEpisodes && (
          <ListGroup className="mt-2">
            {bookDetails.episodes.map((episode, index) => (
              <ListGroup.Item key={index}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, display: 'flex' }}>
                    <p>#{index + 1} </p>
                    <img
                      src={episode.image}
                      alt={`Épisode ${index + 1}`}
                      className="img-fluid"
                      style={{ width: 38, height: 48, borderColor: 'lightgray', borderWidth: 0.7, marginLeft: 8 }}
                    />
                    <div style={{ marginLeft: 16 }}>
                      <h5 style={{ fontSize: 16, fontWeight: 'bold' }}>{episode.titre}</h5>
                      <p style={{ fontSize: 14, width: 100 }}>{episode.description}</p>
                    </div>
                  </div>
                  <p style={{ marginRight: 'auto', marginTop: 40, fontSize: 8 }}><small>{new Date(episode.date).toLocaleDateString()}</small></p>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </div>

      <div style={{ borderBottom: '6px solid lightgray', borderBottomColor: '#f9f9f9', padding: 16 }}>
        <p style={{ fontSize: 24, fontWeight: "bold" }}>Description</p>
        {showFullDescription ? bookDetails.summary : `${bookDetails.summary?.substring(0, 150)}...`}
        <br />
        <Button
          onClick={() => setShowFullDescription(!showFullDescription)}
          className="mb-3"
        >
          {showFullDescription ? 'Voir moins' : 'Voir plus'}
        </Button>
      </div>

      <div style={{ borderBottom: '6px solid lightgray', borderBottomColor: '#f9f9f9', padding: 16 }}>
        <p style={{ fontSize: 24, fontWeight: 'bold' }}>Caractéristiques et détails</p>
        <div>
          <p><strong>Année :</strong> {caracteristiques.annee}</p>
          <p><strong>Édition :</strong> {caracteristiques.edition}</p>
          <p><strong>Format :</strong> {caracteristiques.format}</p>
          <p><strong>Nombre de pages :</strong> {caracteristiques.nbr_pages}</p>
        </div>
      </div>

      <div style={{ borderBottom: '6px solid lightgray', borderBottomColor: '#f9f9f9', justifyContent: 'space-between', padding: 16, alignItems: 'center' }}>
        <p style={{ fontSize: 24, fontWeight: "bold" }}>Auteur</p>
        <div style={{ display: 'flex', padding: 8, backgroundColor: '#132d59', width: '100%' }}>
          <img
            src={authorInfo.photoUrl || 'https://www.gravatar.com/avatar/?d=mp'}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://www.gravatar.com/avatar/?d=mp';
            }}
            alt="User Avatar"
            style={{
              width: 48,
              height: 48,
              borderColor: 'lightgray',
              borderWidth: 0.7,
              borderRadius: 50,
            }}
          />
          <div style={{ marginLeft: 8 }}>
            <p style={{ fontSize: 14, fontWeight: 'bold', color: 'white' }}>{authorInfo.NomPrenom}</p>
            <p style={{ fontSize: 10, color: 'white', marginTop: -10 }}>{authorInfo.Metier}</p>
          </div>
        </div>
        <p>{authorInfo.bio}</p>
        <Button variant="outline-primary" onClick={() => setShowFullAuthorBio(!showFullAuthorBio)}>
          {showFullAuthorBio ? 'Lire moins' : 'Lire plus'}
        </Button>
      </div>

      <div style={{ borderBottom: '6px solid lightgray', borderBottomColor: '#f9f9f9', justifyContent: 'space-between', padding: 16, alignItems: 'center' }}>
        <h3>Avis</h3>
        {loadingReviews ? (
          <Spinner animation="border" />
        ) : (
          <ListGroup>
            {reviews.length === 0 ? (
              <ListGroup.Item className="text-center">Aucun avis disponible.</ListGroup.Item>
            ) : (
              reviews.map((review, index) => (
                <ListGroup.Item key={index} className="mb-4 p-3 shadow-sm border rounded">
                  <div className="d-flex align-items-center">
                    {review.user_img ? (
                      <img
                        src={review.user_img}
                        alt={review.user_name}
                        className="rounded-circle me-2"
                        style={{ width: '40px', height: '40px' }}
                      />
                    ) : (
                      <FaUserCircle className="me-2" style={{ fontSize: '40px', color: '#ccc' }} />
                    )}
                    <div>
                      <h5 className="mb-1">{review.user_name}</h5>
                      <StarRating
                        name={`review-${index}`}
                        starCount={5}
                        value={review.note}
                        editing={false}
                        starColor="#FFD700"
                        emptyStarColor="#DCDCDC"
                      />
                      <p className="mt-1">{review.avis}</p>
                      <small className="text-muted">Publié le {new Date(review.date).toLocaleDateString()}</small>
                    </div>
                  </div>
                </ListGroup.Item>
              ))
            )}
          </ListGroup>
        )}
      </div>

      <Modal show={ratingModalVisible} onHide={() => setRatingModalVisible(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Évaluer le livre</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <StarRating
            name="rating"
            starCount={5}
            value={rating}
            onStarClick={(nextValue) => setRating(nextValue)}
            starColor="#FFD700"
            emptyStarColor="#DCDCDC"
          />
          <Form.Group controlId="reviewText" className="mt-3">
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Écrivez votre avis ici..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setRatingModalVisible(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleRatingSubmit}>Soumettre</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default BookDetails;