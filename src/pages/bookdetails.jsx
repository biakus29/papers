import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Card, Modal, Form, ListGroup, Spinner, Alert } from 'react-bootstrap';
import { FaStar, FaHeart, FaDownload, FaUserCircle } from 'react-icons/fa';
import { AiOutlineShareAlt } from 'react-icons/ai';
import StarRating from 'react-star-rating-component';
import { getFirestore, doc,setDoc,getDoc, collection, getDocs, updateDoc, arrayUnion,Timestamp,addDoc,increment,query,where } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, updateProfile } from "firebase/auth";
import './assets/css/details.css';
import logo from './assets/images/logo.png';
import axios from 'axios';
import { Home, Compass, Bookmark,Star,Users,Share,Download  } from 'react-feather'

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
  
  
  const [isPurchased, setIsPurchased] = useState(false); // État pour vérifier si le livre a été acheté
  const [showPurchaseModal, setShowPurchaseModal] = useState(false); // Pour afficher la modal si l'utilisateur n'est pas connecté


  useEffect(() => {
    const fetchBookDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            // Récupérer les détails du livre en filtrant sur l'attribut "id"
            const livresRef = collection(db, 'livres');
            const q = query(livresRef, where('id', '==', bookId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const docSnap = querySnapshot.docs[0]; // Prend le premier résultat
                const bookData = docSnap.data();
                setBookDetails(bookData);

                // Charger les autres informations du livre (épisodes, auteur, favoris)
                setEpisodes(await fetchEpisodes(bookId));
                setAuthorInfo(await fetchAuthorInfo(bookData.hauteur));
                setIsFavorite(await checkFavorite(bookData.name));

                // Vérifier si le livre a été acheté
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

  
  

  // Fonction pour vérifier si le livre est acheté par l'utilisateur
  const checkBookInUserPurchasedBooks = async (userId, bookId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      return userSnap.exists() && userSnap.data().buyed?.includes(bookId); // Vérifie si l'ID du livre est dans la liste "buyed"
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'achat :', error);
      return false;
    }
  };
  
  
  const handleBuyBook = async () => {
    const user = auth.currentUser;

    // Vérifier si l'utilisateur est connecté à l'application
    if (!user) {
        setShowPurchaseModal(true); // Si l'utilisateur n'est pas connecté, afficher la modal de connexion
        return;
    }

    try {
        // Procéder à l'achat si l'utilisateur est connecté
       // await BuyBook(bookDetails);
        alert("Achat réussi !");
    } catch (error) {
        console.error("Erreur lors de l'achat : ", error);
        alert("Une erreur s'est produite lors de l'achat. Veuillez réessayer.");
    }


  
};

const fetchCaractéristiques = async (bookId) => {
  try {
    // Référence au document
    const caracteristiquesRef = doc(db, 'livres', bookId);
    const caracteristiquesSnap = await getDoc(caracteristiquesRef);

    // Vérifier si le document existe
    if (caracteristiquesSnap.exists()) {
      const data = caracteristiquesSnap.data();

      // Mise à jour de l'état avec les données récupérées
      setCaracteristiques({
        annee: data.annee,         // Corrigé
        edition: data.edition,
        format: data.format,
        nbr_pages: data.nbr_pages
      });
    } else {
      console.log("Aucune donnée trouvée pour ce livre.");
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des caractéristiques :", error);
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
        // Récupérer le document du livre par son ID
        const bookDoc = doc(db, 'livres', bookId);
        const bookSnapshot = await getDoc(bookDoc);

        if (bookSnapshot.exists()) {
          // Extraire les avis du tableau 'revues'
          const bookData = bookSnapshot.data();
          setReviews(bookData.revues || []); // Défaut à un tableau vide si 'revues' est undefined
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
  
  const redirectToLogin = () => {
    window.location.href = '/login';
  };
//   const BuyBook = async (book) => {
//     try {
//       const user = auth.currentUser; // Vérifiez si l'utilisateur est connecté
//       if (!user) {
//         console.error("Utilisateur non connecté");
//         return;
//       }
  
//       let bookId = book.id.replace(/ /g, "_");
  
//       // Ajouter une entrée avec état "en cours" dans `ventes_direct`
//       const venteRef = await addDoc(collection(db, "ventes_direct"), {
//         user: user.uid,
//         auteur: book.author_id,
//         date: Timestamp.now(),
//         livre: book.id,
//         moyen: "à définir",
//         prix: book.price,
//         id: `${book.id}_${user.uid}`,
//         etat: "en cours",
//       });
  
//       console.log("Vente créée avec état 'en cours' dans 'ventes_direct'. ID :", venteRef.id);
  
//       // Générer le lien de paiement si le livre n'est pas gratuit
//       if (book.price > 0) {
//         const formData = new FormData();
//         formData.append("email", "papers@seeds.cm");
//         formData.append("token_app", "4fda55961a3152c09d67ede0d8ae2be9");
//         formData.append("montant", book.price.toString());
//         formData.append("image_link", book.coverUrl);
//         formData.append(
//           "description",
//           "Papers est une application mobile innovante pour les auteurs."
//         );
//         formData.append("success_lien", `https://votre-domaine/success.html?venteId=${venteRef.id}`);
//         formData.append("echec_lien", `https://votre-domaine/echec.html?venteId=${venteRef.id}`);
//         formData.append("code_produit", bookId);
//         formData.append("nom_produit", book.name);
  
//         const response = await axios.post(
//           "https://www.flash.seeds.cm/flash/Service/set_payment_link",
//           formData,
//           { headers: { "Content-Type": "multipart/form-data" } }
//         );
  
//         const data = response.data;
//         const lien_paiement = data.body.lien_paiement;
//         const lien_paiement_base64 = btoa(lien_paiement);
  
//         // Rediriger vers le lien de paiement
//         window.location.href = `https://flashsdk.seeds.cm/flash_checkout.html?d=${lien_paiement_base64}`;
//       } else {
//         // Si gratuit, traitez directement
//         await processPurchaseAndUpdateDB(book, user.uid);
//       }
//     } catch (error) {
//       console.error("Erreur lors de l'achat du livre :", error);
//     }
//   };
  

// const processPurchaseAndUpdateDB = async (book, userId) => {
//   try {
//     // Référence à l'utilisateur
//     const userRef = doc(db, "users", userId);
//     await updateDoc(userRef, {
//       buyed: arrayUnion(book.id), // Ajouter le livre à la liste des livres achetés
//     });

//     // Référence à l'auteur
//     const authorRef = doc(db, "auteurs", book.author_id);
//     await updateDoc(authorRef, {
//       balance: increment(book.price), // Ajouter le prix du livre au solde de l'auteur
//     });

//     console.log("Base de données mise à jour avec succès après l'achat.");
//   } catch (error) {
//     console.error("Erreur lors de la mise à jour de la base de données :", error);
//   }
// };


  
  // Fonction de traitement des paiements
// Fonction de traitement des paiements
// Fonction principale pour lancer l'achat du livre et créer un lien de paiement


// Fonction pour gérer l'achat d'un livre


const BuyBook = async (book) => {
  const db = getFirestore();
  const auth = getAuth();
  const user = auth.currentUser;

  // Vérifier si l'utilisateur est connecté
  if (!user) {
    alert("Veuillez vous connecter pour acheter ce livre.");
    return;
  }

  try {
    // 1. Préparer l'ID du livre pour le paiement
    let bookId = book.id.replace(/ /g, '_');
    console.log("ID du livre préparé pour le paiement :", bookId);

    // 2. Générer le lien de paiement
    const formData = new FormData();
    formData.append('email', "papers@seeds.cm"); // Utiliser l'email de l'utilisateur connecté
    formData.append('token_app', '4fda55961a3152c09d67ede0d8ae2be9');
    formData.append('montant', book.price.toString());
    formData.append('image_link', book.coverUrl);
    formData.append('description', 'Papers est une application mobile innovante pour les auteurs.');
    formData.append('pass', 'My$S3cr3t$Pap3rs'); // À éviter en production
    formData.append('success_lien', `https://papers.seeds.cm/payementspage/success.html?bookId=${bookId}`);
    formData.append('echec_lien', 'https://papers.seeds.cm/payementspage/echec.html');
    formData.append('code_produit', bookId);
    formData.append('nom_produit', book.name);

    console.log("Données envoyées pour le paiement :", Object.fromEntries(formData));

    const response = await axios.post(
      'https://www.flash.seeds.cm/flash/Service/set_payment_link',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );

    console.log("Réponse reçue du serveur :", response);

    const contentType = response.headers['content-type'];
    if (contentType && contentType.includes('application/json')) {
      const data = response.data;
      console.log("Données JSON reçues :", data);

      const { lien_paiement } = data.body;
      console.log("Lien de paiement récupéré :", lien_paiement);

      const lien_paiement_base64 = btoa(lien_paiement);
      console.log("Lien de paiement encodé en base64 :", lien_paiement_base64);

      // 3. Mettre à jour la base de données avant la redirection
      const userRef = doc(db, 'users', user.uid);
      const authorRef = doc(db, 'auteurs', book.hauteur);

      // Ajouter le livre à la liste des livres achetés de l'utilisateur
      await updateDoc(userRef, {
        buyed: arrayUnion(book.id),
      });

      // Enregistrer la vente dans la collection `ventes_direct`
      const venteData = {
        user: user.uid,
        auteur: book.hauteur,
        date: new Date().toISOString(),
        livre: book.id,
        moyen: "à définir", // Moyen de paiement
        prix: book.price,
        id: `${book.id}_${user.uid}`,
        etat: "en cours", // État initial de la vente
      };
      const venteRef = await addDoc(collection(db, 'ventes_direct'), venteData);

      // Incrémenter le solde de l'auteur
      await updateDoc(authorRef, {
        solde: increment(book.price),
      });

      // 4. Rediriger vers le lien de paiement
      window.location.href = `https://flashsdk.seeds.cm/flash_checkout.html?d=${lien_paiement_base64}`;
      console.log("Redirection vers le lien de paiement en cours...");
    } else {
      const htmlContent = response.data;
      const newWindow = window.open();
      newWindow.document.write(htmlContent);
      console.log("Ouverture du contenu HTML dans un nouvel onglet.");
    }
  } catch (error) {
    console.error('Erreur lors de la création du lien de paiement ou de la mise à jour de la base de données :', error);
    alert("Une erreur s'est produite lors de l'achat. Veuillez réessayer.");
  }
};


// Fonction pour traiter l'achat et mettre à jour la base de données
const processPurchaseAndUpdateDB = async (book) => {
  try {
    const user = auth.currentUser; // Récupérer l'utilisateur connecté
    if (!user) {
      console.error('Utilisateur non connecté');
      return;
    }

    console.log("Mise à jour de l'utilisateur :", user.uid);
    const userRef = doc(db, 'users', user.uid);

    // Mise à jour de l'utilisateur avec l'ID du livre acheté
    await updateDoc(userRef, {
      buyed: arrayUnion(book.id)
    });
    console.log("Mise à jour de l'utilisateur réussie : livre ajouté à l'achat.");

    // Création d'une nouvelle vente
    const venteData = {
      user: user.uid,
      auteur: book.authorId,
      date: Timestamp.now(),
      livre: book.id,
      moyen: "", // Vous pouvez spécifier le moyen de paiement
      prix: book.price,
      id: `${book.id}_${user.uid}`,
      etat: "en cours",
    };

    const venteRef = await addDoc(collection(db, "ventes_direct"), venteData);
    console.log("Nouvelle vente ajoutée avec succès :", venteRef.id);

    // Mise à jour de l'état de la vente
    await updateDoc(venteRef, {
      etat: "reussi", // Mettez à jour l'état de la vente
    });

    // Vérification de l'existence du livre
    const bookRef = doc(db, 'livres', book.id);
    const bookSnap = await getDoc(bookRef);
    if (bookSnap.exists()) {
      const bookData = bookSnap.data();
      const authorRef = doc(db, 'auteurs', bookData.author_id);
      
      // Mise à jour du solde de l'auteur
      await updateDoc(authorRef, {
        balance: increment(book.price)
      });
      console.log("Solde de l'auteur mis à jour avec succès.");
      
      // Ajout de la transaction à l'auteur
      await addDoc(collection(db, 'auteurs', bookData.author_id, 'transactions'), {
        book_id: book.id,
        price: book.price,
        timestamp: Timestamp.now()
      });
      console.log("Transaction ajoutée à l'auteur avec succès.");
    } else {
      console.error("Le livre n'existe pas dans la base de données.");
    }

    // Mise à jour de la base de données après l'achat
    await updateDatabaseAfterPurchase(book);
    console.log("Base de données mise à jour après l'achat.");

    // Gérer les modals pour le succès
    showSuccessModal();
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la base de données après l\'achat :', error);
    showErrorModal();
  }
};

// Exemples de fonctions pour afficher les modals
const showSuccessModal = () => {
  console.log('Affichage du modal de succès');
  // Implémentez le modal ici
};

const showErrorModal = () => {
  console.log('Affichage du modal d\'erreur');
  // Implémentez le modal ici
};

// Fonction pour mettre à jour la base de données après un achat
const updateDatabaseAfterPurchase = async (book) => {
  try {
    const user = auth.currentUser; // Récupérer l'utilisateur connecté
    if (!user) {
      console.error("Aucun utilisateur connecté");
      return;
    }

    console.log("Mise à jour des achats de l'utilisateur :", user.uid);
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, {
      purchases: arrayUnion({
        bookId: book.id,
        bookName: book.name,
        purchaseDate: new Date().toISOString(),
        amount: book.price
      })
    });

    console.log("Base de données mise à jour avec succès après l'achat.");
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la base de données après l'achat :", error);
  }
};



// Fonction pour gérer l'échec de paiement et enregistrer l'échec dans la base de données

// Page de succès (success.html) pour confirmer la transaction

// Logique d'affichage de chargement ou d'erreur
if (loading) {
  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <div className="text-center" style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
        <img src={logo} className="logo" alt="logo" />
        <Spinner animation="border" variant="primary" style={{marginTop:11}} />
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

  // const description = showFullDescription ? bookDetails.description || '' : bookDetails.small_summary || '';
  // const authorBio = showFullAuthorBio ? authorInfo.bio || '' : (authorInfo.small_bio || '');

  return (
    <Container className="" style={{padding:0}}>
      <div style={{padding:16,backgroundColor:'#0cc0df',display:'flex',flexDirection:'row',justifyContent:'space-between'}}>
        <img src={bookDetails.coverUrl} alt="Couverture du livre" style={{ width: '50%', height: '300px',borderRadius:10 }} />
        <div style={{justifyContent:'center',marginLeft:8}}>
          <p style={{color:'#096d98',fontWeight:'bold',width:140,fontSize:11}}>{bookDetails.genre}</p>
          <p style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: 'white',
              width: 120,
              marginVertical: 8,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
            {bookDetails.name}
          </p>
          <p style={{width:150,fontWeight:'regular',color:'white',fontSize:14}}>{bookDetails.small_summary}</p>
          <div style={{display:'flex',flexDirection:'row',marginVertical:16,alignItems:'center'}}>
            <Star color='yellow' size={8}/>
            <p style={{marginLeft:4,fontSize:8,marginTop:15}}>{averageNote}</p>
            <Users color='white' size={8} style={{marginLeft:4}}/>
            <p style={{marginLeft:4,fontSize:8,marginTop:15}}>{reviews.length}</p>
            <Button variant="" style={{height:8,fontSize:8,marginLeft:8,display:'flex',justifyContent:'center',backgroundColor:'white'}} onClick={() => setRatingModalVisible(true)}> <p style={{marginTop:-8}}>evaluer</p> </Button>
            
          </div>
          <p style={{width:140,fontWeight:'bold',color:'white',marginTop:5}} numberOfLines={2}>par {authorInfo.NomPrenom}</p>

        </div>
        <div style={{alignItems:'center'}}>
            <Share size={18} color={"#fff"}/>
            <Download size={18} color={"#fff"} />
            <Bookmark size={18} color={"#fff"}/>
        </div>
      </div>

      <div style={{ borderBottom: '6px solid lightgray', borderBottomColor: '#f9f9f9', display: "flex", justifyContent: 'space-between', padding: 16, alignItems: 'center' }}>
    <div>
      <p>Paiement unique</p>
      <p style={{ fontSize: 28, marginTop: -15 }}>{bookDetails.price} <span style={{ fontSize: 14 }}>FCFA</span></p>
    </div>
    <div>
    <Button
  style={{
    backgroundColor: isPurchased ? "#007bff" : "#12c066",
    color: "white",
    border: "none",
  }}
  onClick={async () => {
    if (isPurchased) {
      // Rediriger l'utilisateur vers la page de lecture si le livre a été acheté
      window.location.href = `https://play.google.com/store/apps/details?id=com.seedsoftengine.papers&pcampaignid=web_share`;
    } else {
      // Appeler la fonction BuyBook pour initier l'achat du livre
      try {
        await BuyBook(bookDetails); // Assurez-vous que 'book' est défini et contient les bonnes données
      } catch (error) {
        console.error("Erreur lors de l'appel à BuyBook :", error);
      }
    }
  }}
  aria-label={isPurchased ? "Lire le livre" : "Obtenir le livre"} // Ajout d'accessibilité
>
  {isPurchased ? "Lire" : "OBTENIR"} {/* Afficher "Lire" si le livre est acheté, sinon "OBTENIR" */}
</Button>


    </div>

    {/* Modal pour vérifier la connexion de l'utilisateur */}
  


{/* <button onClick={redirectToLogin}>
  Se connecter
</button> */}
  </div>


      
      <div style={{borderBottom:'6px solid lightgray',borderBottomColor:'#f9f9f9',padding:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <p style={{fontSize:24,fontWeight:"bold"}}>séries</p>
          <Button style={{color:'#0cc0df',border:'none'}} variant="" onClick={() => setShowEpisodes(!showEpisodes)}>
              {showEpisodes ? 'Masquer les épisodes' : 'Afficher les épisodes'}
            </Button>
        </div>
       

        {showEpisodes && (
              <ListGroup className="mt-2">
                {bookDetails.episodes.map((episode, index) => (
                  <ListGroup.Item key={index}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{flex:1,display:'flex'}}>
                  <p>#{index + 1} </p>
                        <img
                          src={episode.image}
                          alt={`Épisode ${index + 1}`}
                          className="img-fluid"
                          style={{ width: 38, height: 48, borderColor: 'lightgray', borderWidth: 0.7, marginLeft: 8 }}
                        />
                        <div style={{marginLeft:16}}>
                          <h5 style={{fontSize:16,fontWeight:'bold'}}>{episode.titre}</h5>
                          <p style={{fontSize:14,width:100}}>{episode.description}</p>
                        </div>
                  </div>
                  <p style={{marginRight:'auto',marginTop:40,fontSize:8}}><small>{new Date(episode.date).toLocaleDateString()}</small></p>
                  </div>
                        

                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
      </div>

      <div style={{borderBottom:'6px solid lightgray',borderBottomColor:'#f9f9f9',padding:16}}>
        <p style={{fontSize:24,fontWeight:"bold"}}>Description</p>
        {showFullDescription ? bookDetails.summary : `${bookDetails.summary?.substring(0, 150)}...`}
        <br/>
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

      <div style={{borderBottom:'6px solid lightgray',borderBottomColor:'#f9f9f9', justifyContent:'space-between',padding:16,alignItems:'center'}}>
        <p style={{fontSize:24,fontWeight:"bold"}}>Auteur</p>
        <div style={{display:'flex',padding:8,backgroundColor:'#132d59',width:'100%'}}>
        <img
  src={authorInfo.photoUrl || 'https://www.gravatar.com/avatar/?d=mp'}
  onError={(e) => {
    e.target.onerror = null; // Empêche une boucle infinie
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

        <div style={{marginLeft:8}}>
          <p style={{fontSize:14,fontWeight:'bold',color:'white'}}>{authorInfo.NomPrenom}</p>
          <p style={{fontSize:10, color:'white',marginTop:-10}}>{authorInfo.Metier}</p>
        </div>
        </div>
        <p>{authorInfo.bio}</p>
        <Button variant="outline-primary" onClick={() => setShowFullAuthorBio(!showFullAuthorBio)}>
            {showFullAuthorBio ? 'Lire moins' : 'Lire plus'}
          </Button>
      </div>

      {/* Avis */}
<div style={{borderBottom:'6px solid lightgray',borderBottomColor:'#f9f9f9', justifyContent:'space-between',padding:16,alignItems:'center'}}>
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

{/* Modal pour évaluer le livre */}
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